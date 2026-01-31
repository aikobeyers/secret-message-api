require('dotenv').config({path: '../.env'});

const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');

const connectToDatabase = require('../lib/db'); // Import connection logic
const Quote = require('../models/quote');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/authMiddleware');
const TdQuote = require('../models/tdQuote');


const app = express();
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    allowedHeaders: '*',
    allowCredentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.options('*', cors()); // Handle preflight requests

// Routes

// Non TD quotes
// Get all quotes
router.get('/', verifyToken, async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        console.log('Getting quotes');
        const quotes = await Quote.find();
        res.json(quotes);
    } catch (err) {
        console.error('Error fetching quotes:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// Get random quote to display
router.get('/random', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        const quotes = await Quote.find({display: true});
        const index = Math.floor(Math.random() * [...quotes].length);

        res.json([...quotes][index]);
    } catch (err) {
        console.error('Error fetching quotes:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// Get a single quote by ID
router.get('/:id', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        const quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({message: 'Quote not found'});
        res.json(quote);
    } catch (err) {
        console.error('Error fetching quote by ID:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// Create a new quote
router.post('/', verifyToken, async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection

        const quote = new Quote({quote: req.body.quote, display: req.body.display});
        const newQuote = await quote.save();
        res.status(201).json(newQuote);

    } catch (err) {
        console.error('Error creating quote:', err);
        res.status(400).json({message: 'Bad Request. ' + err.message + ' received: ' + req.body.quote + ' and ' + req.body.display});
    }
});

// Update a quote
router.put('/:id', verifyToken, async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        console.log('Putting');
        if (!req.params.id) {
            return res.status(404).json({message: 'ID not found'});
        }
        const quote = await Quote.findByIdAndUpdate(
            req.params.id,
            {quote: req.body.quote, display: req.body.display},
            {new: true}
        );

        if (!quote) return res.status(404).json({message: 'Quote not found'});
        res.json(quote);
    } catch (err) {
        console.error('Error updating quote:', err);
        res.status(400).json({message: 'Bad Request. ' + err.message});
    }
});

// Delete a quote
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        console.log('Looking up quote');
        const quote = await Quote.findByIdAndDelete(req.params.id);
        console.log('Found quote:' + JSON.stringify(quote));
        if (!quote) return res.status(404).json({message: 'Quote not found'});
        res.json({message: 'Quote deleted successfully'});
    } catch (err) {
        console.error('Error deleting quote:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

//TD Quotes
// Get all TD quotes or filter by query parameters
router.get('/tdquotes/get', /*verifyToken,*/ async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        const quoteQuery = req.query.quoteQuery;
        const byFilter = req.query.by;
        
        let quotes;
        
        if (!quoteQuery && !byFilter) {
            quotes = await TdQuote.find();
        } else {
            const query = {};
            
            if (quoteQuery) {
                query.value = {$regex: quoteQuery, $options: 'i'};
            }
            
            if (byFilter) {
                const byValues = byFilter.split(',').map(val => val.trim());
                if (byValues.length === 1) {
                    query.by = {$regex: byValues[0], $options: 'i'};
                } else {
                    query.$or = byValues.map(val => ({by: {$regex: val, $options: 'i'}}));
                }
            }

            quotes = await TdQuote.find(query);
        }
        
        res.json(quotes);
    } catch (err) {
        console.error('Error fetching quotes:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// Get all unique authors
router.get('/tdquotes/authors', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        const authors = await TdQuote.distinct('by');
        res.json(authors);
    } catch (err) {
        console.error('Error fetching authors:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// Upload TD quotes from CSV
router.post('/tdquotes/upload'/*, verifyToken*/, async (req, res) => {
    try {
        const csvContent = req.body.csv || req.body;
        
        if (!csvContent) {
            return res.status(400).json({message: 'No CSV content provided'});
        }

        await connectToDatabase(); // Ensure database connection

        const quotes = [];
        const errors = [];
        let rowIndex = 0;

        // Parse CSV from raw text content
        await new Promise((resolve, reject) => {
            Readable.from([csvContent])
                .pipe(csv())
                .on('data', (row) => {
                    rowIndex++;
                    try {
                        // Map CSV columns: Name -> by, Quote -> value, Date -> date
                        const name = row['Name'] || row['name'];
                        const quote = row['Quote'] || row['quote'];
                        const date = row['Date'] || row['date'];

                        // Validate required fields
                        if (!name || !quote || !date) {
                            errors.push({
                                row: rowIndex,
                                error: 'Missing required fields: Name, Quote, or Date'
                            });
                            return;
                        }

                        quotes.push(new TdQuote({
                            value: quote,
                            by: name,
                            date: date
                        }));
                    } catch (err) {
                        errors.push({
                            row: rowIndex,
                            error: err.message
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (quotes.length === 0) {
            return res.status(400).json({
                message: 'No valid quotes found in CSV',
                errors
            });
        }

        // Insert all quotes into database
        const savedQuotes = await TdQuote.insertMany(quotes);

        res.status(201).json({
            message: `Successfully uploaded ${savedQuotes.length} quotes`,
            count: savedQuotes.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('Error uploading TD quotes:', err);
        res.status(400).json({message: 'Error processing CSV file: ' + err.message});
    }
});


//User management
// User registration
router.post('/auth/register', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        const {username, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({username, password: hashedPassword});
        await user.save();
        res.status(201).json({message: 'User registered successfully'});
    } catch (error) {
        res.status(500).json({error: 'Registration failed'});
    }
});

// User login
router.post('/auth/login', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        const {username, password} = req.body;
        const user = await User.findOne({username});
        if (!user) {
            return res.status(401).json({error: 'Authentication failed'});
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({error: 'Authentication failed'});
        }
        const token = jwt.sign({userId: user._id}, 'your-secret-key', {
            expiresIn: '1h',
        });

        res.status(200).json({token});
    } catch (error) {
        res.status(500).json({error: 'Login failed'});
    }
});

// verify token
router.post('/auth/verify', verifyToken, async (req, res) => {
    try {
        const existingToken = req.body.token;

        const decoded = jwt.verify(existingToken, 'your-secret-key');
        const token = jwt.sign({userId: decoded.userId}, 'your-secret-key', {
            expiresIn: '1h',
        });

        res.status(200).json({token});
    } catch (error) {
        res.status(500).json({error: 'Token refresh failed'});
    }
});



//TODO endpoint for refreshing token

// Use the router
app.use('/.netlify/functions/server/', router);

//comment for deploy
//app.listen(3222, () => console.log('Listening on port 3222'));
// Serverless handler
const handler = serverless(app);
module.exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false; // Avoid Lambda freezing due to open connections
    return await handler(event, context);
};
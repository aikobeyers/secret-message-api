require('dotenv').config({path: '../.env'});

const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const connectToDatabase = require('../lib/db'); // Import connection logic
const Quote = require('../models/quote');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/authMiddleware');
const TdQuote = require('../models/tdQuote');


const app = express();
const router = express.Router();

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
// Get all TD quotes
router.get('/tdquotes/all', /*verifyToken,*/ async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        console.log('Getting all TD quotes');
        const quotes = await TdQuote.find();
        console.log('Quotes found: ' + quotes);
        res.json(quotes);
    } catch (err) {
        console.error('Error fetching quotes:', err);
        res.status(500).json({message: 'Internal Server Error'});
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
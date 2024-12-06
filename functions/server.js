require('dotenv').config({ path: '../.env' });

const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const connectToDatabase = require('../lib/db'); // Import connection logic
const Quote = require('../models/quote');

const app = express();
const router = express.Router();

// Middleware
app.use(express.json());
app.use(cors(/*{
    origin: 'http://localhost:3000', // Replace with your Next.js app's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}*/));
app.options('*', cors()); // Handle preflight requests

// Routes

// Get all quotes
router.get('/', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        console.log('Getting quotes');
        const quotes = await Quote.find();
        res.json(quotes);
    } catch (err) {
        console.error('Error fetching quotes:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get a single quote by ID
router.get('/:id', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        const quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Quote not found' });
        res.json(quote);
    } catch (err) {
        console.error('Error fetching quote by ID:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Create a new quote
router.post('/', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        console.log(req.body.quote);
        if(req.body._id){
            const quote = await Quote.findByIdAndUpdate(
                req.body._id,
                { quote: req.body.quote, display: req.body.display },
                { new: true }
            );
            res.status(201).json(quote);
        } else {
            const quote = new Quote({ quote: req.body.quote, display: req.body.display });
            const newQuote = await quote.save();
            res.status(201).json(newQuote);

        }

    } catch (err) {
        console.error('Error creating quote:', err);
        res.status(400).json({ message: 'Bad Request. ' + err.message + ' received: ' + req.body.quote + ' and ' + req.body.display});
    }
});

// Update a quote
router.put('/update', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        console.log('Putting');
        const quote = await Quote.findByIdAndUpdate(
            req.body._id,
            { quote: req.body.quote, display: req.body.display },
            { new: true }
        );

        if (!quote) return res.status(404).json({ message: 'Quote not found' });
        res.json(quote);
    } catch (err) {
        console.error('Error updating quote:', err);
        res.status(400).json({ message: 'Bad Request. ' + err.message });
    }
});

// Delete a quote
router.delete('/:id', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        console.log('Looking up quote');
        const quote = await Quote.findByIdAndDelete(req.params.id);
        console.log('Found quote:' + JSON.stringify(quote));
        if (!quote) return res.status(404).json({ message: 'Quote not found' });
        res.json({ message: 'Quote deleted successfully' });
    } catch (err) {
        console.error('Error deleting quote:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Use the router
app.use('/.netlify/functions/server/', router);

// Serverless handler
const handler = serverless(app);
module.exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false; // Avoid Lambda freezing due to open connections
    return await handler(event, context);
};
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
app.use(cors());

// Routes

// Get all quotes
router.get('/', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
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
        const quote = new Quote({ quote: req.body.quote });
        const newQuote = await quote.save();
        res.status(201).json(newQuote);
    } catch (err) {
        console.error('Error creating quote:', err);
        res.status(400).json({ message: 'Bad Request' });
    }
});

// Update a quote
router.put('/:id', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        const quote = await Quote.findByIdAndUpdate(
            req.params.id,
            { quote: req.body.quote },
            { new: true }
        );

        if (!quote) return res.status(404).json({ message: 'Quote not found' });
        res.json(quote);
    } catch (err) {
        console.error('Error updating quote:', err);
        res.status(400).json({ message: 'Bad Request' });
    }
});

// Delete a quote
router.delete('/:id', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure database connection
        const quote = await Quote.findByIdAndDelete(req.params.id);
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
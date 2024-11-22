const express = require('express');
const serverless = require("serverless-http");

// const mongoose = require('mongoose');
// import express from "express"
// import mongoose from "mongoose";

// import {config} from "dotenv";

// import quoteRoutes from "../routes/quoteRoutes.js";
// import Quote from "../models/quote.js";

// config();

const app = express();
const router = express.Router();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use(express.json());

// MongoDB connection
/*mongoose.connect(process.env.MONGO_URI, {
    dbName: 'AikoBeyers',

})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));*/
// Get all quotes
/*router.get('/', async (req, res) => {
    try {
        const quotes = await Quote.find();
        res.json(quotes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a single quote by ID
router.get('/:id', async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Quote not found' });
        res.json(quote);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new quote
router.post('/', async (req, res) => {
    const quote = new Quote({
        quote: req.body.quote
    });

    try {
        const newQuote = await quote.save();
        res.status(201).json(newQuote);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a quote
router.put('/:id', async (req, res) => {
    try {
        const quote = await Quote.findByIdAndUpdate(
            req.params.id,
            {
                quote: req.body.quote

            },
            { new: true }
        );

        if (!quote) return res.status(404).json({ message: 'Quote not found' });
        res.json(quote);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a quote
router.delete('/:id', async (req, res) => {
    try {
        const quote = await Quote.findByIdAndDelete(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Quote not found' });
        res.json({ message: 'Quote deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});*/

router.get("/", (req, res) => {
    res.send("App is running..");
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.use("/.netlify/functions/server", router);
module.exports.handler = serverless(app);
// app.use('/api/quotes', quoteRoutes);
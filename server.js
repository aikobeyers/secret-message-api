// const express = require('express');
// const mongoose = require('mongoose');
import express from "express"
import mongoose from "mongoose";

import {config} from "dotenv";

import quoteRoutes from "./routes/quoteRoutes.js";

config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    dbName: 'AikoBeyers',

})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.use('/api/quotes', quoteRoutes);
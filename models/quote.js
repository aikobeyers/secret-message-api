// const mongoose = require('mongoose');
import mongoose from "mongoose";

const QuoteSchema = new mongoose.Schema({
    quote: { type: String, required: true}
})

export default mongoose.model('Quote', QuoteSchema)

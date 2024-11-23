const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
    quote: { type: String, required: true},
    display: { type: Boolean, required: true}
})


module.exports = mongoose.model('Quote', QuoteSchema);

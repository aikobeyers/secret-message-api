const mongoose = require('mongoose');

const tdQuoteSchema = new mongoose.Schema({
    value: { type: String, required: true},
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'TdQuoteAuthor', required: true},
    date: { type: String, required: true}
})

module.exports = mongoose.model('TdQuote', tdQuoteSchema);
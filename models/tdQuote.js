const mongoose = require('mongoose');

const tdQuoteSchema = new mongoose.Schema({
    value: { type: String, required: true},
    by: { type: String, required: true},
    date: { type: String, required: true}
})

module.exports = mongoose.model('TdQuote', tdQuoteSchema);
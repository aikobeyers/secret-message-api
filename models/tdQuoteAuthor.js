const mongoose = require('mongoose');

const tdQuoteAuthorSchema = new mongoose.Schema({
    name: { type: String, required: true},
    score: { type: Number, required: true},
})

module.exports = mongoose.model('TdQuoteAuthor', tdQuoteAuthorSchema);
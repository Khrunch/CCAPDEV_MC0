const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
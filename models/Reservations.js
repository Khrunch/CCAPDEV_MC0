const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null if walk-in or anonymous player record
    bookedByName: String, // For "Anonymous" or "Walk-in" display [cite: 20, 23]
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true }, // Calculated as startTime + 2 hours 
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },

    walkInPlayerName: String, // For walk-in reservations without user accounts
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reservation', reservationSchema);
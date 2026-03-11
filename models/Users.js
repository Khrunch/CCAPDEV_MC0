const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['player', 'owner'], default: 'player' },
    bio: { type: String, default: "" },
    courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court' },
    // This allows the user to save multiple favorite courts
    savedCourts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Court' }]
}, { timestamps: true }); // timestamps automatically adds createdAt (Member Since)

module.exports = mongoose.model('User', userSchema);
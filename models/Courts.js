const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
    name: {type: String, required: true, unique: true},
    location: {
        address: {type: String, required: true},
        coordinates: {
        lat: {type: Number, required: true},
        lng: {type: Number, required: true}
        }
    },
    description: String,
    type: {type:String, enum: ['indoor', 'outdoor', 'Indoor', 'Outdoor'], required: true},
    surface: {type: String, default: "Hardcourt"},
    totalCourts: {type: Number, default: 1},
    rates: {
        weekday: {type: Number},
        weekend: {type: Number}
    },
    amenities: [{type: String}],
    rules: [{type: String}],
    ownerId: {type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    averageRating: {type: Number, default: 0}
});

module.exports = mongoose.model('Court', courtSchema);
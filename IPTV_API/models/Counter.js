const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // e.g., 'live_stream_id', 'vod_stream_id'
    sequence_value: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);

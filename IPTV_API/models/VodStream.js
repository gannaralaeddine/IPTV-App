const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const vodStreamSchema = new mongoose.Schema({
    vod_id: { type: Number, unique: true },
    name: { type: String, unique: true },
    title: { type: String, default: '' },
    category_id:  { type: Number, required: true },
    file: { type: String, unique: true },
    stream_type: { type: String, default: '' },
    stream_icon: {type: String, default: ''},
    added: { type: Date, default: Date.now() },
    direct_source: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    rating_5based: { type: Number, default: 0 },
    is_adult: { type: Number, default: 0 },
    year:  { type: String, default: '' },
    duration:  { type: String, default: '' },
    director: { type: String, default: '' },
    plot:  { type: String, default: '' },
    releasedate: { type: Date, default: '' },
    genre: { type: String, default: '' },
    casts: { type: String, default: '' }
});
vodStreamSchema.plugin(AutoIncrement, { inc_field: 'vod_id', start_seq: 1 });

module.exports = mongoose.model('VodStream', vodStreamSchema);

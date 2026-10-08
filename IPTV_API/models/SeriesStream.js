const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const seriesStreamSchema = new mongoose.Schema({
    series_id: {
        type: Number,
        unique: true
    },
    name: {type: String, unique: true},
    category_id: { type: Number, required: true },
    stream_icon: {type: String, default: ''},
    added: { type: Date, default: Date.now },
    direct_source: { type: String, default: '' },
    container_extension: { type: String, default: 'mp4' },
    description: String,
    cast: String,
    director: String,
    genre: String,
    release_date: String,
    rating: String
});
seriesStreamSchema.plugin(AutoIncrement, { inc_field: 'series_id', start_seq: 1 });

module.exports = mongoose.model('SeriesStream', seriesStreamSchema);

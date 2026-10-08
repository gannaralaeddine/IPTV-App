const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const liveStreamSchema = new mongoose.Schema({
    stream_id: {
        type: Number,
        unique: true
    },
    name: { type: String, unique: true },
    category_id:  { type: Number },
    file: { type: String, unique: true },
    stream_icon: {type: String, default: ''},
    tv_archive: Number,
    tv_archive_duration: Number,
    custom_sid: String,
    added: { type: Date, default: Date.now() },
    description: {type: String, default: ''},
});
liveStreamSchema.plugin(AutoIncrement, { inc_field: 'stream_id', start_seq: 1 });

module.exports = mongoose.model('LiveStream', liveStreamSchema);

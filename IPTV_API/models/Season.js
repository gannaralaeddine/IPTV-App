const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const seasonSchema = new mongoose.Schema({
    season_id: {
        type: Number,
        unique: true
    },
    series_id: { 
        type: Number, 
        required: true,
        ref: 'SeriesStream'
    },
    season_number: { 
        type: Number, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    cover: { 
        type: String, 
        default: '' 
    },
    added: { 
        type: Date, 
        default: Date.now 
    }
});

// Ensure unique season per series
seasonSchema.index({ series_id: 1, season_number: 1 }, { unique: true });

seasonSchema.plugin(AutoIncrement, { inc_field: 'season_id', start_seq: 1 });

module.exports = mongoose.model('Season', seasonSchema);

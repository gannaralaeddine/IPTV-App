const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const episodeSchema = new mongoose.Schema({
    episode_id: {
        type: Number,
        unique: true
    },
    series_id: { 
        type: Number, 
        required: true,
        ref: 'SeriesStream'
    },
    season_id: { 
        type: Number, 
        required: true,
        ref: 'Season'
    },
    season_number: { 
        type: Number, 
        required: true 
    },
    episode_number: { 
        type: Number, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    file: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    duration: { 
        type: String, 
        default: '' 
    },
    added: { 
        type: Date, 
        default: Date.now 
    }
});

// Ensure unique episode per season
episodeSchema.index({ season_id: 1, episode_number: 1 }, { unique: true });

episodeSchema.plugin(AutoIncrement, { inc_field: 'episode_id', start_seq: 1 });

module.exports = mongoose.model('Episode', episodeSchema);

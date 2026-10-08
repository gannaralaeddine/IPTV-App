const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const seriesCategorySchema = new mongoose.Schema({
    category_id: {
        type: Number,
        unique: true
    },
    category_name: { type: String, unique: true },
    parent_id: { type: Number, default: 0 }
});

// Apply plugin only if model is not already compiled
if (!mongoose.models.SeriesCategory)
{
    seriesCategorySchema.plugin(AutoIncrement, {inc_field: 'category_id', id: 'series_category_id_counter', start_seq: 1});
}

module.exports = mongoose.models.SeriesCategory || mongoose.model('SeriesCategory', seriesCategorySchema);


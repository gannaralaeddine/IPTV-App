const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const vodCategorySchema = new mongoose.Schema({
    category_id: {
        type: Number,
        unique: true
    },
    category_name: { type: String, unique: true },
    parent_id: { type: Number, default: 0 }
});
vodCategorySchema.plugin(AutoIncrement, { inc_field: 'category_id', id: 'vod_category_id', start_seq: 1 });

module.exports = mongoose.model('VodCategory', vodCategorySchema);

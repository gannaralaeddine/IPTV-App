const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const liveCategorySchema = new mongoose.Schema({

    category_id: {
        type: Number,
        unique: true
    },
    category_name: { type: String },
    parent_id: { type: Number, default: 0 }
});
liveCategorySchema.plugin(AutoIncrement, { inc_field: 'category_id', start_seq: 1 });

module.exports = mongoose.model('LiveCategory', liveCategorySchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const searchSchema = new Schema({
    postId: {
        type: String,
        required: true,
        unique: true
    },

    userId: {
        type: String,
        required: true,
        index: true
    },

    content: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        required: true
    },

}, { timestamps: true });

// searchSchema.index({ content: 'text', title: "text" });
searchSchema.index({ content: 'text'});
searchSchema.index({ createdAt: -1 });

const Search = mongoose.model('Search', searchSchema);
module.exports = Search; 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Post schema
const postSchema = new Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId,  
        ref: 'User', 
        required: true 
    },

    content: { 
        type: String, 
        required: true 
    },

    imageUrls: [{ 
        type: String 
    }],

    createdAt: { 
        type: Date, 
        default: Date.now 
    },

    updatedAt: { 
        type: Date, 
        default: Date.now 
    },

}, { timestamps: true });


// Create the Post model index for searching with Text
postSchema.index({ content: 'text' });

// Create the Post model
// module.exports = mongoose.model('Post', postSchema);

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
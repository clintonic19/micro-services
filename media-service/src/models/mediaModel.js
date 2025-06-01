const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Media schema
const mediaSchema = new Schema({
    publicId :{
        type: String,
        required: true
    },

    originalName :{
        type: String,
        required: true
    },

     mimeType :{
        type: String,
        required: true
    },

     url :{
        type: String,
        required: true
    },

    user: { 
        type: mongoose.Schema.Types.ObjectId,  
        ref: 'User', 
        required: true 
    },
}, { timestamps: true } );




const Media = mongoose.model('Media', mediaSchema);
module.exports = Media;

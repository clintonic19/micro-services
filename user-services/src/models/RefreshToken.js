const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const refreshTokenSchema = new Schema({
    token : { 
        type: String, 
        required: true, 
        unique: true
    },
    
    user : { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required : true
    },

    expiresAt : {
        type: Date,
        required: true
    }
}, {timestamps: true} );

refreshTokenSchema.index({expiresAt: 1 }, {expireAfterSeconds : 0})

// module.exports = refreshTokenSchema;
module.exports = mongoose.model('refreshToken', refreshTokenSchema);

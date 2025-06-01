const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const argon2 = require('argon2');

const userSchema = new Schema({
    username: { type: String, required: true, unique: true, trim: true },
    
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
   
    password: { type: String, required: true },
    
    createdAt: { type: Date, default: Date.now },

}, {timestamps: true} );

// Pre-save hook to hash the password before saving the user
// This will only hash the password if it is new or modified
userSchema.pre('save', async function(next) {
    //HASHING PASSWORD USING ARGON2
    // Check if the password is modified or new
    if (this.isModified('password')) {
        try {
            this.password = await argon2.hash(this.password);
        } catch (error) {
            return next(error);
        }
    }
   
});


// Method to compare password
userSchema.methods.comparePassword = async function(password) {
    try {
        return await argon2.verify(this.password, password);
    } catch (error) {
        throw new Error('Password Do Not Match');
    }
};

// Method to get user details without password
userSchema.index({username:'text'})

module.exports = mongoose.model('User', userSchema);

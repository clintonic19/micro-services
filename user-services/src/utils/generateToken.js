const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken'); // Assuming you have a RefreshToken model

const generateToken = async (user) => {
    const accessToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "60m" }
    );
  
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // refresh token expires in 1 day.
  
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt,
    });
  
    return { accessToken, refreshToken };
  };

// const generateToken = async (res, userId) =>{
//    try {
//         const token = jwt.sign({userId}, process.env.JWT_SECRET, {
//             // expiresIn: process.env.JWT_EXPIRES_IN
//             expiresIn: "1h"
//         });

//         res.cookie('jwt', token, {
//             httpOnly: true, //XSS protection
//             secure : process.env.NODE_ENV === "production",
//             sameSite: "strict", //CSRF protection or attack
//             maxAge: 7 * 24 * 60 * 60 * 1000,
//         });
//    } catch (error) {
//         return res?.status(500).json({ message: error.message });       
//    }
//     return token;
// }

module.exports = generateToken;

//Local Imports
const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const logger = require("../utils/logger");
const { signUpValidation, loginUserValidation } = require('../utils/validation');

//User Register
// const registerUser = async (req, res ) => {
//     logger.info("User Registration")
//     try {
//         //Validate user fields from user Schema
//         const { error } = signUpValidation(req.body);
//         if (error) {
//             logger.warn("Error in Validation", error.details[0].message);
//            return res.status(400).json({
//                 status: "error",
//                 message: error.details[0].message,
//             });            
//         }

//         //GET USER DATA FROM REQUEST BODY
//         const { email, username, password } = req.body;
//         const user = await User.findOne({ $or: [{email}, {username}]})
//         // const user = await User.create({email, username})

//         //Check if user already exists in DB
//         if (user){
//             logger.warn("User Already Exist");
//            return res.status(400).json({
//                 status: "error",
//                 message: "User Already Exist",
//             });
//         }

//         //CREATE NEW USER IN DB
//         const newUser = new User({ username, email, password });
//         // const newUser = await User.create({ username, email, password });
//         await newUser.save();
//         logger.info("User Created Successfully", newUser);

//         //Generate Access and Refresh Token
//     const {accessToken, refreshToken } = await generateToken(user);
//     // const { token } = await generateToken(user);
//             return res.status(201).json({
//                 status : "successful",
//                 message: "User Created Successfully",
//                 // token,
//                 accessToken,
//                 refreshToken
//             })
//     } catch (error) {
//             logger.error("An error occurred during registration", error) 
//             console.log(error) 
//             return res.status(400).json({
//                 status: "error",
//                 message: "Internal Server Error",
//             });     
//     }

// }

const registerUser = async(req, res)=>{
    logger.info("User Registration");
    try {
        //validate the schema
        //Validate Register user fields from user Schema
        const { error } = signUpValidation(req.body);
        if (error) {
          logger.warn("Validation error", error.details[0].message);
          return res.status(400).json({
            success: false,
            message: error.details[0].message,
          });
        }

        //GET USER DATA FROM REQUEST BODY
        const { email, password, username } = req.body;

        //FIND USER IN DB
        let user = await User.findOne({ $or: [{ email }, { username }] });
        //Check if user already exists in DB
        if (user) {
          logger.warn("User already exist");
          return res.status(400).json({
            success: false,
            message: "User already exists",
          });
        }
        //CREATE NEW USER IN DB    
        user = new User({ username, email, password });
        await user.save();
        logger.warn("User saved successfully", user._id);
        
        //CREATE GENERATE TOKEN
        //Generate Access and Refresh Token
        const { accessToken, refreshToken } = await generateToken(user);
        res.status(201).json({
          success: true,
          message: "User registered successfully!",
          accessToken,
          refreshToken,
        });

      } catch (error) {
        logger.error("Registration error occurred", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
}

// User login
const loginUser = async(req, res)=>{
  try {
    logger.info("User Login Endpoint");

    //Validate Register user fields from user Schema
    const { error } = loginUserValidation(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    //GET USER DATA FROM REQUEST BODY
    const { email, password } = req.body;
    //FIND USER IN DB
    const user = await User.findOne({ email });
    //Check if user already exists in DB
    if (!user) {
      logger.warn("User not found");
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    //CHECK IF PASSWORD MATCHES
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn("Invalid email and password");
      return res.status(400).json({
        success: false,
        message: "Invalid email and password",
      });
    }
    //CREATE GENERATE TOKEN
    //Generate Access and Refresh Token
    const { accessToken, refreshToken } = await generateToken(user);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      refreshToken,
      userId: user._id,
    });

  } catch (error) {
    logger.error("Login error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
    console.log(error);
    
  }
}

// Refresh Token
const refreshTokenHandler = async(req, res) =>{
  logger.info("RefreshToken Endpoint");
  try {
      //GET USER DATA FROM REQUEST BODY
      const { refreshToken } = req.body;

      //Check if Token is Found or Not....
      if(!refreshToken) {
        logger.warn("Refresh token not found");
        return res.status(400).json({
          success: false,
          message: "Refresh token not found",
        });
      }

      //FIND REFRESH TOKEN FROM DB
      const securedToken = await RefreshToken.findOne({ token: refreshToken })

      //CHECK IF secureToken is Available
      if(!securedToken || securedToken.expiresAt < new Date()){
        logger.warn("Invalid Credential or Token")
        return res.status(401).json({
          success: false,
          message: "Invalid Credential or Token"
        });
      }

      //FIND USER FROM DB
      const user = await User.findById(securedToken.user)
      if(!user) {
        logger.warn("User not found")
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }
      //CREATE GENERATE TOKEN
      const { accessToken : newAccessToken, refreshToken : newRefreshToken } = await generateToken(user);

      //DELETE OLD REFRESH TOKEN FROM DB
      // await RefreshToken.findByIdAndDelete({ id: securedToken._id });
      await RefreshToken.deleteOne({ id: securedToken._id });
      
      //SAVE THE NEW REFRESH TOKEN TO DB
      // await RefreshToken.findByIdAndUpdate(securedToken._id, { token: newRefreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, { new: true });
     
      //SEND THE RESPONSE TO CLIENT
      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

    
  } catch (error) {
    logger.error("RefreshToken error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
    console.log(error);
    
  }

}

// User logout
const logoutUser = async(req, res)=>{
  logger.info("User Logout Endpoint");
  try {
    //GET USER DATA FROM REQUEST BODY
    const { refreshToken } = req.body;

    // Check if Token is Found or Not....
      if(!refreshToken) {
        logger.warn("Refresh token not found");
        return res.status(400).json({
          success: false,
          message: "Refresh token not found",
        });
      }
      
      const result = await RefreshToken.deleteOne({ token: refreshToken });
      logger.info("Token Deleted Successfully");

      //UPDATED CODE 
    //   if (result.deletedCount === 0) {
    //   logger.warn("Token not found in DB, nothing deleted");
    // } else {
    //   logger.info("Token Deleted Successfully");
    // }

       res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });

    //FIND REFRESH TOKEN IN DB
    // const token = await RefreshToken.findOne({ token: refreshToken });
    // //Check if token is found or not
    // if (!token) {
    //   logger.warn("Token not found");
    //   return res.status(400).json({
    //     success: false,
    //     message: "Token not found",
    //   });
    // }
    // //DELETE THE REFRESH TOKEN FROM DB
    // await RefreshToken.findByIdAndDelete(token._id);
    // // await RefreshToken.deleteOne(token._id);
    // res.status(200).json({
    //   success: true,
    //   message: "User logged out successfully",
    // });
  } catch (error) {
    logger.error("Logout error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
    registerUser,
    loginUser,
    refreshTokenHandler,
    logoutUser
    
}
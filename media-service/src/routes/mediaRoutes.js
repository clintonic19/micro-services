const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import the controller functions
const { uploadFile, getAllUploadedFiles } = require('../controllers/mediaControllers');
const { authenticateUser } = require("../middlewares/auth");
const logger = require("../utils/logger");
const  { uploadStorage } = require('../utils/multerConfig');

//ROUTES
router.post('/uploadFile', authenticateUser, (req, res, next) => {
    logger.info("Uploading file to Cloudinary");
    uploadStorage(req, res, function(err){
        // Check for errors during file upload
        // If there is an error, handle it
        // If the error is a multer error, handle it separately
        if(err instanceof multer.MulterError){
            logger.error("Multer Error during upload: ", err);
            return res.status(400).json({
                success: false,
                message: "Multer Error: " + err.message,
                stack: err.stack
            });
        }else if(err){
            logger.error("Unknown Error during file upload: ", err);
            return res.status(500).json({
                success: false,
                message: "Unknown Error during file upload: " + err.message,
                stack: err.stack
            });
        }
//
        if(!req.file){
            logger.error("No Image file found. Please upload a file");
            return res.status(400).json({
                success: false,
                message: "No Image file found. Please upload a file"
            });
        }
        next();

    });

}, uploadFile); // Upload a file to Cloudinary


router.get('/all-Images', authenticateUser, getAllUploadedFiles); // Get all uploaded files


module.exports = router;
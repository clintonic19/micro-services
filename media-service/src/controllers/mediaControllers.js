const Media = require("../models/mediaModel");
const { uploadFileToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const uploadFile = async(req, res) =>{
    logger.info("Uploading file to Cloudinary");
        const userId = req.user._id;   
        

    try {
        console.log(req.file, ":::req.filereq.file");
        
        // Check if the file is present in the request
        if (!req.file) {
            logger.error("No Image file found. Please upload a file");
            return res.status(400).json({
                success: false,
                message: "No Image file found. Please upload a file"
            });
        }
                    
        // Check if the file is an image
        const {originalname, buffer, mimetype,} = req.file;   

        logger.info(`File details: name=${originalname}, type=${mimetype} `);
        logger.info('Uploading file.......');
        // Upload the file to Cloudinary
        const uploadResult = await uploadFileToCloudinary(req.file);
        // const uploadResult = await uploadFileToCloudinary(path);
        logger.info(`File uploaded to Cloudinary successfully. Public Id: ${uploadResult.public_id}`);
              
        // Create a new media object
        const newFileCreated = new Media({
            publicId : uploadResult.public_id,
            originalName : originalname,
            mimeType : mimetype,
            url : uploadResult.secure_url,
            user: userId
        })
        
        // Save the media object to the database
        await newFileCreated.save();
        logger.info("File uploaded and saved to database successfully");
        
        // Return the response
        return res.status(201).json({
            success: true,
            message: "File uploaded and saved to database successfully",
            data: {
                publicId: uploadResult.public_id,
                url: uploadResult.secure_url,
                ImageId: newFileCreated._id,
                // mimeType,
                // originalName
            }
        });


    } catch (error) {
        logger.error("Error uploading file to Cloudinary", error);
        return res.status(500).json({ 
            success: false,
            message: "Error uploading file"
         });      
    }
};

const getAllUploadedFiles = async(req, res) =>{
    try {
        const result = await Media.find({});
        if (result.length === 0) {
            logger.info("No files found");
            return res.status(404).json({
                success: false,
                message: "No files found"
            });
        }

        res.status(200).json({
            success: true,
            message: "All uploaded files retrieved successfully",
            data: result
        });

    } catch (error) {
        logger.error("Error getting all uploaded files", error);
        return res.status(500).json({
            success: false,
            message: "Error getting all uploaded files"
        });
        
    }
}

// export the functions
// These functions can be used in other parts of the application
module.exports = {
    uploadFile,
    getAllUploadedFiles
}
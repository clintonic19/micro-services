const cloudinary = require("cloudinary").v2;
const logger = require("./logger");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.cloud_name ,
    api_key: process.env.api_key ,
    api_secret: process.env.api_secret,
});

// Upload a file to Cloudinary
const uploadFileToCloudinary = async(file) => {
   return new Promise((resolve, reject)=>{
        // Upload the file to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
            {
            resource_type: "auto",
        },
        // Callback function to handle the upload result
        // This function is called when the upload is complete
        (error, result) =>{
            if (error) {
                logger.error("Error uploading Image file to Cloudinary", error);
                reject(error);
            } else {
                logger.info("Image File uploaded to Cloudinary Successfully", result);
                resolve(result);
            }
        }
    )
      // Important: validate the file buffer exists
        if (!file || !file.buffer) {
            return reject(new Error("No file buffer provided"));
        }

    // Create a readable stream from the file
    // The file is passed as a buffer
    uploadStream.end(file.buffer);
    // Return the upload stream
    });

};

// Delete a file from Cloudinary
const deleteFileFromCloudinary = async(publicId) => {
    return new Promise((resolve, reject)=>{
        // Delete the file from Cloudinary
        cloudinary.uploader.destroy(publicId, (error, result) => {
            logger.info("Deleting Image file from Cloudinary", publicId);
            if (error) {
                logger.error("Error deleting Image file from Cloudinary", error);
                reject(error);
            } else {
                logger.info("Image File deleted from Cloudinary Successfully", result);
                resolve(result);
            }
        });
    })
}

// Export the functions
// These functions can be used in other parts of the application
module.exports = { uploadFileToCloudinary, deleteFileFromCloudinary }
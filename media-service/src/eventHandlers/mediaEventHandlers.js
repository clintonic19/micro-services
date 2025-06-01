const Media = require("../models/mediaModel");
const { deleteFileFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

//HANDLE DELETE POST EVENT
const handleDeletePostEvent = async(event) =>{
    console.log("Handling delete post event:", event);
    const { postId, imageUrls } = event;
    try {
        // Check if the postId and imageUrls are provided
        // if (!postId || !imageUrls || !Array.isArray(imageUrls)) {
        //     console.error("Invalid event data:", event);
        //     return;
        // }
        const deleteImage = await Media.find({ _id: { $in: imageUrls } })
        for(const media of deleteImage ){
            await deleteFileFromCloudinary(media.publicId)
            await Media.findByIdAndDelete(media._id)
            logger.info(`Deleted Image Files Media id: ${media._id} and  Post Id: ${postId}`)
        }
        logger.info(`Processed Deletion is completed for Image in Post Id: ${postId}`)
    } catch (error) {
        logger.error("Error Occurred handling delete post event:", error);
    }
}

module.exports = { handleDeletePostEvent };
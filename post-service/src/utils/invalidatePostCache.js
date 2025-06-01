const logger = require("./logger");


const invalidatePostCache = async (req, input) => {
    try {
        // Check if the input is a single post ID or an array of post IDs
        const cachedKey = `posts:${input}`;
        await req.redisClient.del(cachedKey); // Delete the specific post from cache   

        const keys = await req.redisClient.keys("posts:*"); // Get all keys matching the pattern
        if(keys.length > 0){
            await req.redisClient.del(keys);
            logger.info("Post Cache Invalidated Successfully");
        };
    } catch (error) {
        logger.error("Error Invalidating Post Cache", error);
        return res.status(500).json({
            success: false,
            message: "Error Invalidating Post Cache"
        });
    }
}

module.exports = {invalidatePostCache};
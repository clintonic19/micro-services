const Search = require("../models/searchModel");
const logger = require("../utils/logger");

/// Handle delete event
async function handleDeleteEvent(event) {
    try {
        // Log the event details
        logger.info("Handling delete event", {
            postId: event.postId,
            userId: event.userId,
            createdAt: event.createdAt
        });

        // Delete the search entry from the database
        const result = await Search.deleteOne({ postId: event.postId });

        if (result.deletedCount === 0) {
            logger.warn(`No search entry found for postId: ${event.postId}`);
            return;
        }

        logger.info(`Search entry for postId: ${event.postId} deleted successfully`);

    } catch (error) {
        logger.error("Error Occurred handling delete event:", error);
    }
};

module.exports = { handleDeleteEvent };
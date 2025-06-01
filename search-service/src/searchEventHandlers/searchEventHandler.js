const logger = require("../utils/logger");
const Search = require("../models/searchModel");


// Handle search event
async function handleSearchEvent(event) {
    try {
        // console.log("Handling search event::::::", event);
        // console.log("Event Title ::::", event.title);

        // Check if the event has the required properties
         // Validate required fields
        // if (!event.title || !event.userId) {
        //     const missingFields = [];
        //     if (!event.title) missingFields.push('title');
        //     if (!event.userId) missingFields.push('userId');

        //     logger.warn(`Missing required fields in search event: ${missingFields.join(', ')}`, event);
        //     return; // Stop further processing
        // } 


        // Create a new Search Post 
        const searchPost = new Search({
            postId : event.postId,
            content : event.content,
            userId : event.userId,
            createdAt : event.createdAt
        })
        // Save the search post to the database
        await searchPost.save();

        logger.info("Search event processed successfully", {
            postId: event.postId,
            content : event.content,
            searchPostId: searchPost._id.toString(),
            // content: event.content,
            // createdAt: event.createdAt
        });

    } catch (error) {
        logger.error("Error Occurred handling create post event:", error);
        console.error("Error Occurred handling create post event:", error.message);
        
    };
};

module.exports = { handleSearchEvent }
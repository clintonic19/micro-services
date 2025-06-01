const express = require('express');
const Search = require('../models/searchModel');
const logger = require('../utils/logger');

// Create a new search entry
const createSearchEntry = async (req, res) => {
    try {
        //
        let { query } = req.query; // Extract the search query from the request
        // Validate the query parameter

        // if (Array.isArray(query)) {
        //     query = query[0]; // Take the first element if it's an array
        //     }

        
        if (!query || typeof query !== 'string' || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Query parameter is required"
            });
        }

    const queryResult = await Search.find(
            {$text: { $search: query }},
            {score: { $meta: "textScore" }}
        ).sort({ score: { $meta: "textScore" } }).limit(10); // Limit to 10 results
        
        logger.info("Search results found");
        return res.status(200).json({
            success: true,
            message: "Search results found",
            results: queryResult
        });

    } catch (error) {
        logger.error(`Error Searching Post: ${error.message}`);
        logger.error("Error Searching Post", error)
        return res.status(500).json({ 
            success: false,
            message: "Error Searching Post" 
        });
    };
};

module.exports = {
    createSearchEntry
}
const Post = require("../models/postModel");
const { invalidatePostCache } = require("../utils/invalidatePostCache");
const logger = require("../utils/logger");
const { publishMessageEvent } = require("../utils/rabbitmq");
const { createPostServiceValidation } = require("../utils/validation");

//CREATE A POST
const createPost = async(req, res) =>{
    logger.info("Creating a new Post", req.body)
    try {
         const { error } = createPostServiceValidation(req.body);
                if (error) {
                  logger.warn("Validation error", error.details[0].message);
                  return res.status(400).json({
                    success: false,
                    message: error.details[0].message,
                  });
                }

        // Check if the user is authenticated
        if (!req.user || !req.user._id) {
        logger.warn("User not authenticated");
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User not authenticated",
        });
    }

        const { content, imageUrls } = req.body // Destructure the required fields from the request body

        const createNewPost = new Post({
            user : req.user._id, // Use the user ID from the request object
            // user : req.user.userId,
            content: content,
            imageUrls : imageUrls || [], // Default to an empty array if no imageUrls are provided
        });

        // Save the new post to the database
        await createNewPost.save();

         //PUBLISH A CREATE POST EVENT TO RABBITMQ
        await publishMessageEvent("post.created", {
            postId: createNewPost._id.toString(),
            // userId: createNewPost.user.toString(), // Ensure the user ID is a string
            // userId: req.user._id.toString(), // If you want to use the user ID from the request object
            userId: req.user._id,
            content: createNewPost.content,
            createdAt: createNewPost.createdAt,
            action: "create post"
        })


        // Invalidate or Delete the post from cache
        await invalidatePostCache(req, createNewPost._id.toString());
        logger.info("Post Created Successfully", createNewPost)
        
        // Return a success response with the created post
        return res.status(201).json({ 
            success: true,
            message: "Post Created Successfully",
            post: createNewPost
        });
    } catch (error) {
        logger.error("Error Creating Post", error)
        return res.status(500).json({ 
            success: false,
            message: "Error Creating Post" 
        });
    }
};

//GET ALL POSTS
const allPost = async(req, res) =>{
    try {
        const page = parseInt(req.query.page) || 1; // Get the page number from the query parameters
        const limit = parseInt(req.query.limit) || 10; // Get the limit from the query parameters
        const skip = (page - 1) * limit; // Calculate the number of posts to skip
        const cacheKey = `posts:${page}:${limit}`; // Create a cache key based on the page and limit
        const cachedPost = await req.redisClient.get(cacheKey); // Check if the posts are cached
    
        // If cached posts are found, return them
        if (cachedPost) {
            logger.info("Posts fetched from cache");
            return res.status(200).json({
                success: true,
                message: "Posts fetched from cache",
                posts: JSON.parse(cachedPost),
            });
        }
        // If no cached posts are found, fetch them from the database
        const posts = await Post.find({}) // Find all posts
            .sort({ createdAt: -1 }) // Sort posts by creation date in descending order
            .skip(skip) // Skip the specified number of posts
            .limit(limit); // Limit the number of posts returned

         // Get the total number of posts
         const totalPosts = await Post.countDocuments();

         //GET THE TOTAL NUMBER OF PAGES
         const result = { 
            posts, 
            currentPage: page, 
            totalPages: Math.ceil(totalPosts / limit), 
            totalNumberOfPosts: totalPosts, 
        };

        //save the posts to the redis cache
        await req.redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600); // Cache the posts for 1 hour

        // res.json(result); // Return the posts
        logger.info("Posts fetched from database");
        return res.status(200).json({ 
            success: true,
            message: "Posts fetched from database",
            posts: result
        });
    } catch (error) {
        logger.error("Error Fetching Post", error)
        return res.status(500).json({ 
            success: false,
            message: "Error Fetching Post" 
        });
    }
};

//GET A SINGLE POST
const singlePost = async(req, res) =>{
    try {
        // Get the post ID from the request parameters
        const postId = req.params.id;
        
        // Create a cache key based on the post ID 
        const cacheKey = `posts:${postId}`; 
        
        // Check if the post is cached
        const cachedPost = await req.redisClient.get(cacheKey); 

         // If cached posts are found, return them
        if (cachedPost) {
            logger.info("Posts fetched from cache");
            return res.status(200).json({
                success: true,
                message: "Posts fetched from cache",
                posts: JSON.parse(cachedPost),
            });
        };

        // If no cached post is found, fetch it from the database
        const singlePost = await Post.findById(postId); // Find the post by ID
        if (!singlePost) {
            logger.warn(" Post not found");
            return res.status(404).json({
                success: false,
                message: "Post not found or Deleted",
            });
        }
        // Save the post to the cache
        await req.redisClient.set(cacheKey, JSON.stringify(singlePost), 'EX', 3600); // Cache the post for 1 hour
        logger.info("Post fetched from database");
        return res.status(200).json({ 
            success: true,
            message: "Post fetched from database",
            post: singlePost
        });
        
    } catch (error) {
        logger.error("Error Occurred in Fetching a Single Post", error)
        return res.status(500).json({ 
            success: false,
            message: "Error Occurred in Fetching a Single Post" 
        });
    }
};

//DELETE A POST
const deletePost = async(req, res) =>{
    try {
        // Get the post ID from the request parameters
        const postId = req.params.id;
        // Check if the post exists
        const deletePost = await Post.findByIdAndDelete({
            _id: postId,
            user: req.user._id// Ensure the user is the owner of the post
        });
       
        if (!deletePost) {
            logger.warn("Post not found");
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        } 

        //PUBLISH A DELETE POST EVENT TO RABBITMQ
        await publishMessageEvent("post.deleted", {
            postId: deletePost._id.toString(),
            userId: req.user._id,
            imageUrls : deletePost.imageUrls,
            action: "delete"
        })

        // Invalidate or Delete the post from cache
        await invalidatePostCache(req, postId);
        logger.info("Post Deleted Successfully", postId)
        
        return res.status(200).json({ 
            success: true,
            message: "Post Deleted Successfully" 
        });
        
    } catch (error) {
        logger.error("Error Deleting Post", error)
        return res.status(500).json({ 
            success: false,
            message: "Error Deleting Post" 
        });
    }
};

//EXPORTING THE CONTROLLER
module.exports = {
    createPost,
    allPost,
    singlePost,
    deletePost
};
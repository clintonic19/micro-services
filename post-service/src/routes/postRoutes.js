const express = require('express');
const router = express.Router();
const { createPost, allPost, singlePost, deletePost } = require('../controllers/postController');
const { authenticateUser } = require("../middlewares/auth")

// Apply authentication middleware to all routes or Check if the user is an authenticated user
router.use(authenticateUser);

router.post('/create-post', createPost, ); // Create a new post
router.get('/posts', allPost); // Get all posts
router.get('/:id', singlePost); // Get a single post by ID
router.delete('/:id', deletePost); // Delete a post by ID

module.exports = router;

// const subscriber = client.duplicate();

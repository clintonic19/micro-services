const express = require('express');
const router = express.Router();
const { authenticateUser } = require("../middlewares/auth")
const { createSearchEntry } = require('../controllers/searchController');

// Route to handle search queries
router.get('/post', authenticateUser, createSearchEntry);

module.exports = router;

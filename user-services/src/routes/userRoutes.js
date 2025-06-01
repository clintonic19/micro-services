const express = require('express');
const router = express.Router();

//Local Imports 
const { registerUser, loginUser, refreshTokenHandler, logoutUser } = require("../controllers/userServiceController");
// const {registerUser} = require('../controllers/userServiceController')

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshTokenHandler);

module.exports = router;

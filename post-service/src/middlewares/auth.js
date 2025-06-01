const logger = require('../utils/logger');

// This middleware function checks if the user is authenticated by looking for a user ID in the request headers. 
// If the user ID is not found, it logs an error and sends a 401 Unauthorized response.
// If the user ID is found, it attaches the user ID to the request object and calls the next middleware or route handler. 
const authenticateUser = (req, res, next) => {
    const userId = req.headers['x-user-id'] || req?.headers['X-User-Id'];;
    // const userId = req.get['x-user-id'] || req.get['X-User-Id'];
 
    if(!userId) {
        logger.error('User ID not found in request headers');
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized user! Please Login' 
        });
    }

    req.user =  { _id: userId }; // Attach the user ID to the request object
    // req.user =   userId ; // Attach the user ID to the request object
    // userId = req.user 
    next();
};
 
module.exports = { authenticateUser };


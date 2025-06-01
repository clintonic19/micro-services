const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const validateToken = (req, res, next) => {
    // const authHeader = req.headers["authorization"] || ["Authorization"];
    const authHeader = req.headers['authorization'] || req.headers["Authorization"];
    const token = authHeader && authHeader?.split(' ')[1]; // Extract the token from the Authorization header

    //CHECK IF TOKEN EXISTS
    if(!token){
        logger.warn('Unauthorized Login. Please Login and try Again')
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized Login. Please Login and try Again' 
        });
    }
    
    //VERIFY TOKEN WITH JWT
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if(err){
            logger.error(' Invalid credentials', err.message );
            return res.status(403).json({ 
                success: false,
                message: 'Invalid credentials Please Login and try Again'
             });
        }
        // Attach the user information to the request object
        // This allows the next middleware or route handler to access the user information
        req.user = user;
        next();
    });
};


module.exports = { validateToken };
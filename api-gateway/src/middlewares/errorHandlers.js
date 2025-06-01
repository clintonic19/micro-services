const logger = require('../utils/logger');

const errorHandler = (err, req, res, next ) =>{
    logger.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message,
    });
    next()
}

module.exports = errorHandler;
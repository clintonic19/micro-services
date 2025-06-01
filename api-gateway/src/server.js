require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Redis = require('ioredis');
const { rateLimit } = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const logger = require('./utils/logger');
const proxy = require('express-http-proxy');
const errorHandler = require('./middlewares/errorHandlers');
const { validateToken } = require('./middlewares/authApiGateWayMiddleware');

const app = express();

//PORT
const port = process.env.PORT || 3000;

//REDIS CLIENT 
const redisClient = new Redis(process.env.REDIS_URL );

//MIDDLEWARES
app.use(helmet()); // Security middleware to set various HTTP headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

//DDOS protection and rate Limiting
const rateLimitOption = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler : (req, res)=> {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`)
         res.status(429).json({
            success : false,
            message : "Too many requests from this IP, please try again later."
        })
    },
    // message: "Too many requests from this IP, please try again later.",
    store : new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

// Apply the rate limiting middleware to all requests
app.use(rateLimitOption);

//Middleware for logging requests
app.use((req, res, next) =>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request Body, ${req.body}`);
    next();
});

// SETTING UP PROXY REQUESTS TO USER SERVICE
const proxyOptions = {
    proxyReqPathResolver : (req) =>{
        return req.originalUrl.replace(/^\/v1/, "/api")
    },
    //PROXY ERROR HANDLER
    // This function is called when an error occurs while proxying the request
    onError : (err, res, next) => {
        logger.error(`Error occurred while proxying request: ${err.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error', error: err.message
        });
        // next();
      }
}

//SETTING UP PROXY REQUESTS TO USER AUTH SERVICE
app.use('/v1/auth', proxy(process.env.USER_SERVICE_URL, {
    ...proxyOptions,
    
    // Allow Customization of the request
    // This function is called before the request is sent to the target server
    proxyReqOptDecorator : (proxyReq, srcReq) =>{
        proxyReq.headers['Content-Type'] = 'application/json'
        return proxyReq;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) =>{
        logger.info(`Response from User Service: ${proxyRes.statusCode}`);
        return proxyResData;
    }
}))

// SETTING UP PROXY REQUESTS TO POST SERVICE
app.use("/v1/posts", validateToken, proxy(process.env.POST_SERVICE_URL, {
// app.use("/v1/posts",  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    
    proxyReqOptDecorator : (proxyReq, srcReq) =>{
        proxyReq.headers['Content-Type'] = 'application/json'
        // proxyReq.headers['x-user-id'] = srcReq.user.userId; // Attach the user ID to the request headers
        if (srcReq.user && srcReq.user.userId) {
        proxyReq.headers['x-user-id'] = srcReq.user.userId;
    }
        // proxyReq.headers['Authorization'] = srcReq.headers['authorization']; // Attach the authorization token to the request headers
        return proxyReq;
    },
    
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) =>{
        logger.info(`Response from Post Service: ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));


// SETTING UP PROXY REQUESTS TO MEDIA SERVICE
app.use("/v1/fileUrl", validateToken, proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    
    proxyReqOptDecorator : (proxyReq, srcReq) =>{
        const authHeader = srcReq.headers['authorization'];
        // proxyReq.headers['Content-Type'] = 'application/json'
        // proxyReq.headers['x-user-id'] = srcReq.user.userId; // Attach the user ID to the request headers
    if (srcReq.user && srcReq.user.userId) {
        proxyReq.headers['x-user-id'] = srcReq.user.userId;
    }

    //UPDATED CODE BLOCK
    // if (authHeader?.startsWith('Bearer ')) {
    //     proxyReq.headers['x-user-id'] = decodeToken(authHeader).userId; // assuming decodeToken extracts it
    // }

     //PASSING THE MEDIA SERVICE AUTHORIZATION TOKEN
    if(!srcReq.headers['content-type']?.startsWith("multipart/form-data")){
        proxyReq.headers['content-type'] = 'application/json'
    }
        return proxyReq;
    },
   
    
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) =>{
        logger.info(`Response from Media Service: ${proxyRes.statusCode}`);
        return proxyResData;
    },
    parseReqBody: false, // Disable body parsing for multipart/form-data requests
}));

// SETTING UP PROXY REQUESTS TO SEARCH SERVICE
app.use("/v1/search", validateToken, proxy(process.env.SEARCH_SERVICE_URL, {
      ...proxyOptions,
    
    proxyReqOptDecorator : (proxyReq, srcReq) =>{
        proxyReq.headers['Content-Type'] = 'application/json'
        // proxyReq.headers['x-user-id'] = srcReq.user.userId; // Attach the user ID to the request headers
        if (srcReq.user && srcReq.user.userId) {
        proxyReq.headers['x-user-id'] = srcReq.user.userId;
    }
        // proxyReq.headers['Authorization'] = srcReq.headers['authorization']; // Attach the authorization token to the request headers
        return proxyReq;
    },
    
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) =>{
        logger.info(`Response from Search Service: ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

//Error handler 
app.use(errorHandler);

//LISTENING ON PORT
app.listen(port, () => {
    logger.info(`Api-gateWay Server is running on port ${port}`);
    logger.info(`User Service Server is running on port ${process.env.USER_SERVICE_URL}`);
    logger.info(`Post Service Server is running on port ${process.env.POST_SERVICE_URL}`);
    logger.info(`Media Service Server is running on port ${process.env.MEDIA_SERVICE_URL}`);
    logger.info(`Search Service Server is running on port ${process.env.SEARCH_SERVICE_URL}`);
    logger.info(`Redis URL Server is running on port ${process.env.REDIS_URL}`);
    console.log(`Server is running on port ${port}`);
});

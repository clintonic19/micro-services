require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');

//LOCAL IMPORTS
const connectDB = require('./dbConfig/dbConfig');
const logger = require('./utils/logger');
const authRoutes =  require('./routes/userRoutes')
const errorHandler = require('./middlewares/errorHandler');
// const { config } = require('dotenv');

//START EXPRESS APP
const app = express();

//PORT
const port = process.env.PORT || 3001;

//CONNECT DB
connectDB();

//MIDDLEWARES
app.use(helmet());  // Security middleware to set various HTTP headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); //

//REDIS CLIENT
// const redisClient = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST, {connectTimeout: 10000} );
// const redisClient = new Redis(process.env.REDIS_URL);

const redisClient = new Redis(process.env.REDIS_URL || {
    host: 'localhost',
    port: 6379,
    // connectTimeout: 10000,
    // maxRetriesPerRequest: 3, // Reduce retries (default: 20)
    // maxRetriesPerRequest: null,
    // retryStrategy: (times) => {
    //     console.log(`Retrying connection... attempt ${times}`);
    //     return Math.min(times * 100, 5000); // Reconnect after max 5 seconds
    //   }
});


//DDOS protection and rate Limiting
const rateLimiter = new RateLimiterRedis({
    storeClient : redisClient,
    keyPrefix : "middleware",
    points : 10, // 10 point  *Number of request a user can make per second
    duration : 1, //Per Second
});

//Middleware for Ratelimiting to catch ip address/remote addresses.
app.use((req, res, next) =>{
    rateLimiter.consume(req.ip).then(()=>next()).catch(()=>{
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`)
         res.status(429).json({
            success : false,
            message : "Too many request"
        });
    });
});

//Middleware for logging requests
app.use((req, res, next) =>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request Body, ${req.body}`);
    next();
});

// EXPRESS RATE LIMITER FOR API ENDPOINTS PROTECTION || IP ADDRESS RATE LIMITING
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 100 requests per windowMs
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

// Apply the rate limiting middleware to register requests endpoint
// app.use(apiLimiter());
app.use('/api/auth/register', apiLimiter);
// app.use('/api/auth/register');

//MAIN ROUTES
app.use('/api/auth', authRoutes);

//ERROR HANDLER
app.use(errorHandler);

//LISTENING ON PORT
app.listen(port, () => {
    logger.info(`User Service Server is running on port ${port}`);
    console.log(`Server is running on port ${port}`);
});

//HANDLE UNCAUGHT EXCEPTIONS
// process.on("uncaughtException", (error) => {
//     logger.error("Uncaught Exception:", error);
//     process.exit(1); // Exit the process with failure
// });

process.on("unhandledRejection:", (reason, promise, err) => {
    // logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    logger.error("Unhandled Rejection at: ", promise);
    logger.error("Unhandled Rejection at: ", reason);
    console.log('Redis connection error: ', err)
    process.exit(1); // Exit the process with failure
  });
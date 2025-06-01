require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

//LOCAL IMPORTS
const errorHandler = require("./middlewares/errorHandler")
const postRoutes = require('./routes/postRoutes');
const connectDB = require('./database/dbConfig');
const logger = require('./utils/logger');
const { connectRabbitMQ } = require('./utils/rabbitmq');

//Starting the Express Application
const app = express();
const PORT = process.env.PORT || 8080;

//Database Connection
connectDB();

//REDIS CONNECTION
const redisClient = new Redis(process.env.REDIS_URL || {
    host: 'localhost',
    port: 6379,
});

//MIDDLEWARES
app.use(helmet());
app.use(cors());
app.use(express.json());

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


//Apply the rate limiting middleware to CREATE POST requests endpoint
app.use('/api/posts/create-post', apiLimiter);

//Main Routes
// Pass Redis client to the routes
app.use('/api/posts', (req, res, next) =>{
    req.redisClient = redisClient;
    next();
}, postRoutes );

//Error Handling Middleware
// This middleware should be the last one in the middleware stack
app.use(errorHandler);

//CONNECT RABBITMQ
async function startServer(){
    try{
        await connectRabbitMQ();
        // logger.info('RabbitMQ connected successfully');
        //LISTENING ON PORT
        app.listen(PORT, () => {
            logger.info(`Post Service Server is running on port ${PORT}`);
            console.log(`Post Server is running on port ${PORT}`);
});
    }catch(error){
        logger.error('Error connecting to RabbitMQ:', error);
        process.exit(1); // Exit the process with failure
    }
};

// Start the server and connect to RabbitMQ
startServer()

//HANDLE UNCAUGHT EXCEPTIONS
process.on("unhandledRejection:", (reason, promise,err) => {
    // logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    logger.error("Unhandled Rejection at: ", promise);
    logger.error("Unhandled Rejection at: ", reason);
    console.log('Redis connection error: ', err)
    process.exit(1); // Exit the process with failure
  });



require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

// LOCAL IMPORTS
const connectDB = require('./database/dbConfig');
const logger = require('./utils/logger');
const errorHandler = require("./middlewares/errorHandler")
const { connectRabbitMQ, consumeMessageEvent  } = require('./utils/rabbitmq');
const searchRoutes = require('./routes/searchRoutes');
const { handleSearchEvent } = require('./searchEventHandlers/searchEventHandler');
const { handleDeleteEvent } = require('./searchEventHandlers/deleteEventHandler');

//Starting the Express Application
const app = express();
const PORT = process.env.PORT || 8000;

// Database Connection
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

//ROUTES
app.use('/api/search', searchRoutes); // Search routes

//Error Handling Middleware
// This middleware should be the last one in the middleware stack
app.use(errorHandler);

//CONNECT RABBITMQ 

async function startServer(){
    try{
        await connectRabbitMQ();
        // logger.info('RabbitMQ connected successfully');
        //CONSUME EVENTS MESSAGES FROM RABBITMQ 
        //Subscribe to the post.created event
        await consumeMessageEvent("post.created", handleSearchEvent )
        await consumeMessageEvent("post.deleted", handleDeleteEvent )

        //LISTENING ON PORT
        app.listen(PORT, () => {
        logger.info(`Search Service Server is running on port ${PORT}`);
        console.log(`Search Server is running on port ${PORT}`)});

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


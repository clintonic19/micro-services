require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

//LOCAL IMPORTS
const connectDB = require('./database/dbConfig');
const logger = require('./utils/logger');
const errorHandler = require("./middlewares/errorHandler")
const mediaRoutes = require("./routes/mediaRoutes");
const { connectRabbitMQ, consumeMessageEvent } = require('./utils/rabbitmq');
const { handleDeletePostEvent } = require('./eventHandlers/mediaEventHandlers');

//Starting the Express Application
const app = express();
const PORT = process.env.PORT || 8090;

//Database Connection
connectDB();

//MIDDLEWARES
app.use(helmet());
app.use(cors());

//REDIS CONNECTION
const redisClient = new Redis(process.env.REDIS_URL || {
    host: 'localhost',
    port: 6379,
});

//Middleware for logging requests
app.use((req, res, next) =>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request Body, ${req.body}`);
    next();
});

//Main Routes
app.use("/api/fileUrl", mediaRoutes);

app.use(express.json());

//error handler middleware
app.use(errorHandler);

//CONNECT RABBITMQ
async function startServer(){
    try{
        await connectRabbitMQ();
        // logger.info('RabbitMQ connected successfully');

        //CONSUME EVENTS MESSAGES FROM RABBITMQ
        await consumeMessageEvent("post.deleted", handleDeletePostEvent )


        //LISTENING ON PORT
            app.listen(PORT, () => {
                logger.info(`Media Service Server is running on port ${PORT}`);
                console.log(`Media Server is running on port ${PORT}`);
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
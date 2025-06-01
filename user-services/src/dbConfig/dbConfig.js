const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const logger = require("../utils/logger");


// Connect to MongoDB
const connectDB = async () =>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_DB_URI, {
        });
        logger.info('User Service DB Connected to Mongo DB')
        console.log(`Database connected: ${conn.connection.name}`);
    } catch (error) {
         logger.error('Unable to connect to Mongo DB')
         console.error(`Error Connection to MongoDB: ${error.message}`);
         process.exit(1);    
     }
};

module.exports = connectDB;
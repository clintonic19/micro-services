const ampq = require('amqplib');
const logger = require('./logger');

//CREATING A CONNECTION TO RABBITMQ

let connection = null; // Initialize connection variable
let channel = null; // Initialize channel variable

const EXCHANGE_NAME = 'facebook-events'; // Define the exchange name

async function connectRabbitMQ(){
    try {
        // Create a connection to RabbitMQ using the URL from environment variables
        connection = await ampq.connect(process.env.RABBITMQ_URL); 
        channel = await connection.createChannel(); // Create a channel
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });
        logger.info('Connected to RabbitMQ successfully');
        return channel;
    } catch (error) {
        logger.error('Error connecting to RabbitMQ:', error);
        throw error;
    }
};


// Function to publish a message to RabbitMQ
async function publishMessageEvent(routingKey, message){
    try {
        // Ensure the channel is connected
        if (!channel) {
            await connectRabbitMQ(); // Connect if not already connected
        }
        // Publish the message to the specified exchange with the given routing key
        channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)), {
            persistent: true // Ensure the message is persistent
        });
        logger.info(`Message published to RabbitMQ with routing key: ${routingKey}`);
        return true; // Return true to indicate success
    } catch (error) {
        logger.error('Error publishing message to RabbitMQ:', error);
        throw error;
    }
};

module.exports = { connectRabbitMQ, publishMessageEvent };
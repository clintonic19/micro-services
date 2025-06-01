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
        logger.info('Search Service Connected to RabbitMQ successfully');
        return channel;
    } catch (error) {
        logger.error('Error connecting to RabbitMQ:', error);
        throw error;
    }
};


// Function to publish a message to RabbitMQ
// async function publishMessageEvent(routingKey, message){
//     try {
//         // Ensure the channel is connected
//         if (!channel) {
//             await connectRabbitMQ(); // Connect if not already connected
//         }
//         // Publish the message to the specified exchange with the given routing key
//         channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)), {
//             persistent: true // Ensure the message is persistent
//         });
//         logger.info(`Message published to RabbitMQ with routing key: ${routingKey}`);
//         return true; // Return true to indicate success
//     } catch (error) {
//         logger.error('Error publishing message to RabbitMQ:', error);
//         throw error;
//     }
// };


//CONSUMER FUNCTION TO CONSUME MESSAGES FROM RABBITMQ

async function consumeMessageEvent( routingKey, callback){
    try {
         // Ensure the channel is connected
        if (!channel) {
            await connectRabbitMQ(); // Connect if not already connected
        }
        // Assert the exchange to ensure it exists
        const queueAsserted = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queueAsserted.queue, EXCHANGE_NAME, routingKey);
        logger.info(`Waiting for messages in queue: ${queueAsserted.queue} with routing key: ${routingKey}`);
        
        // Consume messages from the queue
        // The callback function will be called with the message content
        channel.consume(queueAsserted.queue, (msg) => {
            if (msg !== null) {
                const messageContent = JSON.parse(msg.content.toString());
                logger.info(`Received message: ${messageContent}`);
                callback(messageContent); // Call the provided callback with the message content
                channel.ack(msg); // Acknowledge the message
            }
        }, { noAck: false }); // Set noAck to false to manually acknowledge messages

        logger.info(`Consumer is set up for routing key: ${routingKey}`);

    } catch (error) {
        logger.error('Error consuming message from RabbitMQ:', error);
        throw error;
        
    }
}

module.exports = { connectRabbitMQ, consumeMessageEvent };
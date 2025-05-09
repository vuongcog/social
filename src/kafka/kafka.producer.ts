import { Kafka } from "kafkajs";

export class KafkaProducer {
    private producer;
    constructor() {
        const kafka = new Kafka( {
            clientId: 'user-service',
            brokers: [ 'kafka-broker:9092' ]
        } );

        this.producer = kafka.producer()
        this.connect();
    }
    async connect() {
        try {
            await this.producer.connect();
            console.log( 'Producer connected to Kafka' );
        } catch ( err ) {
            console.error( 'Failed to connect producer', err );
        }
    }
    async send( topic, message ) {
        try {
            await this.producer.send( {
                topic,
                messages: [ message ]
            } );
        } catch ( err ) {
            console.error( 'Failed to send message', err );
            throw err;
        }
    }
    async disconnect() {
        await this.producer.disconnect();
    }

}
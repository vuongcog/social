import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { Consumer, Kafka, Producer, type KafkaMessage } from "kafkajs";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private readonly kafka: Kafka
    private readonly producer: Producer
    private consumer: Consumer
    private readonly logger = new Logger( KafkaService.name )

    constructor( private configService: ConfigService ) {
        const brokers = this.configService.get<string>( 'KAFKA_BROKERS' )?.split( ',' ) || [ 'localhost:9092' ];
        this.kafka = new Kafka( {
            clientId: 'user-service', brokers: brokers, retry: {
                initialRetryTime: 100,
                retries: 8
            }
        } )
        this.producer = this.kafka.producer()

    }
    async onModuleInit() {
        try {
            await this.producer.connect()
            this.logger.log( "Successfully connected to Kafka producer" );

            this.consumer = this.kafka.consumer( { groupId: 'user-service-comsumer' } );

        } catch ( error ) {
            this.logger.error( `Failed to connect to Kaffa :${ error.message }`, error.stack )
        }

    }
    async onModuleDestroy() {
        try {
            await this.producer.disconnect();
            await this.consumer.disconnect();
            this.logger.log( 'Disconnected from Kafka' );

        } catch ( error ) {
            this.logger.error( `Error disconnecting from Kafka: ${ error.message }`, error.stack );
        }
    }

    async sendMessage( topic: string, key: string, value: any ) {
        try {
            await this.producer.send( {
                topic,
                messages: [ { key, value: JSON.stringify( value ) } ],
            } )
            this.logger.debug( `Message sent to topic ${ topic } with key ${ key }` );
            return true;
        } catch ( error ) {
            this.logger.error( `Failed to send message to topic ${ topic }: ${ error.message }`, error.stack );
            throw error;
        }
    }


    async consume( topics: string[], callback: ( message: KafkaMessage ) => Promise<void> ) {
        try {
            await this.consumer.subscribe( { topics, fromBeginning: false } );

            await this.consumer.run( {
                eachMessage: async ( { topic, partition, message } ) => {
                    try {
                        this.logger.debug( `Processing message from ${ topic } [${ partition }]` );
                        await callback( message );
                    } catch ( error ) {
                        this.logger.error(
                            `Error processing message from ${ topic } [${ partition }]: ${ error.message }`,
                            error.stack,
                        );
                    }
                },
            } );
        } catch ( error ) {
            this.logger.error( `Failed to consume topics ${ topics }: ${ error.message }`, error.stack );
            throw error;
        }
    }


}


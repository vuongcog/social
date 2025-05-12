import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Consumer, Kafka, Producer, type Admin, type KafkaMessage } from "kafkajs";

@Injectable()

export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private readonly kafka: Kafka
    private admin: Admin;
    private readonly producer: Producer
    private consumer: Consumer
    private readonly logger = new Logger( KafkaService.name )

    constructor( private configService: ConfigService ) {
        const brokers = this.configService.get<string>( 'KAFKA_BROKERS' )?.split( ',' ) || [ 'localhost:9093' ];
        const clientKafkaConifg = {
            clientId: 'user-service', brokers: brokers, retry: {
                initialRetryTime: 100,
                retries: 8
            }
        }
        this.kafka = new Kafka( clientKafkaConifg )

        this.admin = this.kafka.admin();

        this.producer = this.kafka.producer()
    }

    async onModuleInit() {
        try {
            await this.producer.connect()

            this.logger.log( "Successfully connected to Kafka producer" );

            await this.admin.connect();
            this.consumer = this.kafka.consumer( { groupId: 'user-service-comsumer' } );

            await this.admin.createTopics( {
                topics: [
                    {
                        topic: 'user-events',
                        numPartitions: 6,
                        replicationFactor: 1,
                    },
                ],
                waitForLeaders: true,
            } );
            this.logger.log( 'Ensured topic "user-events" exists with 6 partitions' );


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
        const a = 1;
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


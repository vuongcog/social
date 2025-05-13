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

        const brokers = this.configService.get<string>( 'KAFKA_BROKERS' )?.split( ',' ) || [
            'localhost:19092',
            'localhost:29092',
            'localhost:39092'
        ];

        const clientKafkaConfig = {
            clientId: 'user-service',
            brokers: brokers,
            retry: {
                initialRetryTime: 100,
                retries: 8
            }
        }

        this.kafka = new Kafka( clientKafkaConfig );
        this.admin = this.kafka.admin();
        this.producer = this.kafka.producer();
    }

    async onModuleInit() {
        try {
            await this.producer.connect();
            this.logger.log( "Successfully connected to Kafka producer" );

            await this.admin.connect();
            this.logger.log( "Successfully connected to Kafka admin" );

            const brokerInfo = await this.admin.describeCluster();
            this.logger.log( `Connected to Kafka cluster with ${ brokerInfo.brokers.length } brokers` );

            brokerInfo.brokers.forEach( broker => {
                this.logger.log( `Broker ID: ${ broker.nodeId }, Host: ${ broker.host }` );
            } );

            this.consumer = this.kafka.consumer( {
                groupId: 'user-service-consumer',
                retry: {
                    initialRetryTime: 300,
                    retries: 10,
                    factor: 1.5,
                    maxRetryTime: 30000,
                }
            } );

            const topics = await this.admin.listTopics();

            if ( !topics.includes( 'user-events' ) ) {
                await this.admin.createTopics( {
                    topics: [
                        {
                            topic: 'user-events',
                            numPartitions: 6,
                            replicationFactor: 3,
                            configEntries: [
                                { name: 'min.insync.replicas', value: '2' },
                                { name: 'cleanup.policy', value: 'delete' },
                                { name: 'retention.ms', value: '604800000' }
                            ]
                        },
                    ],
                    waitForLeaders: true,
                } );
                this.logger.log( 'Created topic "user-events" with 6 partitions and replication factor 3' );
            }

            const topicMetadata = await this.admin.fetchTopicMetadata( { topics: [ 'user-events' ] } );
            const userEventsTopic = topicMetadata.topics.find( t => t.name === 'user-events' );
            if ( userEventsTopic ) {
                this.logger.log( `Topic "user-events" has ${ userEventsTopic.partitions.length } partitions` );
                this.logger.log( `Partition leaders: ${ userEventsTopic.partitions.map( p => `P${ p.partitionId }: B${ p.leader }` ).join( ', ' ) }` );
            }
        } catch ( error ) {
            this.logger.error( `Failed to initialize Kafka: ${ error.message }`, error.stack );
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
    async sendEvent( topic: string, key: string, value: any, headers?: any ) {
        try {
            const metadata = await this.producer.send( {
                topic,
                messages: [
                    {
                        key,
                        value: JSON.stringify( value ),
                        headers,
                        // Có thể thêm timestamp ở đây nếu cần
                        // timestamp: Date.now().toString(),
                    },
                ],
                // Đảm bảo tính nhất quán dữ liệu
                acks: -1, // hoặc 'all' - đợi xác nhận từ tất cả replicas
            } );

            this.logger.log( `Message sent to topic ${ topic }, partition ${ metadata[ 0 ].partition }, offset ${ metadata[ 0 ].baseOffset }` );
            return metadata;
        } catch ( error ) {
            this.logger.error( `Failed to send message to topic ${ topic }: ${ error.message }`, error.stack );
            throw error;
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
        if ( !this.consumer ) {
            this.logger.error( 'Consumer is not initialized' );
            return false;
        }

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
            return true;

        } catch ( error ) {
            this.logger.error( `Failed to consume topics ${ topics }: ${ error.message }`, error.stack );
            throw error;
        }
    }


}


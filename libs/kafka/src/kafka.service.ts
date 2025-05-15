import { Injectable, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka, Producer } from 'kafkajs';
import { ConfigService } from '@app/config';

@Injectable()
export class KafkaService implements OnModuleInit {
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer;

    constructor( private configService: ConfigService ) {

        const brokers = this.configService.get<string>( 'KAFKA_BROKERS' )?.split( ',' ) || [
            'localhost:19092',
            'localhost:29092',
            'localhost:39092'
        ];
        this.kafka = new Kafka( {
            clientId: 'nest-microservice',
            brokers: brokers,
        } );

        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer( { groupId: 'nest-microservice-group' } );
    }

    async onModuleInit() {
        await this.producer.connect();
    }

    async produce( topic: string, message: any ) {
        return this.producer.send( {
            topic,
            messages: [ { value: JSON.stringify( message ) } ],
        } );
    }

    async consume( topics: string[], callback: ( message: any ) => void ) {
        await this.consumer.connect();

        for ( const topic of topics ) {
            await this.consumer.subscribe( { topic, fromBeginning: true } );
        }

        await this.consumer.run( {
            eachMessage: async ( { topic, partition, message } ) => {

                const value = message?.value?.toString();
                if ( value ) {
                    callback( { topic, partition, value: JSON.parse( value ) } );

                }
            },
        } );
    }
}
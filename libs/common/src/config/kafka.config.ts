import { registerAs } from '@nestjs/config';

export default registerAs( 'kafka', () => ( {
    brokers: ( process.env.KAFKA_BROKERS || 'localhost:9092' ).split( ',' ),
    groupId: process.env.KAFKA_GROUP_ID || 'nest-microservices',
} ) );
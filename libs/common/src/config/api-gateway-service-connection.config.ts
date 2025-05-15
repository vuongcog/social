import { registerAs } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { configs } from '.';
import { CONSTANTS } from '../constants';

export default registerAs( 'api-gateway-service-connection', () => ( {
    "gateway-auth-service": {
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: CONSTANTS.CLIENT_ID[ 'api-gateway-auth' ],
                brokers: process.env.KAFKA_BROKERS || [
                    'localhost:19092',
                    'localhost:29092',
                    'localhost:39092'
                ]
            },
            consumer: {
                groupId: CONSTANTS.GROUP_ID[ 'gateway-auth-group-id' ],
            },
        },
    },
    "gateway-user-service": {
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: CONSTANTS.CLIENT_ID[ 'api-gateway-user' ],
                brokers: process.env.KAFKA_BROKERS || [
                    'localhost:19092',
                    'localhost:29092',
                    'localhost:39092'
                ]
            },
            consumer: {
                groupId: CONSTANTS.GROUP_ID[ 'gateway-user-group-id' ],
            },
        },
    }
} ) );
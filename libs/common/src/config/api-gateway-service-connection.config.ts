import { registerAs } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { CONSTANTS } from '../constants';
import { appUtils } from '../utils';

export default registerAs( 'api-gateway-service-connection', () => ( {
    "gateway-auth-service": {
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: CONSTANTS.CLIENT_ID.API_GATEWAY_AUTH_CLIENT_ID,
                brokers: appUtils.convertBrokers()
            },
            consumer: {
                groupId: CONSTANTS.GROUP_ID.GATEWAY_AUTH_GROUP_ID,
            },
        },
    },
    "gateway-user-service": {
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: CONSTANTS.CLIENT_ID.API_GATEWAY_USER_CLIENT_ID,
                brokers: appUtils.convertBrokers()
            },
            consumer: {
                groupId: CONSTANTS.GROUP_ID.GATEWAY_USER_GROUP_ID,
            },
        },
    }
} ) );
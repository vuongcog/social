import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';
import { CircuitBreakerService } from '@app/common/circuit-breaker/circuit-breaker.service';
import { convertBrokers } from '@app/common/utils/convert-brokers';
import { CONSTANTS } from '@app/common';


@Module( {
    imports: [
        ClientsModule.register( [
            {
                name: CONSTANTS.SERVICES[ 'user-service' ],
                transport: Transport.KAFKA,
                options: {
                    client: {
                        clientId: CONSTANTS.CLIENT_ID.AUTH_CLIENT_ID,
                        brokers: convertBrokers()
                    },
                    consumer: {
                        groupId: CONSTANTS.GROUP_ID.AUTH_GROUP_ID,
                    },
                },
            },

            {
                name: CONSTANTS.SERVICES[ 'health-service' ],
                transport: Transport.KAFKA,
                options: {
                    client: {
                        clientId: CONSTANTS.CLIENT_ID.HEALTH_CLIENT_ID,
                        brokers: convertBrokers()
                    },
                    consumer: {
                        groupId: CONSTANTS.GROUP_ID.HEALTH_GROUP_ID,
                    },
                },
            },


        ] ),
    ],
    providers: [
        KafkaService,
        CircuitBreakerService,
    ],
    exports: [ KafkaService ],
} )
export class KafkaModule { }
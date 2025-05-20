import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from "@nestjs/common";
import { CONSTANTS } from '@app/common';
import { convertBrokers } from '@app/common/utils/convert-brokers';
import { CircuitBreakerService } from '@app/common/circuit-breaker/circuit-breaker.service';
import { KafkaService } from './kafka.service';

@Module( {
    imports: [ ClientsModule.register( [

        {
            name: CONSTANTS.SERVICES[ 'user-elasticsearch-service' ],
            transport: Transport.KAFKA,
            options: {
                client: {
                    clientId: CONSTANTS.CLIENT_ID.USER_ELASTICSEARCH_CLIENT_ID,
                    brokers: convertBrokers()
                },
                consumer: {
                    groupId: CONSTANTS.GROUP_ID.USER_ELASTICSEARCH_GROUP_ID,
                },
            },
        },


    ] ), ]
    , providers: [
        KafkaService,
        CircuitBreakerService,
    ],
    exports: [ KafkaService ],
} )
export class KafkaModule {
}
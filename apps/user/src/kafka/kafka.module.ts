import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from "@nestjs/common";
import { CONSTANTS } from '@app/common';
import { convertBrokers } from '@app/common/utils/convert-brokers';
import { CircuitBreakerService } from '@app/common/circuit-breaker/circuit-breaker.service';
import { UserElasticSearchKafkaService } from './elasticsearch/user.elasticsearch-kafka.service';
import { UserDataKafkaService } from './user/user.data-kafka.service';

@Module( {
    imports: [ ClientsModule.register( [

        {
            name: CONSTANTS.SERVICES[ 'user.elasticsearch-service' ],
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
        }
        ,
        {
            name: CONSTANTS.SERVICES[ 'user.data-service' ],
            transport: Transport.KAFKA,
            options: {
                client: {
                    clientId: CONSTANTS.CLIENT_ID.USER_DATA_CLIENT_ID,
                    brokers: convertBrokers()
                },
                consumer: {
                    groupId: CONSTANTS.GROUP_ID.USER_DATA_GROUP_ID,
                },
            },
        },


    ] ), ]
    , providers: [
        UserElasticSearchKafkaService,
        UserDataKafkaService,
        CircuitBreakerService,
    ],
    exports: [ UserElasticSearchKafkaService, UserDataKafkaService ],
} )
export class KafkaModule {
}
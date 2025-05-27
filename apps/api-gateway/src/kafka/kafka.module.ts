import { UserKafkaService } from './user/gateway.user-kafka.service';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@app/config';
import { CONSTANTS } from '@app/common';
import { CircuitBreakerService } from '@app/common/circuit-breaker/circuit-breaker.service';
import { AuthKafkaService } from './auth/gateway.auth-kafka.service';
import { ElasticSearchKafkaService } from './elasticsearch/gateway.elasticsearch-kafka.service';
@Module( {
    imports: [
        ClientsModule.registerAsync( [
            {
                name: CONSTANTS.SERVICES[ 'auth-service' ],
                imports: [ ConfigModule ],
                inject: [ ConfigService ],
                useFactory: ( configService: ConfigService ) => {
                    const kafkaConnections: object = configService.get( 'api-gateway-service-connection' );

                    return {
                        ...kafkaConnections[ 'gateway-auth-service' ]
                    };
                },
            },
            {
                name: CONSTANTS.SERVICES[ 'user-service' ],
                imports: [ ConfigModule ],
                inject: [ ConfigService ],
                useFactory: ( configService: ConfigService ) => {
                    const kafkaConnections: object = configService.get( 'api-gateway-service-connection' );

                    return {
                        ...kafkaConnections[ 'gateway-user-service' ]
                    };
                },
            },
            {
                name: CONSTANTS.SERVICES[ 'elasticsearch_service' ],
                imports: [ ConfigModule ],
                inject: [ ConfigService ],
                useFactory: ( configService: ConfigService ) => {
                    const kafkaConnections: object = configService.get( 'api-gateway-service-connection' );

                    return {
                        ...kafkaConnections[ 'gateway-elasticsearch-service' ]
                    };
                },
            },
        ] ),
    ],
    providers: [ CircuitBreakerService, AuthKafkaService, UserKafkaService, ElasticSearchKafkaService ],

    exports: [ ClientsModule, UserKafkaService, AuthKafkaService, ElasticSearchKafkaService ],

} )
export class KafkaModule { }
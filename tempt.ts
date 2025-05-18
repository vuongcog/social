import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@app/config';
import { CONSTANTS } from '@app/common';

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
        ] ),
    ],
    exports: [ ClientsModule ],
} )
export class KafkaModule { }
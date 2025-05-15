import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@app/config';

@Module( {
    imports: [
        ConfigModule,
        ClientsModule.registerAsync( [
            {
                name: 'AUTH_SERVICE',
                imports: [ ConfigModule ],
                inject: [ ConfigService ],
                useFactory: ( configService: ConfigService ) => ( {
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            clientId: 'api-gateway-auth',
                            brokers: [
                                'localhost:19092',
                                'localhost:29092',
                                'localhost:39092'
                            ],
                        },
                        consumer: {
                            groupId: 'api-gateway-auth-consumer',
                        },
                    },
                } ),
            },
            {
                name: 'USER_SERVICE',
                imports: [ ConfigModule ],
                inject: [ ConfigService ],
                useFactory: ( configService: ConfigService ) => ( {
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            clientId: 'api-gateway-user',
                            brokers: [
                                'localhost:19092',
                                'localhost:29092',
                                'localhost:39092'
                            ],
                        },
                        consumer: {
                            groupId: 'api-gateway-user-consumer',
                        },
                    },
                } ),
            },
        ] ),
    ],
    exports: [ ClientsModule ],
} )
export class KafkaModule { }
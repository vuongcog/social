import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module( {
    imports: [
        ConfigModule.forRoot( {
            isGlobal: true,
            envFilePath: '.env',
        } ),
        ClientsModule.registerAsync( [
            {
                name: 'ROLE_SERVICE',
                // imports: [ ConfigModule ],
                // inject: [ ConfigService ],
                useFactory: () => ( {
                    transport: Transport.TCP,
                    options: {
                        host: "127.0.0.1",
                        port: 3001,
                    },
                } ),
            },
        ] ),
    ],
    controllers: [],
    providers: [],
} )
export class AppModule { }
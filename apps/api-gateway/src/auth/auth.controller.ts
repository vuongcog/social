import { Body, Controller, Post, type OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { InjectKafkaClient } from '../kafka/kafka.decorator';

@Controller( 'auth' )
export class AuthController implements OnModuleInit {
    constructor(
        @InjectKafkaClient( 'AUTH_SERVICE' ) private authClient: ClientKafka,
    ) { }

    async onModuleInit() {
        this.authClient.subscribeToResponseOf( 'auth.login' );
        this.authClient.subscribeToResponseOf( 'auth.register' );

        await this.authClient.connect();
    }

    @Post( 'login' )
    async login( @Body() body: { email: string; password: string } ) {
        const response = await lastValueFrom(
            this.authClient.send( 'auth.login', body ),
        );

        if ( !response.success ) {
            return { success: false, message: response.message };
        }

        return { success: true, data: response.data };
    }

    @Post( 'register' )
    async register( @Body() body: { email: string; password: string; name?: string } ) {
        const response = await lastValueFrom(
            this.authClient.send( 'auth.register', body ),
        );

        if ( !response.success ) {
            return { success: false, message: response.message };
        }

        return { success: true, data: response.data };
    }
}
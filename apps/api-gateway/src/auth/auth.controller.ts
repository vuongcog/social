import { CONSTANTS } from '@app/common';
import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka, } from '@nestjs/microservices';

@Controller( 'auth' )
export class AuthController implements OnModuleInit {
    constructor(
        @Inject( process.env.AUTH_SERVICE || CONSTANTS.SERVICES[ 'auth-service' ] ) private readonly authClient: ClientKafka,
        // private readonly authService: AuthService,
    ) {

    }

    async onModuleInit() {
        this.authClient.subscribeToResponseOf( 'auth.login' );
        this.authClient.subscribeToResponseOf( 'auth.register' );

        await this.authClient.connect();
    }

}
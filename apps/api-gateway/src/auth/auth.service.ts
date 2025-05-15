import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
    constructor(
        @Inject( 'AUTH_SERVICE' ) private readonly authClient: ClientKafka,
    ) { }

    async login( credentials: any ) {
        return firstValueFrom( this.authClient.send( 'auth.login', credentials ) );
    }
}
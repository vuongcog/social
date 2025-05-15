import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
    constructor(
        @Inject( 'USER_SERVICE' ) private readonly userClient: ClientKafka,
    ) { }

    async getUser( id: string ) {
        return firstValueFrom( this.userClient.send( 'user.get', { id } ) );
    }
}
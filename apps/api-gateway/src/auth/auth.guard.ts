import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { InjectKafkaClient } from '../kafka/kafka.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        @InjectKafkaClient( 'AUTH_SERVICE' ) private authClient: ClientKafka,
    ) { }

    async canActivate( context: ExecutionContext ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader( request );

        if ( !token ) {
            throw new UnauthorizedException( 'No token provided' );
        }

        try {
            const response = await lastValueFrom(
                this.authClient.send( 'auth.validate', { token } ),
            );

            if ( !response.success ) {
                throw new UnauthorizedException( response.message );
            }

            request.user = response.data;
            return true;
        } catch ( error ) {
            throw new UnauthorizedException( 'Invalid token' );
        }
    }

    private extractTokenFromHeader( request: any ): string | undefined {
        const [ type, token ] = request.headers.authorization?.split( ' ' ) ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly kafkaService: KafkaService,
        @Inject( CACHE_MANAGER ) private cacheManager: Cache,
    ) { }

    async canActivate( context: ExecutionContext ): Promise<boolean> {

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if ( !authHeader || !authHeader.startsWith( 'Bearer ' ) ) {
            throw new UnauthorizedException( 'No token provided' );
        }

        const token = authHeader.split( ' ' )[ 1 ];

        const cacheKey = `validated_token:${ token }`;

        const cachedUser = await this.cacheManager.get( cacheKey );

        if ( cachedUser ) {
            request.user = cachedUser;
            return true;
        }

        try {
            const user = await this.kafkaService.validateToken( token );

            if ( !user ) {
                throw new UnauthorizedException( 'Invalid token' );
            }

            request.user = user;

            return true;
        } catch ( error ) {
            throw new UnauthorizedException( 'Authentication failed' );
        }
    }
}
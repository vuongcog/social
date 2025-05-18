// api-gateway/src/auth/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

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

        // Kiểm tra token trong cache
        const cacheKey = `validated_token:${ token }`;
        const cachedUser = await this.cacheManager.get( cacheKey );

        if ( cachedUser ) {
            request.user = cachedUser;
            return true;
        }

        try {
            // Xác thực token qua Auth Service
            const user = await this.kafkaService.validateToken( token );

            if ( !user ) {
                throw new UnauthorizedException( 'Invalid token' );
            }

            // Lưu vào cache để sử dụng lần sau
            await this.cacheManager.set( cacheKey, user, 300000 ); // 5 phút

            request.user = user;
            return true;
        } catch ( error ) {
            throw new UnauthorizedException( 'Authentication failed' );
        }
    }
}
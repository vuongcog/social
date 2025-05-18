// auth-service/src/auth/auth.service.ts
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { KafkaService } from './kafka/kafka.service';
import type { LoginDto, TokenPayloadDto, RegisterDto } from '@app/common/dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly kafkaService: KafkaService,
        @Inject( CACHE_MANAGER ) private cacheManager: Cache,
    ) { }

    async register( registerDto: RegisterDto ) {
        try {
            const existingUser = await this.kafkaService.getUserByEmail( registerDto.email );

            if ( existingUser ) {
                throw new Error( 'User already exists' );
            }

            const user = await this.kafkaService.createUser( registerDto );

            return this.generateTokens( user );
        } catch ( error ) {
            console.error( 'Registration error:', error );
            throw error;
        }
    }

    async login( loginDto: LoginDto ) {
        try {
            const user = await this.kafkaService.getUserByEmail( loginDto.email );

            if ( !user ) {
                throw new UnauthorizedException( 'Invalid credentials' );
            }

            // Trong thực tế, password hash sẽ được trả về từ user service
            // Ở đây giả định rằng chúng ta có thể lấy hash từ service đó
            const userWithPassword = await this.kafkaService.getUserByEmail( loginDto.email );

            const isPasswordValid = await bcrypt.compare(
                loginDto.password,
                userWithPassword.password,
            );

            if ( !isPasswordValid ) {
                throw new UnauthorizedException( 'Invalid credentials' );
            }

            return this.generateTokens( user );
        } catch ( error ) {
            console.error( 'Login error:', error );
            throw error;
        }
    }

    async validateToken( token: string ) {
        const cacheKey = `token:${ token }`;

        // Check blacklist
        const isBlacklisted = await this.cacheManager.get( `blacklist:${ token }` );
        if ( isBlacklisted ) {
            throw new UnauthorizedException( 'Token is invalid' );
        }

        // Check cache for validated token
        const cachedValidation = await this.cacheManager.get( cacheKey );
        if ( cachedValidation ) {
            return cachedValidation;
        }

        try {
            const decoded = jwt.verify( token, process.env.JWT_SECRET || "huynhnhatvuong1" ) as TokenPayloadDto;

            // Check if user still exists
            const user = await this.kafkaService.getUserById( decoded.userId );
            if ( !user ) {
                throw new UnauthorizedException( 'User no longer exists' );
            }

            // Cache validation result
            await this.cacheManager.set( cacheKey, { userId: decoded.userId, email: decoded.email }, 300000 ); // 5 minutes

            return { userId: decoded.userId, email: decoded.email };
        } catch ( error ) {
            throw new UnauthorizedException( 'Invalid token' );
        }
    }

    private generateTokens( user: any ) {
        const payload: TokenPayloadDto = {
            userId: user.id,
            email: user.email,
        };

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET || "huynhnhatvuong1",
            { expiresIn: '15m' },
        );

        const refreshToken = jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET || "huynhnhatvuong1",
            { expiresIn: '7d' },
        );

        return {
            accessToken,
            refreshToken,
        };
    }

    async logout( token: string ) {
        await this.cacheManager.set( `blacklist:${ token }`, true, 86400 );
        return { success: true };
    }
}
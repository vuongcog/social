import { BaseResponse } from './../../../libs/common/src/interfaces/response.interface';
// auth-service/src/auth/auth.service.ts
import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { KafkaService } from './kafka/kafka.service';
import type { LoginDto, TokenPayloadDto, RegisterDto } from '@app/common/dto/auth.dto';
import { throwCatch } from '@app/common/utils/throw-catch';

@Injectable()
export class AuthService {
    constructor(
        private readonly kafkaService: KafkaService,
        @Inject( CACHE_MANAGER ) private cacheManager: Cache,
    ) { }

    async validateUser( email: string, password: string ): Promise<any> {
        const result: BaseResponse = await this.kafkaService.findByEmail( email );
        if ( !result?.data ) {
            throw new UnauthorizedException( 'Email hoặc mật khẩu không chính xác' );
        }

        const isPasswordValid = await bcrypt.compare( password, result.data.password );
        if ( !isPasswordValid ) {
            throw new UnauthorizedException( 'Email hoặc mật khẩu không chính xác' );
        }

        const { password: _, ...response } = result.data;
        return response;
    }


    async register( registerDto: RegisterDto ): Promise<BaseResponse> {

        try {
            const resultUser: BaseResponse = await this.kafkaService.findByEmail( registerDto.email );

            if ( resultUser.data ) {
                const { data, ...responseData } = resultUser;
                throw { ...responseData, status: "error" } as BaseResponse;
            }

            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash( registerDto.password, salt );

            const newUser: BaseResponse = await this.kafkaService.createUser( {
                ...registerDto,
                password: hashedPassword,
                provider: 'local',
            } );

            const { password: _, ...result } = newUser.data;

            const loginResult = await this.login( result );

            const responseValue: BaseResponse = {
                status: 'success',
                message: 'Register is successfuly',
                accessToken: loginResult.accessToken,
                refresh: loginResult.refreshToken,
            }
            return responseValue
        }
        catch ( error: BaseResponse | any ) {

            return throwCatch( error )

        }
    }

    async login( user: any ) {

        const payload = { email: user.email, sub: user.id }

        return this.generateTokens( payload )
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

    async validateGoogleUser( profile: any ) {
        const { email, name } = profile;
        let result = await this.kafkaService.findByEmail( email );


        if ( !result?.data ) {
            const randomPassword = Math.random().toString( 36 ).slice( -8 );
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash( randomPassword, salt );
            const accountInforUser = {
                email, name, password: hashedPassword, provider: 'google', providerId: profile.id
            }
            result = await this.kafkaService.createUser( accountInforUser )
        }

        const { password: _, ...response } = result.data;
        return response;
    }


    async googleLogin( req ) {

        if ( !req ) {
            throw new UnauthorizedException( 'Không thể xác thực với Google' );
        }


        return this.login( req );
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
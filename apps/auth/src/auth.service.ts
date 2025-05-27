import { HttpStatus } from '@nestjs/common';
import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { KafkaService } from './kafka/kafka.service';
import type { LoginDto, TokenPayloadDto, RegisterDto } from '@app/common/dto/auth.dto';
import { throwCatch } from '@app/common/utils/throw-catch';
import { CONSTANTS, type BaseResponse } from '@app/common';

@Injectable()
export class AuthService {
    constructor(
        private readonly kafkaService: KafkaService,
        @Inject( CACHE_MANAGER ) private cacheManager: Cache,
    ) { }

    async validateUser( email: string, password: string ): Promise<BaseResponse<LoginDto>> {
        try {
            const result: BaseResponse = await this.kafkaService.findByEmail( email );

            if ( !result?.data ) {
                const { data, ...other } = result

                const response: BaseResponse = {
                    ...other,
                    error: {
                        ...result.error,
                        primaryMessage: "Tài khoản này không tồn tại",
                    },
                    status: 'error',
                    statusCode: HttpStatus.NOT_FOUND,
                }
                throw ( response );
            }

            const isPasswordValid = await bcrypt.compare( password, result.data.password );
            if ( !isPasswordValid ) {
                const { data, ...other } = result
                const response: BaseResponse = {
                    ...other,
                    statusCode: HttpStatus.UNAUTHORIZED,
                    status: 'error',
                    error: {
                        ...result.error,
                        primaryMessage: "Mật khẩu không đúng",
                    },
                }
                throw ( response );
            }

            const { password: _, ...user } = result.data;
            const loginResponseData: LoginDto = {
                email: result.data.email,
                id: result.data.id,
            }

            const response: BaseResponse<LoginDto> = {
                statusCode: HttpStatus.CREATED,
                status: 'success',
                message: "Đăng nhập thành công",
                data: loginResponseData
            }

            return response;
        } catch ( error ) {
            throw throwCatch( error )
        }
    }


    async register( registerDto: RegisterDto ): Promise<BaseResponse> {

        try {
            const resultUser: BaseResponse = await this.kafkaService.findByEmail( registerDto.email );

            if ( resultUser.data ) {
                const { data, ...responseData } = resultUser;
                throw { ...responseData, status: "error", statusCode: HttpStatus.CONFLICT } as BaseResponse;
            }

            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash( registerDto.password, salt );

            const result: BaseResponse = await this.kafkaService.createUser( {
                ...registerDto,
                password: hashedPassword,
                provider: 'local',
            } );

            const { password: _, ...userData } = result.data;

            const loginResult = await this.login( userData );

            const responseValue: BaseResponse = {
                statusCode: HttpStatus.CREATED,
                status: 'success',
                message: 'Register is successfuly',
                messages: [ ...( result.messages ? result.messages : [] ) ],

                data: {
                    ...result.data,
                    accessToken: loginResult.accessToken,
                    refresh: loginResult.refreshToken,
                },

            }
            return responseValue
        }
        catch ( error: BaseResponse | any ) {

            throw throwCatch( error )

        }
    }



    async localLogin( user: any ): Promise<BaseResponse> {
        try {
            if ( !user?.email ) {
                throw {
                    statusCode: HttpStatus.BAD_REQUEST,
                    status: 'error',
                    error: {
                        message: "Vui lòng nhập email"
                    }
                } as BaseResponse
            }
            if ( !user?.id ) {
                throw {
                    statusCode: HttpStatus.NOT_FOUND,
                    status: 'error',
                    error: {
                        message: "User không tồn tại"
                    }
                } as BaseResponse
            }
            const tokens = await this.login( user )
            return {
                statusCode: HttpStatus.BAD_GATEWAY,
                status: 'success',
                message: "Đăng nhập thành công",
                data: tokens,
            }
        } catch ( error ) {
            throw throwCatch( error )
        }
    }

    async validateToken( token: string ): Promise<BaseResponse> {

        try {
            const cacheKey = `validated_token:${ token }`;
            const isBlacklisted = await this.cacheManager.get( `blacklist:${ token }` );
            if ( isBlacklisted ) {
                throw {
                    statusCode: HttpStatus.FORBIDDEN,
                    status: "error",
                    error: {
                        message: "Tài khoản người dùng đã bị cấm",
                    }
                } as BaseResponse;
            }

            const cachedValidation = await this.cacheManager.get( cacheKey );

            if ( cachedValidation ) {
                return {
                    statusCode: HttpStatus.CREATED,
                    status: 'success',
                    message: "Xác thực thành công",
                    data: cachedValidation,
                }
            }

            const decoded = jwt.verify( token, process.env.JWT_SECRET || "huynhnhatvuong1" ) as TokenPayloadDto;

            const user = await this.kafkaService.getUserById( decoded.userId );

            if ( !user?.data ) {
                throw {
                    statusCode: HttpStatus.NOT_FOUND,
                    status: "error",
                    error: {
                        message: "Tài khoản người dùng không còn tồn tại",
                    }
                } as BaseResponse;

            }
            const data = { userId: decoded.userId, email: decoded.email };
            await this.cacheManager.set( cacheKey, { userId: decoded.userId, email: decoded.email }, CONSTANTS.CACHE_EXPRIES[ '30m' ] );
            return {
                statusCode: HttpStatus.CREATED,
                status: 'success',
                data
            };

        } catch ( error ) {
            throw throwCatch( error );
        }
    }

    async validateGoogleUser( profile: any ): Promise<BaseResponse> {

        try {

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

            return {
                statusCode: HttpStatus.OK,
                status: "success",
                message: "Xác thực thành công",
                data: response,
            }

        } catch ( error ) {
            throw throwCatch( error )

        }
    }


    async googleLogin( req ): Promise<BaseResponse> {

        try {
            if ( !req ) {
                throw {
                    status: "error",
                    statusCode: HttpStatus.BAD_REQUEST,
                    error: {
                        message: "Thông tin không đầy đủ"
                    }
                } as BaseResponse

            }
            const token = await this.login( req );

            return {
                status: "success",
                statusCode: HttpStatus.OK,
                message: "Đăng nhập thành công",
                data: token,
            }

        } catch ( error: BaseResponse | any ) {

            throw throwCatch( error )

        }

    }
    async login( user: any ) {

        const payload = { email: user.email, sub: user.id }

        const token = this.generateTokens( payload )

        const cacheKey = `validated_token:${ token.accessToken }`;

        const isBlacklisted = await this.cacheManager.get( `blacklist:${ token.accessToken }` );

        if ( isBlacklisted ) {
            throw new UnauthorizedException( 'Token is invalid' );
        }
        const catchTokenValue = { email: user.email, userId: user.id } as TokenPayloadDto;
        await this.cacheManager.set( `${ cacheKey }`, catchTokenValue, 1 );

        return token

    }

    private generateTokens( user: any ) {
        const payload: TokenPayloadDto = {
            userId: user.sub,
            email: user.email,
        };

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET || "huynhnhatvuong1",
            { expiresIn: '1d' },
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
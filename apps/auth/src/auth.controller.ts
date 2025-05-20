import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
import type { LoginDto, RegisterDto } from '@app/common/dto/auth.dto';
import { CONSTANTS, type BaseResponse } from '@app/common';
import { Public } from '../../api-gateway/src/auth/public.decorator';

@Controller()
export class AuthController {
    constructor( private readonly authService: AuthService ) { }

    @MessagePattern( KAFKA_TOPICS.AUTH_REGISTER )
    async register( @Payload() registerDto: RegisterDto ) {
        try {
            const result: BaseResponse = await this.authService.register( registerDto );
            return result

        } catch ( error ) {
            if ( error.status ) {
                return error as BaseResponse
            }
            else {
                return {
                    status: 'error',
                    error: {
                        details: error,
                    }
                } as BaseResponse;
            }
        }
    }


    @MessagePattern( KAFKA_TOPICS.AUTH_LOGIN )
    async login( @Payload() loginDto: LoginDto ) {
        return this.authService.login( loginDto );
    }



    @MessagePattern( KAFKA_TOPICS.AUTH_VALIDATE )
    async validateToken( @Payload() data: { token: string } ) {
        return this.authService.validateToken( data.token );
    }


    @MessagePattern( CONSTANTS.KAFKA_TOPICS.AUTH_HEALTH )
    async handleHealthCheck( @Payload() payload: any ) {
        return true;
    }

    @MessagePattern( CONSTANTS.KAFKA_TOPICS.AUTH_VALIDATE_GOOLE )
    async validateGoogle( @Payload() payload: any ) {
        return this.authService.validateGoogleUser( payload )

    }

    @MessagePattern( KAFKA_TOPICS.AUTH_GOOGLE_LOGIN )
    async googleLogin( @Payload() userData: any ) {
        const a = 1;
        return this.authService.googleLogin( userData );

    }

    @MessagePattern( CONSTANTS.KAFKA_TOPICS.AUTH_VALIDATE_USER )
    async validateUser( @Payload() payload: any ) {
        return this.authService.validateUser( payload.email, payload.password )
    }



}
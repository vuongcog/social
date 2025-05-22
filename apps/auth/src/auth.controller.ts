import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
import type { LoginDto, RegisterDto } from '@app/common/dto/auth.dto';
import { CONSTANTS, type BaseResponse } from '@app/common';
import { Public } from '../../api-gateway/src/auth/public.decorator';
import { throwCatch } from '@app/common/utils/throw-catch';

@Controller()
export class AuthController {
    constructor( private readonly authService: AuthService ) { }

    @MessagePattern( KAFKA_TOPICS.AUTH_REGISTER )
    async register( @Payload() registerDto: RegisterDto ) {
        try {
            const result: BaseResponse = await this.authService.register( registerDto );
            return result

        } catch ( error ) {
            return throwCatch( error )

        }
    }


    @MessagePattern( KAFKA_TOPICS.AUTH_LOGIN )
    async login( @Payload() loginDto: LoginDto ) {
        try {
            const result: BaseResponse = await this.authService.localLogin( loginDto );
            return result

        } catch ( error ) {
            return throwCatch( error )
        }
    }



    @MessagePattern( KAFKA_TOPICS.AUTH_VALIDATE )
    async validateToken( @Payload() payload: { token: string } ) {
        try {
            const result: BaseResponse = await this.authService.validateToken( payload.token );
            return result

        } catch ( error ) {
            return throwCatch( error )

        }
    }


    @MessagePattern( CONSTANTS.KAFKA_TOPICS.AUTH_HEALTH )
    async handleHealthCheck( @Payload() payload: any ) {
        return true;
    }

    @MessagePattern( CONSTANTS.KAFKA_TOPICS.AUTH_VALIDATE_GOOLE )
    async validateGoogle( @Payload() payload: any ) {

        try {
            const result: BaseResponse = await this.authService.validateGoogleUser( payload );
            return result

        } catch ( error ) {
            return throwCatch( error )

        }

    }

    @MessagePattern( KAFKA_TOPICS.AUTH_GOOGLE_LOGIN )
    async googleLogin( @Payload() userData: any ) {
        try {
            const result: BaseResponse = await this.authService.googleLogin( userData );
            return result

        } catch ( error ) {
            return throwCatch( error )

        }

    }

    @MessagePattern( CONSTANTS.KAFKA_TOPICS.AUTH_VALIDATE_USER )
    async validateUser( @Payload() payload: any ): Promise<BaseResponse<LoginDto>> {

        try {
            const result: BaseResponse<LoginDto> = await this.authService.validateUser( payload.email, payload.password )
            return result

        } catch ( error ) {
            return throwCatch( error )

        }
    }



}
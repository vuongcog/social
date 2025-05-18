// auth-service/src/auth/auth.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
import type { LoginDto, RegisterDto } from '@app/common/dto/auth.dto';
import { CONSTANTS } from '@app/common';

@Controller()
export class AuthController {
    constructor( private readonly authService: AuthService ) { }

    @MessagePattern( KAFKA_TOPICS.AUTH_REGISTER )
    async register( @Payload() registerDto: RegisterDto ) {
        return this.authService.register( registerDto );
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
        const a = payload;
        return true;
    }
}
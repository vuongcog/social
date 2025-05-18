// api-gateway/src/auth/auth.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import type { LoginDto, RegisterDto } from '@app/common/dto/auth.dto';

@Controller( 'auth' )
export class AuthController {
    constructor( private readonly kafkaService: KafkaService ) { }

    @Post( 'register' )
    async register( @Body() registerDto: RegisterDto ) {
        try {
            return await this.kafkaService.register( registerDto );
        } catch ( error ) {
            throw new HttpException(
                error.message || 'Registration failed',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Post( 'login' )
    async login( @Body() loginDto: LoginDto ) {
        try {
            return await this.kafkaService.login( loginDto );
        } catch ( error ) {
            throw new HttpException(
                error.message || 'Login failed',
                HttpStatus.UNAUTHORIZED,
            );
        }
    }

    @Post( 'logout' )
    async logout( @Body() body: { token: string } ) {
        try {

            return { success: true, message: 'Logged out successfully' };
        } catch ( error ) {
            throw new HttpException(
                error.message || 'Logout failed',
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
import { Controller, Post, Body, HttpException, HttpStatus, UseGuards, Get, Req, Res } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import type { LoginDto, RegisterDto } from '@app/common/dto/auth.dto';
import { Public } from './public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { BaseResponse } from '@app/common';

@Controller( 'auth' )
export class AuthController {
    constructor( private readonly kafkaService: KafkaService ) { }


    @Public()
    @Post( 'register' )
    async register( @Body() registerDto: RegisterDto ) {
        try {
            const result = await this.kafkaService.register( registerDto );

            if ( result.status === "error" ) {
                throw result;
            }
            return result

        } catch ( error ) {
            if ( error.status ) {
                throw new HttpException( error as BaseResponse, HttpStatus.BAD_REQUEST,
                )
            }
            else {
                throw new HttpException( {
                    status: 'error',
                    error: {
                        details: error,
                    }
                } as BaseResponse, HttpStatus.BAD_REQUEST )
            }
        }
    }

    @Public()
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


    @Public()
    @UseGuards( GoogleAuthGuard )
    @Get( 'google' )
    async googleAuth() {
    }

    @Public()
    @UseGuards( GoogleAuthGuard )
    @Get( 'google/callback' )
    async googleAuthRedirect( @Req() req, @Res() res ) {

        try {
            const result = await this.kafkaService.googleLogin( req.user );
            res.redirect( `/auth/success?token=${ result.accessToken }` );

        } catch ( error ) {
            throw new HttpException(
                error.message || 'Google Login failed',
                HttpStatus.UNAUTHORIZED,
            );
        }
    }


}
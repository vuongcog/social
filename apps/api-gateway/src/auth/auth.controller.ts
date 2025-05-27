import { Controller, Post, Body, HttpException, HttpStatus, UseGuards, Get, Req, Res } from '@nestjs/common';
import type { LoginDto, RegisterDto } from '@app/common/dto/auth.dto';
import { Public } from './public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { BaseResponse } from '@app/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { throwCatchHtpp } from '@app/common/utils/http-throw-catch';
import { responseData } from '@app/common/utils/response';
import { AuthKafkaService } from '../kafka/auth/gateway.auth-kafka.service';

@Controller( 'auth' )
export class AuthController {

    constructor( private readonly kafkaService: AuthKafkaService ) { }


    @Public()
    @Post( 'register' )
    async register( @Body() registerDto: RegisterDto, @Res() res: ExpressResponse ) {
        try {
            const result: BaseResponse = await this.kafkaService.register( registerDto );

            return responseData( res, result );

        } catch ( error ) {
            throw throwCatchHtpp( error )
        }
    }


    @Public()
    @UseGuards( LocalAuthGuard )
    @Post( 'login' )
    async login(
        @Req() req: ExpressRequest,
        @Res() res: ExpressResponse
    ) {
        try {

            const userInfor: LoginDto = {
                email: req?.user?.data?.email,
                id: req?.user?.data?.id,
            }
            const result = await this.kafkaService.login( userInfor );

            return responseData( res, result );

        } catch ( error ) {
            throw throwCatchHtpp( error )
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
    async googleAuthRedirect( @Req() req: ExpressRequest, @Res() res: ExpressResponse ) {

        try {
            const result = await this.kafkaService.googleLogin( req?.user );
            res.redirect( `/auth/success?token=${ result?.data?.accessToken }` );

        } catch ( error ) {

            throw throwCatchHtpp( error )

        }
    }


}
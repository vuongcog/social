import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";
import { CreateUserDTO } from "src/api/user/dto/create-user.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { ConfigService } from "@nestjs/config";
import { console } from "node:inspector/promises";

@Controller( "auth" )
export class AuthController {
    constructor( private authService: AuthService ) {
    }

    @Public()
    @Post( 'register' )
    async register( @Body() createUserDto: CreateUserDTO ) {
        return this.authService.register( createUserDto );
    }

    @Public()
    @UseGuards( LocalAuthGuard )
    @Post( 'login' )
    async login( @Req() req ) {
        return this.authService.login( req.user );
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
        const result = await this.authService.googleLogin( req );
        res.redirect( `/auth/success?token=${ result.access_token }` );
    }

    @Get( 'profile' )
    getProfile( @Req() req ) {
        return req.user;
    }

}
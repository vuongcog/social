import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";
import type { CreateUserDTO } from "src/api/user/dto/create-user.dto";

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
}
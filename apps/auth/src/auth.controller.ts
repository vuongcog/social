import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
    constructor( private readonly authService: AuthService,


    ) { }

    @MessagePattern( 'auth.login' )
    async login( @Payload() data: { email: string; password: string } ) {
        const user = await this.authService.validateUser( data.email, data.password );
        if ( !user ) {
            return { success: false, message: 'Invalid credentials' };
        }
        return {
            success: true,
            data: await this.authService.login( user ),
        };
    }

    @MessagePattern( 'auth.register' )
    async register( @Payload() data: { email: string; password: string; name: string } ) {
        try {
            const user = await this.authService.register(
                data.email,
                data.password,
                data.name,
            );
            return { success: true, data: user };
        } catch ( error ) {
            return { success: false, message: error.message };
        }
    }

    @MessagePattern( 'auth.validate' )
    async validate( @Payload() data: { token: string } ) {
        try {
            const decoded = this.authService[ 'jwtService' ].verify( data.token, {
                secret: this.authService[ 'configService' ].jwtSecret,
            } );
            return { success: true, data: decoded };
        } catch ( error ) {
            return { success: false, message: 'Invalid token' };
        }
    }
}
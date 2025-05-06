import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "src/api/user/user.service";
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from "bcrypt";
import type { CreateUserDTO } from "src/api/user/dto/create-user.dto";
@Injectable()
export class AuthService {
    constructor( private userService: UserService, private jwtService: JwtService ) { }
    async validateUser( email: string, password: string ): Promise<any> {
        const user = await this.userService.findByEmail( email );
        if ( !user ) {
            throw new UnauthorizedException( 'Email hoặc mật khẩu không chính xác' );
        }

        const isPasswordValid = await bcrypt.compare( password, user.password );
        if ( !isPasswordValid ) {
            throw new UnauthorizedException( 'Email hoặc mật khẩu không chính xác' );
        }

        const { password: _, ...result } = user;
        return result;
    }

    async login( user: any ) {
        const payload = { email: user.email, sub: user.id }
        return {
            user,
            access_token: this.jwtService.sign( payload ),
        };
    }

    async register( createUserDto: CreateUserDTO ) {
        const existingUser = await this.userService.findByEmail( createUserDto.email );
        if ( existingUser ) {
            throw new ConflictException( 'Email đã được sử dụng' );
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash( createUserDto.password, salt );

        const newUser = await this.userService.createUser( {
            ...createUserDto,
            password: hashedPassword,
            provider: 'local',
        } );

        const { password: _, ...result } = newUser;
        return this.login( result );
    }

    async validateGoogleUser( profile: any ) {
        const { email, name } = profile;
        let user = await this.userService.findByEmail( email );
        if ( !user ) {
            const randomPassword = Math.random().toString( 36 ).slice( -8 );
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash( randomPassword, salt );
            user = await this.userService.createUser( {
                email, name, password: hashedPassword, provider: 'google', providerId: profile.id
            } )
        }

        const { password: _, ...result } = user;

    }
    async googleLogin( req ) {
        if ( !req.user ) {
            throw new UnauthorizedException( 'Không thể xác thực với Google' );
        }

        return this.login( req.user );
    }
}
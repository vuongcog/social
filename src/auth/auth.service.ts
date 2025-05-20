import { BaseResponse } from './../../libs/common/src/interfaces/response.interface';
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "src/api/user/user.service";
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from "bcrypt";
import { CreateUserDTO } from "src/api/user/dto/create-user.dto";
import { console } from "node:inspector/promises";

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

    async register( createUserDto: CreateUserDTO ): Promise<BaseResponse> {
        try {

            const responseUser: BaseResponse = await this.userService.findByEmail( createUserDto.email );

            if ( responseUser.data ) {
                throw ( responseUser );
            }

            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash( createUserDto.password, salt );

            const newUser: BaseResponse = await this.userService.create( {
                ...createUserDto,
                password: hashedPassword,
                provider: 'local',
            } );

            const { password: _, ...result } = newUser.data;

            const loginResult = this.login( result );

            const responseValue: BaseResponse = {
                status: 'success',
                message: 'Login is Successfuly',
                data: loginResult,
            }
            
            return responseValue


        } catch ( error: BaseResponse | any ) {
            if ( error.status ) {
                throw error as BaseResponse
            }
            else {
                throw {
                    status: 'error',
                    error: {
                        details: error,
                    }
                } as BaseResponse;
            }

        }
    }

    async validateGoogleUser( profile: any ) {
        const { email, name } = profile;
        let user = await this.userService.findByEmail( email );

        if ( !user ) {
            const randomPassword = Math.random().toString( 36 ).slice( -8 );
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash( randomPassword, salt );
            const accountInforUser = {
                email, name, password: hashedPassword, provider: 'google', providerId: profile.id
            }
            user = await this.userService.create( accountInforUser )
        }

        const { password: _, ...result } = user;
        return result;
    }

    async googleLogin( req ) {

        if ( !req.user ) {
            throw new UnauthorizedException( 'Không thể xác thực với Google' );
        }

        const result = await this.validateGoogleUser( req );

        return this.login( result );
    }
}
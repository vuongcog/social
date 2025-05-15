import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@app/database';
import { ConfigService } from '@app/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,

    ) { }


    async validateUser( email: string, password: string ): Promise<any> {
        const user = await this.prisma.user.findUnique( { where: { email } } );
        if ( user && await bcrypt.compare( password, user.password ) ) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login( user: any ) {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign( payload, {
                secret: this.configService.jwtSecret,
                expiresIn: this.configService.jwtExpiresIn,
            } ),
        };
    }

    async register( email: string, password: string, name: string ) {
        const hashedPassword = await bcrypt.hash( password, 10 );

        const user = await this.prisma.user.create( {
            data: {
                email,
                password: hashedPassword,
                name,
            },
        } );

        const { password: _, ...result } = user;
        return result;
    }


}
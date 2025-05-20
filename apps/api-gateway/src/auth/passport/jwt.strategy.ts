import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy( Strategy ) {
    constructor( configService: ConfigService ) {
        const a = configService.get<string>( 'JWT_SECRET' )
        super( {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>( 'JWT_SECRET' ),
        } );
    }

    async validate( payload: any ) {

        return { id: payload.sub, email: payload.email };
    }
}
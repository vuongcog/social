import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./passport/local.strategy";
import { JwtStrategy } from "./passport/jwt.strategy";
import { GoogleStrategy } from "./passport/google.strategy";
import { AuthController } from "./auth.controller";
import { UserModule } from "src/api/user/user.module";

@Module( {
    imports: [
        UserModule,
        JwtModule.registerAsync( {
            inject: [ ConfigService ],
            useFactory: async ( configService: ConfigService ) => ( {
                secret: configService.get<string>( 'JWT_SECRET' ),
                signOptions: { expiresIn: '1d' },
            } ),
        } ),
    ],

    providers: [ LocalStrategy, AuthService, JwtStrategy, GoogleStrategy ],
    controllers: [ AuthController ],
    exports: [ AuthService ],
} )
export class AuthModule { }
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from '@app/database';
import { ConfigModule, ConfigService } from '@app/config';

@Module( {
  imports: [
    DatabaseModule,
    ConfigModule,
    JwtModule.registerAsync( {
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      useFactory: ( configService: ConfigService ) => ( {
        secret: configService.jwtSecret,
        signOptions: { expiresIn: configService.jwtExpiresIn },
      } ),
    } ),
  ],
  controllers: [ AuthController ],
  providers: [ AuthService ],
  exports: [ AuthService ],

} )
export class AuthModule { }
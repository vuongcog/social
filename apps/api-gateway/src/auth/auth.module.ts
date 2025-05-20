import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { CacheModule } from '@nestjs/cache-manager';
import { LocalStrategy } from './passport/local.strategy';
import { JwtStrategy } from './passport/jwt.strategy';
import { GoogleStrategy } from './passport/google.strategy';

@Module( {

    imports: [ KafkaModule, CacheModule.register( {
        ttl: 300000,
        max: 1000,
    } ) ],
    controllers: [ AuthController ],
    providers: [ LocalStrategy, JwtStrategy, GoogleStrategy ],
} )
export class AuthModule { }
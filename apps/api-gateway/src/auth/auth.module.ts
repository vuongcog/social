import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { AuthService } from 'apps/auth/src/auth.service';

@Module( {
    imports: [ KafkaModule ],
    controllers: [ AuthController ],
    // providers: [ AuthService ]

} )
export class AuthModule { }
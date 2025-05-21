import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { JwtStrategy } from '../auth/passport/jwt.strategy';

@Module( {
    imports: [ KafkaModule ],
    controllers: [ UserController ],

} )
export class UserModule { }
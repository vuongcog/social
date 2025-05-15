import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { UserService } from './user.service';

@Module( {
    imports: [ KafkaModule ],
    controllers: [ UserController ],
    // providers: [ UserService ],

} )
export class UserModule { }
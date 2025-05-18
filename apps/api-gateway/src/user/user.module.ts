import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { KafkaModule } from '../kafka/kafka.module';

@Module( {
    imports: [ KafkaModule ],
    controllers: [ UserController ],
} )
export class UserModule { }
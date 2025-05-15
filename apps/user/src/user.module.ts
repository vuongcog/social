import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DatabaseModule } from '@app/database';
import { KafkaModule } from '@app/kafka';

@Module( {
    imports: [ DatabaseModule, KafkaModule ],
    controllers: [ UserController ],
    providers: [ UserService ],
} )
export class UserModule { }
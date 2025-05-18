import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DatabaseModule } from '@app/database';
import { KafkaModule } from '@app/kafka';
import { CacheModule } from '@nestjs/cache-manager';

@Module( {
    imports: [ DatabaseModule, KafkaModule, CacheModule.register( {
        ttl: 600000,
        max: 100,
    } ), ],
    controllers: [ UserController ],
    providers: [ UserService ],
} )
export class UserModule { }
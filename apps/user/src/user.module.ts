import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DatabaseModule } from '@app/database';
import { CacheModule } from '@nestjs/cache-manager';
import { KafkaModule } from './kafka/kafka.module';

@Module( {
    imports: [ DatabaseModule, KafkaModule, CacheModule.register( {
        ttl: 600000,
        max: 100,
    } ), ],
    controllers: [ UserController ],
    providers: [ UserService ],
} )
export class UserModule { }
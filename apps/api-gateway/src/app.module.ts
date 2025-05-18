import { Module } from '@nestjs/common';
import { ConfigModule } from '@app/config';
import { KafkaModule } from './kafka/kafka.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { HealthModule } from './health/health.module';

@Module( {
    imports: [
        ConfigModule,
        CacheModule.register( {
            isGlobal: true,
            ttl: 300000,
            max: 1000,
        } ),
        AuthModule,
        UserModule,
        KafkaModule,
        HealthModule,
    ],
} )
export class AppModule { }
import { Module } from '@nestjs/common';
import { ConfigModule } from '@app/config';
import { KafkaModule } from './kafka/kafka.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { HealthModule } from './health/health.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import * as dotenv from 'dotenv';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';

dotenv.config();
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
        ElasticsearchModule

    ],
    providers: [ {
        provide: APP_GUARD,
        useClass: JwtAuthGuard,
    } ],
} )
export class AppModule { }
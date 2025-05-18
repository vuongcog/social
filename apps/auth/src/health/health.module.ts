import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { KafkaHealthIndicator } from './indicators/kafka.health';
import { KafkaModule } from '../kafka/kafka.module';
import { HealthController } from './indicators/health.controller';
import { CacheHealthIndicator } from './indicators/cache.health';

@Module( {
    imports: [
        TerminusModule,
        HttpModule,
        KafkaModule
    ],
    controllers: [ HealthController ],
    providers: [ KafkaHealthIndicator, CacheHealthIndicator ],
} )
export class HealthModule { }
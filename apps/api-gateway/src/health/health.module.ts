import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { ConfigModule } from '@nestjs/config';
import { ServicesHealthIndicator } from './indicators/services.health';

@Module( {
    imports: [
        TerminusModule,
        HttpModule,
        ConfigModule
    ],
    controllers: [ HealthController ],
    providers: [ ServicesHealthIndicator ],
} )
export class HealthModule { }
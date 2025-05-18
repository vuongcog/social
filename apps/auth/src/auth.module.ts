import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from '@app/database';
import { ConfigModule, ConfigService } from '@app/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CONSTANTS } from '@app/common';
import { convertBrokers } from '@app/common/utils/convert-brokers';
import { KafkaModule } from './kafka/kafka.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { CacheHealthIndicator } from './health/indicators/cache.health';
import { KafkaHealthIndicator } from './health/indicators/kafka.health';
import { HealthController } from './health/indicators/health.controller';

@Module( {
  imports: [
    TerminusModule,
    HttpModule,
    DatabaseModule,
    ConfigModule,
    KafkaModule,
    CacheModule.register( {
      isGlobal: true,
      ttl: 300000,
      max: 1000,
    } ),
    JwtModule.registerAsync( {
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      useFactory: ( configService: ConfigService ) => ( {
        secret: configService.jwtSecret,
        signOptions: { expiresIn: configService.jwtExpiresIn },
      } ),
    } ),
  ],

  controllers: [ AuthController, HealthController ],
  providers: [ AuthService, KafkaHealthIndicator, CacheHealthIndicator ],
  exports: [ AuthService ],

} )
export class AuthModule { }
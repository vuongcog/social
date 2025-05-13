import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { MyElasticSearchModule } from './elasticsearch/myelasticsearch.module';
import { UserModule } from './api/user/user.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { KafkaModule } from './kafka/kafka.module';
@Module( {
  imports: [ PrismaModule, ConfigModule, MyElasticSearchModule, UserModule, AuthModule, KafkaModule ],
  controllers: [ AppController ],
  providers: [ AppService, {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  } ],
} )
export class AppModule { }

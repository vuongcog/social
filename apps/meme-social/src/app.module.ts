import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { MyElasticSearchModule } from 'src/elasticsearch/myelasticsearch.module';
import { UserModule } from 'src/api/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
@Module( {
  imports: [ PrismaModule, ConfigModule, MyElasticSearchModule, UserModule, AuthModule, KafkaModule ],
  controllers: [ AppController ],
  providers: [ AppService, {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  } ],
} )
export class AppModule { }

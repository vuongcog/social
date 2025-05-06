import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { MyElasticSearchModule } from './elasticsearch/myelasticsearch.module';
import { UserModule } from './api/user/user.module';
@Module( {
  imports: [ PrismaModule, ConfigModule, MyElasticSearchModule, UserModule ],
  controllers: [ AppController ],
  providers: [ AppService ],
} )
export class AppModule { }

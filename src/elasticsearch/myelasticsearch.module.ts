import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { MyElasticSearchService } from './myelasticsearch.service';
import { ElasticsearchController } from './myelasticsearch.controller';
import { ConfigModule } from 'src/config/config.module';
import { async } from 'rxjs';
import  { ConfigService } from '@nestjs/config';

@Module({
imports: [
    ElasticsearchModule.registerAsync({
      imports:[ConfigModule],
      useFactory: async (configService:ConfigService)=>({
        node: configService.get('ELASTICSEARCH_NODE') || 'http://localhost:9200',
        auth:{
          username: configService.get('ELASTICSEARCH_USERNAME') || 'elastic',
          password: configService.get('ELASTICSEARCH_PASSWORD') || 'changeme',
        },
        tsl:{
          rejectUnauthorized: false, 
        }
      }),
      inject: [ConfigService],

    }),
  ],
  controllers:[ElasticsearchController],
  providers: [MyElasticSearchService],
  exports: [MyElasticSearchService],
})
export class MyElasticSearchModule {}

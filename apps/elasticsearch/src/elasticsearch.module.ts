import { Global, Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchController } from './elasticsearch.controller';
import { MyElasticSearchService } from './elasticsearch.service';
import { ConfigModule } from '@app/config';
import { ElasticsearchAnalyzerController } from './elasticsearch.field-analyzer.controller';
import { ElasticsearchFieldAnalyzerService } from './elasticsearch.field-analyzer.service';
import { DatabaseModule } from '@app/database';
import { KafkaModule } from './kafka/kafka.module';

@Module( {
  imports: [
    KafkaModule,
    DatabaseModule,
    ElasticsearchModule.registerAsync( {
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      useFactory: async ( configService: ConfigService ) => ( {
        node: configService.get( 'ELASTICSEARCH_NODE' ) || 'http://localhost:9200',
        auth: {
          username: configService.get( 'ELASTICSEARCH_USERNAME' ) || 'elastic',
          password: configService.get( 'ELASTICSEARCH_PASSWORD' ) || 'changeme',
        },
        tls: {
          rejectUnauthorized: false,
        }
      } ),

    } ),
  ],
  controllers: [ ElasticsearchController, ElasticsearchAnalyzerController ],
  providers: [ MyElasticSearchService, ElasticsearchFieldAnalyzerService ],
  exports: [ MyElasticSearchService, ElasticsearchFieldAnalyzerService ],
} )
export class MyElasticSearchModule { }

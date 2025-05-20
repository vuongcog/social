import { Global, Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule } from 'src/config/config.module';
import { ConfigService } from '@nestjs/config';
import { KafkaModule } from 'src/kafka/kafka.module';
import { ElasticsearchController } from './elasticsearch.controller';
import { MyElasticSearchService } from './elasticsearch.service';

@Global()
@Module( {
  imports: [
    KafkaModule,
    ElasticsearchModule.registerAsync( {
      imports: [ ConfigModule ],
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
      inject: [ ConfigService ],

    } ),
  ],
  controllers: [ ElasticsearchController ],
  providers: [ MyElasticSearchService ],
  exports: [ MyElasticSearchService ],
} )
export class MyElasticSearchModule { }

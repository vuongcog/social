import { Module } from '@nestjs/common';
import { ElasticSearchKafkaService } from './elasticsearch/elasticsearch.service';

@Module( {
    providers: [ ElasticSearchKafkaService ],
    exports: [ ElasticSearchKafkaService ],
} )
export class IntegrationModule { }
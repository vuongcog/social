



import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { ElasticsearchController } from './elasticsearch.controller';

@Module( {
    imports: [ KafkaModule ],
    controllers: [ ElasticsearchController ],
} )
export class ElasticsearchModule { }
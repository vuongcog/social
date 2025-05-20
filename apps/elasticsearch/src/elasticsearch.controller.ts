import { KAFKA_TOPICS } from './../../../libs/common/src/constants/kafka-topics';
import { Controller } from '@nestjs/common';
import { MyElasticSearchService } from './elasticsearch.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller( 'elasticsearch' )
export class ElasticsearchController {
  constructor( private readonly esService: MyElasticSearchService ) { }

  @MessagePattern( KAFKA_TOPICS.ELASTICSEARCH_CREATE_INDEX )
  async createIndex( @Payload() payload: any ) {
    return this.esService.createIndex( payload.index, payload.body );
  }

  @MessagePattern( KAFKA_TOPICS.ELASTICSEARCH_DELETE_INDEX )
  async deleteIndex( @Payload() index: string ) {
    return this.esService.deleteIndex( index );
  }

  @MessagePattern( KAFKA_TOPICS.ELASTICSEARCH_INDEX_DOCUMENT )
  async indexDocument(
    @Payload() payload: any,
  ) {
    const { id, ...body } = payload.document;
    const result = await this.esService.indexDocument( payload.index, id, body );
    return result;
  }
  @MessagePattern( KAFKA_TOPICS.ELASTICSEARCH_DELETE_DOCUMENT )
  async deleteDocument( @Payload() payload: any ) {
    return this.esService.deleteDocument( payload.index, payload.id );
  }

  @MessagePattern( KAFKA_TOPICS.ELSATICSEARCH_SEARCH )
  async search(

    @Payload() payload: {
      index: string,
      queries: {
        query: string,
        size?: number,
        from?: number
      }
    }
  ) {
    const { index, queries } = payload;
    const query = queries.query;
    const size = queries.size ?? 10;
    const from = queries.from ?? 0;

    let esQuery;
    if ( query ) {
      esQuery = {
        multi_match: {
          query,
          fields: [ '*' ],
          fuzziness: 'AUTO',
        },
      };
    } else {
      esQuery = { match_all: {} };
    }

    return this.esService.search( index, esQuery, { size, from } );
  }

  @MessagePattern( KAFKA_TOPICS.ELASTICSEARCH_ADVANCED_SEARCH )
  async advancedSearch(
    @Payload() payload: any
  ) {
    const { query, ...options } = payload.searchParams;
    return this.esService.search( payload.index, query, options );
  }

  @MessagePattern( KAFKA_TOPICS.AUTH_HEALTH )
  async checkHealth() {
    return this.esService.checkHealth();
  }

}
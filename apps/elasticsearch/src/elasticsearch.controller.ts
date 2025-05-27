import { throwCatch } from '@app/common/utils/throw-catch';
import { BaseResponse } from './../../../libs/common/src/interfaces/response.interface';
import { KAFKA_TOPICS } from './../../../libs/common/src/constants/kafka-topics';
import { Controller } from '@nestjs/common';
import { MyElasticSearchService } from './elasticsearch.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
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
    try {
      const { id, ...body } = payload.document;
      const result: BaseResponse = await this.esService.indexDocument( payload.index, id, body );
      return result;

    } catch ( error ) {

      return throwCatch( error )

    }

  }

  @MessagePattern( KAFKA_TOPICS.ELASTICSEARCH_DELETE_ALL_DOCUMENT )
  async deleteAllDocument( @Payload() payload: any ): Promise<BaseResponse> {
    try {

      const result = this.esService.deleteAllDocsInIndex();
      return result;

    } catch ( error ) {

      return throwCatch( error )

    }
  }

  @MessagePattern( KAFKA_TOPICS.ELASTICSEARCH_MARK_EXISTING_RECORD_AS_INDEXED )
  async markExistingRecordsAsIndexed( @Payload() payload: any ) {
    try {
      const result = this.esService.markExistingRecordsAsIndexed();
      return result
    } catch ( error ) {
      return throwCatch( error );
    }
  }

  @MessagePattern( KAFKA_TOPICS.ELASTICSEARCH_INDEX_RECORDS_AND_MARK_AS_INDEXED )
  async indexRecordsAndMarkAsIndexed( @Payload() payload: any ) {

    try {
      const result = this.esService.indexRecordsAndMarkAsIndexed();
      return result;
    } catch ( error ) {
      return throwCatch( error )
    }
  }

  @MessagePattern( KAFKA_TOPICS.ELASTICSEARCH_DELETE_DOCUMENT )
  async deleteDocument( @Payload() payload: any ) {
    return this.esService.deleteDocument( payload.index, payload.id );
  }

  // @MessagePattern( KAFKA_TOPICS.ELSATICSEARCH_SEARCH )
  // async search(
  //   @Payload() payload: {
  //     index: string,
  //     queries: {
  //       query: string,
  //       size?: number,
  //       from?: number
  //     }
  //   }
  // ): Promise<BaseResponse> {
  //   try {
  //     const { index, queries } = payload;
  //     const query = queries.query;
  //     const size = queries.size ?? 10;
  //     const from = queries.from ?? 0;
  //     let esQuery;
  //     if ( query ) {
  //       esQuery = {
  //         multi_match: {
  //           query,
  //           fields: [ '*' ],
  //           fuzziness: 'AUTO',
  //         },
  //       };
  //     } else {
  //       esQuery = { match_all: {} };
  //     }

  //     const result = this.esService.search( index, esQuery, { size, from } );
  //     return result

  //   } catch ( error ) {
  //     return throwCatch( error );
  //   }
  // }

  @MessagePattern( KAFKA_TOPICS.ELASTICSEARCH_ADVANCED_SEARCH )
  async advancedSearch( @Payload() payload: any ) {
    const { query, page, limit, ...options } = payload.searchParams;

    return this.esService.search( payload.index, query, {
      page,
      limit,
      ...options
    } );
  }

  @MessagePattern( KAFKA_TOPICS.AUTH_HEALTH )
  async checkHealth() {
    return this.esService.checkHealth();
  }

}
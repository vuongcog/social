import { ElasticSearchDataKafkaService } from './kafka/data/elasticsearch.data-kafka.service';
import { HttpStatus } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { userMapping } from './mappings/user.maping';
import { ConfigService } from '@nestjs/config';
import { Record } from '@prisma/client/runtime/library';
import { throwCatch } from '@app/common/utils/throw-catch';
import type { BaseResponse } from '@app/common';
import type { SearchPaginationDto } from '@app/common/dto/search.dto';

@Injectable()
export class MyElasticSearchService {

  private readonly logger = new Logger( MyElasticSearchService.name );
  private readonly indices = {
    users: 'users',
  }

  constructor( private readonly esService: ElasticsearchService, private readonly configService: ConfigService,
    private readonly elasticsearchDataKafkaClient: ElasticSearchDataKafkaService,

  ) {

  }

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    try {
      await this.esService.ping();
      this.logger.log( 'Successfully connected to Elasticsearch' );
      const userIndexExits = this.esService.indices.exists( {
        index: this.indices.users
      } )
      if ( !userIndexExits ) {
        await this.createIndex( this.indices.users, userMapping );
        this.logger.log( `Created '${ this.indices.users }' index with mapping` );
      } else {
        this.logger.log( `Index '${ this.indices.users }' already exists` );
      }
      await this.updateMapping( this.indices.users, userMapping )
    }
    catch ( error ) {
      this.logger.error( `Failed to initialize Elasticsearch: ${ error.message }`, error.stack );
    }
  }



  async deleteAllDocsInIndex( indexName: string = "users" ): Promise<BaseResponse> {
    try {
      const response = await this.esService.deleteByQuery( {
        index: indexName,
        body: {
          query: {
            match_all: {}
          }
        },
        refresh: true
      } );

      return {
        status: 'success',
        statusCode: HttpStatus.OK,
        data: response.total
      }
    } catch ( error ) {
      throw throwCatch( error )
    }
  }

  async markExistingRecordsAsIndexed(): Promise<BaseResponse> {

    try {
      const esResponse = await this.esService.search( {
        index: 'users',
        body: {
          query: { match_all: {} },
          _source: false,
          size: 10000
        }
      } );

      const indexedIds = esResponse.hits.hits
        .filter( hit => hit._id !== undefined )
        .map( hit => hit._id! );

      const options = {
        where: {
          id: { in: indexedIds },
        },
        data: {
          isIndexed: true,
          indexedAt: new Date(),
        },
      }
      const result = await this.elasticsearchDataKafkaClient.updateUnIndexedEntities( options );
      return result;
    } catch ( error ) {
      throw throwCatch( error )
    }
  }


  async indexRecordsAndMarkAsIndexed(): Promise<BaseResponse> {
    try {
      const unindexedRecords = await this.elasticsearchDataKafkaClient.getUnindexedRecords();
      if ( unindexedRecords.data.length === 0 ) {

        return {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: 'All data has been indexed previously',
        }
      }
      const body = unindexedRecords.data.flatMap( record => [
        { index: { _index: 'your-index', _id: record.id.toString() } },
        {
          ...record,
          isIndexed: undefined,
          indexedAt: undefined
        }
      ] );

      const esResponse = await this.esService.bulk( { body } );

      if ( esResponse.errors ) {
        const erroredDocuments = esResponse.items.filter( item => item.index?.error );
        console.error( 'Elasticsearch errors:', erroredDocuments );
        return {
          status: 'error',
          statusCode: HttpStatus.OK,
          error: {
            messages: erroredDocuments.map( doc => {
              const error = doc.index?.error;
              return error
                ? `${ error.type }: ${ error.reason }`
                : 'Unknown error';
            } ),
          }
        };
      }

      const recordIds = unindexedRecords.data.map( record => record.id );
      const options = {
        where: {
          id: { in: recordIds }
        },
        data: {
          isIndexed: true,
          indexedAt: new Date()
        }
      }
      const result = await this.elasticsearchDataKafkaClient.updateUnIndexedEntities( options )
      return {
        status: 'success',
        statusCode: HttpStatus.CREATED,
        message: `Successfully indexed and marked ${ unindexedRecords.data.length } records`,
        data: result.data,
      }

    } catch ( error ) {
      throw throwCatch( error )
    }
  }


  async updateMapping( index: string, mapping: Record<string, any> ) {
    try {
      await this.esService.indices.putMapping( {
        index,
        body: mapping.mappings,
      } )

      return { acknowacknowledgedled: true };

    } catch ( error ) {
      this.logger.error( `Failed to update mapping for index '${ index }': ${ error.message }` );
      return { acknowledged: false, error: error.message };
    }
  }



  async indexDocument( index: string, id: string | undefined, body: Record<string, any> ): Promise<BaseResponse> {
    try {
      if ( !index ) {
        throw {
          status: "error",
          statusCode: HttpStatus.BAD_REQUEST,
          error: {
            message: "Index is Empty",
          }
        } as BaseResponse
      }

      if ( !id ) {
        throw {
          status: "error",
          statusCode: HttpStatus.BAD_REQUEST,
          error: {
            message: "Id is Empty",
          }
        } as BaseResponse
      }

      const result = await this.esService.index( {
        index,
        id,
        body,
        refresh: 'wait_for',

      } );


      if ( result.result === "updated" ) {
        return {
          status: 'updated',
          statusCode: HttpStatus.OK,
          message: 'Updated document successfully',
          messages: [ 'Updated document successfully' ],

          data: result,
        }

      }
      else if ( result.result === "noop" ) {
        return {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: 'Value is noop',
          data: result,

        }
      }

      return {
        status: 'success',
        statusCode: HttpStatus.CREATED,
        message: 'Created document successfully',
        messages: [ 'Index document successfully' ],

        data: result,
      }

    } catch ( error ) {
      throw throwCatch( error )
    }
  }

  async bulkIndex( operations: any[] ) {
    try {
      return await this.esService.bulk( { refresh: 'wait_for', body: operations } )
    } catch ( error ) {
      this.logger.error( `Failed to perform bulk indexing: ${ error.message }` );
      throw error;
    }
  }

  async search(
    index: string,
    query: any,
    options: SearchPaginationDto = {
      query: undefined
    }
  ): Promise<BaseResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        sort,
        _source,
        highlight
      } = options;

      const currentPage = Math.max( 1, page );
      const itemsPerPage = Math.min( Math.max( 1, limit ), 100 );
      const from = ( currentPage - 1 ) * itemsPerPage;

      const searchParams: any = {
        index,
        body: {
          query,
          size: itemsPerPage,
          from: from,
          track_total_hits: true
        }
      };

      if ( sort ) searchParams.body.sort = sort;
      if ( _source ) searchParams.body._source = _source;
      if ( highlight ) searchParams.body.highlight = highlight;

      const searchResult = await this.esService.search( searchParams );

      const totalItems = typeof searchResult.hits.total === 'object'
        ? searchResult.hits.total.value
        : searchResult.hits.total;

      const totalPages = Math.ceil( totalItems! / itemsPerPage );
      const hasNextPage = currentPage < totalPages;
      const hasPreviousPage = currentPage > 1;
      const to = Math.min( from + itemsPerPage, totalItems! );

      return {
        status: "success",
        statusCode: HttpStatus.OK,
        message: "Search completed successfully",
        data: {
          items: searchResult.hits.hits,
          pagination: {
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            hasNextPage,
            hasPreviousPage,
            from: from + 1,
            to
          },
          took: searchResult.took
        }
      };

    } catch ( error ) {
      throw throwCatch( error );
    }
  }





  async deleteDocument( index: string, id: string ) {
    try {
      return await this.esService.delete( {
        index,
        id,
        refresh: 'wait_for',
      } );
    } catch ( error ) {
      this.logger.error( `Failed to delete document from '${ index }': ${ error.message }` );
      throw error;
    }
  }



  async deleteIndex( index: string ) {
    try {
      const exists = await this.esService.indices.exists( { index } );

      if ( !exists ) {
        return { acknowledged: false, message: `Index "${ index }" does not exist.` };
      }

      return await this.esService.indices.delete( { index } );
    } catch ( error ) {
      this.logger.error( `Failed to delete index '${ index }': ${ error.message }` );
      throw error;
    }
  }

  async createIndex( index: string, body: Record<string, any> = {} ) {
    try {
      const exists = await this.esService.indices.exists( { index } );

      if ( exists ) {
        return { acknowledged: false, message: `Index "${ index }" already exists.` };
      }

      return await this.esService.indices.create( {
        index,
        body,
      } );
    } catch ( error ) {
      this.logger.error( `Failed to create index '${ index }': ${ error.message }` );
      throw error;
    }
  }

  async checkHealth() {
    try {
      const health = await this.esService.cluster.health();
      return health;
    } catch ( error ) {
      this.logger.error( `Failed to check cluster health: ${ error.message }` );
      throw error;
    }
  }

  async syncFromDatabase( data: any, index: string ) {
    try {
      if ( !data || data.lenth === 0 ) {
        return { acknowledged: true, message: 'No data to sync' };
      }

      const operations = data.flatMap( doc => [
        { index: { _index: index, _id: doc.id } },
        doc
      ] );

      return await this.bulkIndex( operations );

    } catch ( error ) {
      this.logger.error( `Failed to sync data to '${ index }': ${ error.message }` );
      throw error;
    }
  }

}

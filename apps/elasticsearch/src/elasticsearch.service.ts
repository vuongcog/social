import { ElasticSearchDataKafkaService } from './kafka/data/elasticsearch.data-kafka.service';
import { HttpStatus } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { userMapping } from './mappings/user.maping';
import { ConfigService } from '@nestjs/config';
import { Record } from '@prisma/client/runtime/library';
import { throwCatch } from '@app/common/utils/throw-catch';
import type { BaseResponse, SuggestionOptions, SuggestionResult } from '@app/common';
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


  async updateRecordsAndMarkAsIndexed(): Promise<BaseResponse> {
    try {

      const unindexedRecords = await this.elasticsearchDataKafkaClient.getIndexedRecords();
      if ( unindexedRecords.data.length === 0 ) {

        return {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: 'All data has been indexed previously',
        }
      }
      const body = unindexedRecords.data.flatMap( record => [
        { index: { _index: 'users', _id: record.id.toString() } },
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

  async getAutocompleteSuggestions(
    query: string,
    options: SuggestionOptions = { field: 'all', size: 10 }
  ): Promise<BaseResponse> {
    try {
      const { field, size = 10, fuzzy = false } = options;

      const suggestions: any = {};

      if ( field === 'name' || field === 'all' ) {
        suggestions.name_suggest = {
          prefix: query,
          completion: {
            field: 'name_suggest',
            size: size,
            ...( fuzzy && {
              fuzzy: {
                fuzziness: 'AUTO',
                min_length: 3
              }
            } )
          }
        };
      }

      if ( field === 'email' || field === 'all' ) {
        suggestions.email_suggest = {
          prefix: query,  // Đặt text ở đây
          completion: {
            field: 'email_suggest',
            size: size,
            ...( fuzzy && {
              fuzzy: {
                fuzziness: 'AUTO',
                min_length: 3
              }
            } )
          }
        };
      }

      const response = await this.esService.search( {
        index: this.indices.users,
        body: {
          suggest: suggestions
        }
      } );
      const results: SuggestionResult[] = [];
      if ( response?.suggest?.name_suggest ) {
        const options = response.suggest.name_suggest[ 0 ].options;
        if ( Array.isArray( options ) ) {
          options.forEach( ( option: any ) => {
            results.push( {
              text: option.text,
              score: option._score,
              source: option._source,
              type: 'name'
            } );
          } );
        }
      }

      if ( response?.suggest?.email_suggest ) {
        const options = response.suggest.email_suggest[ 0 ].options;
        if ( Array.isArray( options ) ) {
          options.forEach( ( option: any ) => {
            results.push( {
              text: option.text,
              score: option._score,
              source: option._source,
              type: 'email'
            } );
          } );
        }
      }
      results.sort( ( a, b ) => b.score - a.score );
      return {
        status: 'success',
        statusCode: HttpStatus.OK,
        message: 'Suggestions retrieved successfully',
        data: {
          suggestions: results.slice( 0, size ),
          total: results.length,
          query: query
        }
      };
    } catch ( error ) {
      throw throwCatch( error );
    }
  }
  async getSpellingSuggestions( query: string, field: 'name' | 'email' = 'name' ): Promise<BaseResponse> {
    try {
      const response = await this.esService.search( {
        index: this.indices.users,
        body: {
          suggest: {
            text: query,
            spell_suggest: {
              term: {
                field: field,
                size: 5,
                suggest_mode: 'always',
                min_word_length: 2,
                min_doc_freq: 1,
              }
            }
          }
        }
      } );

      const suggestions = response?.suggest?.spell_suggest.map( ( suggestion: any ) => ( {
        original: suggestion.text,
        suggestions: suggestion.options.map( ( opt: any ) => ( {
          text: opt.text,
          score: opt.score,
          frequency: opt.freq
        } ) )
      } ) );

      return {
        status: 'success',
        statusCode: HttpStatus.OK,
        message: 'Spelling suggestions retrieved successfully',
        data: {
          suggestions,
          query: query,
          field: field
        }
      };

    } catch ( error ) {
      throw throwCatch( error );
    }
  }

  async getPhraseSuggestions( query: string, field: 'name' | 'email' = 'name' ): Promise<BaseResponse> {
    try {
      const response = await this.esService.search( {
        index: this.indices.users,
        body: {
          suggest: {
            text: query,
            phrase_suggest: {
              phrase: {
                field: field,
                size: 100,
                gram_size: 2,
                direct_generator: [ {
                  field: field,
                  suggest_mode: 'popular',
                  min_word_length: 2,
                  min_doc_freq: 1
                } ],
                highlight: {
                  pre_tag: '<em>',
                  post_tag: '</em>'
                }
              }
            }
          }
        }
      } );

      const options = response?.suggest?.phrase_suggest[ 0 ].options
      let suggestions
      if ( Array.isArray( options ) ) {
        suggestions = options.map( ( option: any ) => ( {
          text: option.text,
          score: option.score,
          highlighted: option.highlighted || option.text
        } ) );
      }

      return {
        status: 'success',
        statusCode: HttpStatus.OK,
        message: 'Phrase suggestions retrieved successfully',
        data: {
          suggestions,
          query: query,
          field: field
        }
      };

    } catch ( error ) {
      throw throwCatch( error );
    }
  }

  async searchWithSuggestions(
    index: string,
    query: any,
    suggestQuery?: string,
    options: SearchPaginationDto = { query: undefined }
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

      if ( suggestQuery ) {
        searchParams.body.suggest = {
          name_suggest: {
            prefix: suggestQuery,
            completion: {
              field: 'name_suggest',
              size: 5
            }
          },
          email_suggest: {
            prefix: suggestQuery,
            completion: {
              field: 'email_suggest',
              size: 5
            }
          }
        };
      }

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

      let suggestions

      if ( searchResult.suggest ) {
        suggestions = {
          names: searchResult.suggest.name_suggest?.[ 0 ]?.options || [],
          emails: searchResult.suggest.email_suggest?.[ 0 ]?.options || []
        };
      }

      return {
        status: "success",
        statusCode: HttpStatus.OK,
        message: "Search with suggestions completed successfully",
        data: {
          items: searchResult.hits.hits,
          suggestions,
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

  async indexRecordsAndMarkAsIndexed( limit: number ): Promise<BaseResponse> {
    try {

      const records = await this.elasticsearchDataKafkaClient.getUsers( limit );

      if ( records.data.length === 0 ) {
        return {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: 'All data has been indexed previously',
        }
      }


      const existingDocs: any[] = [];
      const newDocs: any[] = [];

      const batchSize = 100;
      for ( let i = 0; i < records.data.length; i += batchSize ) {
        const batch = records.data.slice( i, i + batchSize );

        const mgetResponse = await this.esService.mget( {
          index: 'users',
          body: {
            ids: batch.map( record => record.id.toString() )
          }
        } );

        mgetResponse.docs.forEach( ( doc: any, index: number ) => {
          const record = batch[ index ];
          if ( doc.found === true ) {
            existingDocs.push( record );
          } else {
            newDocs.push( record );
          }
        } );
      }


      const body: any[] = [];

      newDocs.forEach( ( record: any ) => {
        body.push(
          { create: { _index: 'users', _id: record.id.toString() } },
          this.enhanceDocumentForSuggestion( record )
        );
      } );

      existingDocs.forEach( ( record: any ) => {
        body.push(
          { index: { _index: 'users', _id: record.id.toString() } },
          this.enhanceDocumentForSuggestion( record )
        );
      } );

      if ( body.length === 0 ) {
        return {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: 'No documents to process',
        }
      }

      const esResponse = await this.esService.bulk( {
        body,
        refresh: 'wait_for'
      } );

      if ( esResponse.errors ) {
        const erroredDocuments = esResponse.items.filter( ( item: any ) =>
          item.create?.error || item.index?.error
        );


        return {
          status: 'error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: {
            messages: erroredDocuments.map( ( doc: any ) => {
              const error = doc.create?.error || doc.index?.error;
              return error
                ? `${ error.type }: ${ error.reason }`
                : 'Unknown error';
            } ),
          }
        };
      }

      const successfulOperations = esResponse.items.filter( ( item: any ) => {
        const status = item.create?.status || item.index?.status;
        return status >= 200 && status < 300;
      } );

      const createdCount = esResponse.items.filter( ( item: any ) =>
        item.create && item.create.result === 'created'
      ).length;

      const updatedCount = esResponse.items.filter( ( item: any ) =>
        item.index && item.index.result === 'updated'
      ).length;

      const recordIds = records.data.map( record => record.id );
      const options = {
        where: {
          id: { in: recordIds }
        },
        data: {
          isIndexed: true,
          indexedAt: new Date()
        }
      }

      const result = await this.elasticsearchDataKafkaClient.updateUnIndexedEntities( options );

      return {
        status: 'success',
        statusCode: HttpStatus.CREATED,
        message: `Successfully processed ${ records.data.length } records (Created: ${ createdCount }, Updated: ${ updatedCount })`,
        data: {
          ...result.data,
          statistics: {
            total: records.data.length,
            created: createdCount,
            updated: updatedCount,
            failed: esResponse.items.length - successfulOperations.length
          }
        },
      }

    } catch ( error ) {
      throw throwCatch( error )
    }
  }

  async updateDocumentsAndMarkAsIndexed(): Promise<BaseResponse> {
    try {
      const unindexedRecords = await this.elasticsearchDataKafkaClient.getIndexedRecords();
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
      const exists = await this.esService.indices.exists( { index } );

      if ( !exists ) {
        await this.createIndex( index, mapping );
        return { acknowledged: true, created: true };
      }

      await this.esService.indices.putMapping( {
        index,
        body: mapping.mappings,
      } );

      return { acknowledged: true, updated: true };

    } catch ( error ) {
      this.logger.error( `Failed to update mapping for index '${ index }': ${ error.message }` );

      if ( error.message.includes( 'mapper_parsing_exception' ) ||
        error.message.includes( 'illegal_argument_exception' ) ) {
        this.logger.warn( 'Mapping conflict detected, requires reindex' );
        return { acknowledged: false, error: error.message, requiresReindex: true };
      }

      return { acknowledged: false, error: error.message };
    }
  }

  async fixMappingAndReindex(): Promise<BaseResponse> {
    try {
      this.logger.log( 'Starting mapping fix and reindex process...' );
      try {
        await this.esService.indices.delete( {
          index: this.indices.users
        } );
        this.logger.log( 'Deleted existing index' );
      } catch ( error ) {
        this.logger.log( 'Index does not exist, proceeding...' );
      }

      await this.createIndex( this.indices.users, userMapping );
      this.logger.log( 'Created index with new mapping' );

      const allUsers = await this.elasticsearchDataKafkaClient.getUsers( 3000 );

      if ( allUsers.data.length > 0 ) {
        const body = allUsers.data.flatMap( record => [
          { index: { _index: this.indices.users, _id: record.id.toString() } },
          this.enhanceDocumentForSuggestion( record )
        ] );

        const response = await this.esService.bulk( {
          body,
          refresh: 'wait_for'
        } );

        if ( response.errors ) {
          this.logger.error( 'Bulk index errors:', response.errors );
          return {
            status: 'error',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: { message: 'Bulk indexing failed' }
          };
        }

        await this.elasticsearchDataKafkaClient.updateUnIndexedEntities( {
          where: { id: { in: allUsers.data.map( u => u.id ) } },
          data: { isIndexed: true, indexedAt: new Date() }
        } );

        this.logger.log( `Successfully reindexed ${ allUsers.data.length } documents` );
      }

      return {
        status: 'success',
        statusCode: HttpStatus.OK,
        message: 'Mapping fixed and data reindexed successfully',
        data: { reindexedCount: allUsers.data.length }
      };

    } catch ( error ) {
      this.logger.error( 'Fix mapping failed:', error );
      throw throwCatch( error );
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

      const enhancedBody = {
        ...body,
        ...( body.name && {
          name_suggest: {
            input: [ body.name ],
            weight: 10
          }
        } ),
        ...( body.email && {
          email_suggest: {
            input: [ body.email, body.email.split( '@' )[ 0 ] ],
            weight: 5
          }
        } )
      };


      const result = await this.esService.index( {
        index,
        id,
        body: enhancedBody,
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


  enhanceDocumentForSuggestion( record: any ) {
    const nameSuggestions = new Set<string>();

    if ( record.name ) {
      const parts = record.name.split( ' ' ).filter( p => p.trim().length > 0 );

      parts.forEach( part => nameSuggestions.add( part.trim() ) );

      for ( let i = 0; i < parts.length; i++ ) {
        for ( let j = i + 1; j <= parts.length; j++ ) {
          const phrase = parts.slice( i, j ).join( ' ' ).trim();
          nameSuggestions.add( phrase );
        }
      }
    }

    return {
      ...record,
      isIndexed: undefined,
      indexedAt: undefined,
      ...( record.name && {
        name_suggest: {
          input: Array.from( nameSuggestions ),
          weight: 10,
        },
      } ),
      ...( record.email && {
        email_suggest: {
          input: [ record.email, record.email.split( '@' )[ 0 ] ],
          weight: 5,
        },
      } ),
    };
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

import { BaseResponse } from './../../../libs/common/src/interfaces/response.interface';
import { PrismaService } from '@app/database';
import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import _ from 'lodash';
import { ElasticSearchDataKafkaService } from './kafka/data/elasticsearch.data-kafka.service';
import { throwCatch } from '@app/common/utils/throw-catch';

export interface FieldAnalysisResult {
  indexedFields: string[];
  unindexedFields: string[];
  disabledFields: string[];
  fieldLimitInfo: {
    current: number;
    limit: number;
    nearLimit: boolean;
  };
}

@Injectable()
export class ElasticsearchFieldAnalyzerService {
  private readonly logger = new Logger( ElasticsearchFieldAnalyzerService.name );

  constructor( private readonly elasticsearchService: ElasticsearchService, private readonly prismaClient: PrismaService,
    private readonly elasticsearchDataKafkaClient: ElasticSearchDataKafkaService,
  ) { }

  async deleteAllDocsInIndex( indexName: string = "users" ): Promise<BaseResponse> {
    try {
      const response = await this.elasticsearchService.deleteByQuery( {
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
      const esResponse = await this.elasticsearchService.search( {
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

      const esResponse = await this.elasticsearchService.bulk( { body } );

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


  /**
   * Analyze tất cả fields trong index để tìm unindexed fields
   */
  async analyzeIndexFields( indexName: string ): Promise<FieldAnalysisResult> {
    try {
      // 1. Lấy mapping
      const mapping = await this.getIndexMapping( indexName );

      // 2. Lấy field capabilities
      const fieldCaps = await this.getFieldCapabilities( indexName );

      // 3. Lấy index settings
      const settings = await this.getIndexSettings( indexName );

      // 4. Phân tích
      const result = this.analyzeFields( mapping, fieldCaps, settings );

      this.logger.log( `Field analysis completed for index: ${ indexName }` );
      return result;

    } catch ( error ) {
      this.logger.error( `Error analyzing fields for index ${ indexName }:`, error );
      throw error;
    }
  }

  /**
   * Lấy mapping của index
   */
  private async getIndexMapping( indexName: string ) {
    const response = await this.elasticsearchService.indices.getMapping( {
      index: indexName
    } );
    return response[ indexName ]?.mappings || {};
  }

  /**
   * Lấy field capabilities - fields nào có thể search/aggregate
   */
  private async getFieldCapabilities( indexName: string ) {
    const response = await this.elasticsearchService.fieldCaps( {
      index: indexName,
      fields: '*',
      ignore_unavailable: true
    } );
    return response.fields || {};
  }

  /**
   * Lấy index settings
   */
  private async getIndexSettings( indexName: string ) {
    const response = await this.elasticsearchService.indices.getSettings( {
      index: indexName
    } );
    return response[ indexName ]?.settings || {};
  }

  /**
   * Phân tích mapping để tìm unindexed fields
   */
  private analyzeFields( mapping: any, fieldCaps: any, settings: any ): FieldAnalysisResult {
    const indexedFields: string[] = [];
    const unindexedFields: string[] = [];
    const disabledFields: string[] = [];

    // Traverse mapping để tìm fields
    this.traverseMapping( mapping.properties || {}, '', indexedFields, unindexedFields, disabledFields );

    // Lấy field limit info
    const fieldLimitInfo = this.getFieldLimitInfo( settings, indexedFields.length );

    return {
      indexedFields,
      unindexedFields,
      disabledFields,
      fieldLimitInfo
    };
  }

  /**
   * Recursive traverse mapping
   */
  private traverseMapping(
    properties: any,
    parentPath: string,
    indexedFields: string[],
    unindexedFields: string[],
    disabledFields: string[]
  ) {
    Object.entries( properties ).forEach( ( [ fieldName, fieldConfig ]: [ string, any ] ) => {
      const fullPath = parentPath ? `${ parentPath }.${ fieldName }` : fieldName;

      if ( typeof fieldConfig === 'object' && fieldConfig !== null ) {
        // Check if field is disabled
        if ( fieldConfig.enabled === false ) {
          disabledFields.push( fullPath );
          return;
        }

        // Check if field is not indexed
        if ( fieldConfig.index === false ) {
          unindexedFields.push( fullPath );
          return;
        }

        // Field is indexed
        if ( fieldConfig.type ) {
          indexedFields.push( fullPath );
        }

        // Recursive check for nested properties
        if ( fieldConfig.properties ) {
          this.traverseMapping(
            fieldConfig.properties,
            fullPath,
            indexedFields,
            unindexedFields,
            disabledFields
          );
        }
      }
    } );
  }

  /**
   * Lấy thông tin field limit
   */
  private getFieldLimitInfo( settings: any, currentFieldCount: number ) {
    const defaultLimit = 1000;
    const limit = settings.index?.mapping?.total_fields?.limit || defaultLimit;
    const nearLimit = currentFieldCount > ( limit * 0.8 ); // 80% threshold

    return {
      current: currentFieldCount,
      limit,
      nearLimit
    };
  }

  /**
   * Sampling approach - lấy sample data để so sánh với mapping
   */
  async analyzeBySampling( indexName: string, sampleSize: number = 1000 ): Promise<string[]> {
    try {
      // Random sampling
      const sampleQuery = {
        size: sampleSize,
        query: {
          function_score: {
            query: { match_all: {} },
            random_score: {}
          }
        }
      };

      const response = await this.elasticsearchService.search( {
        index: indexName,
        body: sampleQuery
      } );

      // Collect tất cả field names từ sample
      const sampleFields = new Set<string>();

      response.hits.hits.forEach( ( hit: any ) => {
        const flatFields = this.flattenObject( hit._source );
        Object.keys( flatFields ).forEach( field => sampleFields.add( field ) );
      } );

      // Lấy indexed fields từ mapping
      const analysis = await this.analyzeIndexFields( indexName );
      const indexedFieldsSet = new Set( analysis.indexedFields );

      // Tìm fields có trong data nhưng không có trong mapping
      const potentiallyUnindexed = Array.from( sampleFields )
        .filter( field => !indexedFieldsSet.has( field ) );

      return potentiallyUnindexed;

    } catch ( error ) {
      this.logger.error( `Error in sampling analysis for ${ indexName }:`, error );
      throw error;
    }
  }

  /**
   * Flatten nested object để get tất cả field paths
   */
  private flattenObject( obj: any, prefix: string = '' ): { [ key: string ]: any } {
    const flattened: { [ key: string ]: any } = {};

    Object.keys( obj ).forEach( key => {
      const value = obj[ key ];
      const newKey = prefix ? `${ prefix }.${ key }` : key;

      if ( value !== null && typeof value === 'object' && !Array.isArray( value ) ) {
        Object.assign( flattened, this.flattenObject( value, newKey ) );
      } else {
        flattened[ newKey ] = value;
      }
    } );

    return flattened;
  }

  /**
   * Test xem field có thể search được không
   */
  async testFieldSearchability( indexName: string, fieldName: string ): Promise<boolean> {
    try {
      const response = await this.elasticsearchService.search( {
        index: indexName,
        body: {
          size: 0,
          query: {
            exists: { field: fieldName }
          }
        }
      } );


      const total = _.get( response, 'hits.total.value', 0 );
      if ( !total ) {
        return true
      }
      return total > 0;


    } catch ( error ) {
      // Nếu có error thì field không thể search
      this.logger.warn( `Field ${ fieldName } is not searchable:`, error.message );
      return false;
    }
  }

  /**
   * Batch test multiple fields
   */
  async batchTestFieldSearchability( indexName: string, fieldNames: string[] ): Promise<{ [ field: string ]: boolean }> {
    const results: { [ field: string ]: boolean } = {};

    // Test parallel nhưng có limit để không overwhelm ES
    const batchSize = 10;
    for ( let i = 0; i < fieldNames.length; i += batchSize ) {
      const batch = fieldNames.slice( i, i + batchSize );

      const batchPromises = batch.map( async ( field ) => {
        const isSearchable = await this.testFieldSearchability( indexName, field );
        return { field, isSearchable };
      } );

      const batchResults = await Promise.all( batchPromises );
      batchResults.forEach( ( { field, isSearchable } ) => {
        results[ field ] = isSearchable;
      } );

      // Small delay để không overwhelm ES
      await new Promise( resolve => setTimeout( resolve, 100 ) );
    }

    return results;
  }




}
import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { userMapping } from './mappings/user.maping';
import type { ConfigService } from '@nestjs/config';
import type { Record } from '@prisma/client/runtime/library';

@Injectable()
export class MyElasticSearchService {
  private readonly logger = new Logger( MyElasticSearchService.name );
  private readonly indices = {
    users: 'users',
  }

  constructor( private readonly esService: ElasticsearchService, private readonly configService: ConfigService ) {

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



  async indexDocument( index: string, id: string | undefined, body: Record<string, any> ) {
    try {
      return this.esService.index( {
        index,
        id,
        body,
        refresh: 'wait_for',

      } );
    } catch ( error ) {
      this.logger.error( `Failed to index document in '${ index }': ${ error.message }` );
      throw error;

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

  async search( index: string, query: any, options: any ) {

    try {
      const { size = 10, from = 0, sort, _source, highlight } = options;
      const searchParams: any = {
        index, body: {
          query,
          size,
          from
        }
      }
      if ( sort ) searchParams.body.sort = sort;
      if ( _source ) searchParams.body._source = _source;
      if ( _source ) searchParams.body._source = _source;

      return await this.esService.search( searchParams );

    } catch ( error ) {
      this.logger.error( `Failed to search in '${ index }': ${ error.message }` );
      throw error;

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
        body, // Mappings, settings, etc.
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

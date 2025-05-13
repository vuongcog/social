import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { MyElasticSearchService } from './myelasticsearch.service';

@Controller( 'elasticsearch' )
export class ElasticsearchController {
  constructor( private readonly esService: MyElasticSearchService ) { }

  @Post( 'indices/:index' )
  async createIndex( @Param( 'index' ) index: string, @Body() body: Record<string, any> = {} ) {
    return this.esService.createIndex( index, body );
  }

  @Delete( 'indices/:index' )
  async deleteIndex( @Param( 'index' ) index: string ) {
    return this.esService.deleteIndex( index );
  }

  @Post( 'document/:index' )
  async indexDocument(
    @Param( 'index' ) index: string,
    @Body() document: Record<string, any>,
  ) {
    const { id, ...body } = document;
    return this.esService.indexDocument( index, id, body );
  }

  @Delete( 'document/:index/:id' )
  async deleteDocument( @Param( 'index' ) index: string, @Param( 'id' ) id: string ) {
    return this.esService.deleteDocument( index, id );
  }

  @Get( 'search/:index' )
  async search(
    @Param( 'index' ) index: string,
    @Query( 'q' ) query: string,
    @Query( 'size' ) size: number = 10,
    @Query( 'from' ) from: number = 0,
  ) {
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

  @Post( 'search/:index' )
  async advancedSearch(
    @Param( 'index' ) index: string,
    @Body() searchParams: any,
  ) {
    const { query, ...options } = searchParams;
    return this.esService.search( index, query, options );
  }

  @Get( 'health' )
  async checkHealth() {
    return this.esService.checkHealth();
  }
}
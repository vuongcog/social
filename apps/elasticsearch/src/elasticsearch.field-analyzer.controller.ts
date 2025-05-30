import { Controller, Get, Post, Query, Param, Body, Res, HttpStatus, Delete } from '@nestjs/common';
import { ElasticsearchFieldAnalyzerService, type FieldAnalysisResult } from './elasticsearch.field-analyzer.service';
import { throwCatchHtpp } from '@app/common/utils/http-throw-catch';
import { responseData } from '@app/common/utils/response';
import { MyElasticSearchService } from './elasticsearch.service';
import type { BaseResponse } from '@app/common';

export interface FieldAnalysisRequest {
    indexName: string;
    sampleSize?: number;
    testSearchability?: boolean;
}

export interface BulkAnalysisRequest {
    indices: string[];
    sampleSize?: number;
}

@Controller( 'search' )
export class ElasticsearchAnalyzerController {
    constructor(
        private readonly fieldAnalyzerService: ElasticsearchFieldAnalyzerService,
        private readonly elasticsearchService: MyElasticSearchService
    ) { }

    @Delete( 'delete-index' )
    async deleteIndex() {
        await this.elasticsearchService.deleteIndex( "users" );
    }

    @Get( 'autocomplete' )
    async getAutocompleteSuggestions(
        @Res() res,
        @Query( 'q' ) query: string,
        @Query( 'field' ) field: 'name' | 'email' | 'all' = 'all',
        @Query( 'size' ) size: number = 10,
        @Query( 'fuzzy' ) fuzzy: boolean = false
    ) {
        try {
            if ( !query || query.trim().length === 0 ) {
                return {
                    status: 'error',
                    statusCode: HttpStatus.BAD_REQUEST,
                    error: {
                        message: 'Query parameter is required'
                    }
                };
            }
            const result = await this.elasticsearchService.getAutocompleteSuggestions(
                query.trim(),
                { field, size: Math.min( size, 50 ), fuzzy }
            );
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error )
        }
    }

    @Get( 'spelling' )
    async getSpellingSuggestions(
        @Query( 'q' ) query: string,
        @Query( 'field' ) field: 'name' | 'email' = 'name'
    ): Promise<BaseResponse> {
        if ( !query || query.trim().length === 0 ) {
            return {
                status: 'error',
                statusCode: HttpStatus.BAD_REQUEST,
                error: {
                    message: 'Query parameter is required'
                }
            };
        }

        return await this.elasticsearchService.getSpellingSuggestions(
            query.trim(),
            field
        );
    }

    @Get( 'phrase' )
    async getPhraseSuggestions(
        @Query( 'q' ) query: string,
        @Query( 'field' ) field: 'name' | 'email' = 'name'
    ): Promise<BaseResponse> {
        if ( !query || query.trim().length === 0 ) {
            return {
                status: 'error',
                statusCode: HttpStatus.BAD_REQUEST,
                error: {
                    message: 'Query parameter is required'
                }
            };
        }

        return await this.elasticsearchService.getPhraseSuggestions(
            query.trim(),
            field
        );
    }

    @Get( 'search' )
    async searchWithSuggestions(
        @Query( 'q' ) searchQuery: string,
        @Query( 'suggest' ) suggestQuery?: string,
        @Query( 'page' ) page: number = 1,
        @Query( 'limit' ) limit: number = 10,
        @Query( 'sort' ) sort?: string
    ): Promise<BaseResponse> {
        if ( !searchQuery || searchQuery.trim().length === 0 ) {
            return {
                status: 'error',
                statusCode: HttpStatus.BAD_REQUEST,
                error: {
                    message: 'Search query parameter is required'
                }
            };
        }
        const query = {
            bool: {
                should: [
                    {
                        multi_match: {
                            query: searchQuery,
                            fields: [ 'name^2', 'email' ],
                            type: 'best_fields',
                            fuzziness: 'AUTO'
                        }
                    },
                    {
                        prefix: {
                            'name.keyword': searchQuery
                        }
                    },
                    {
                        prefix: {
                            'email.keyword': searchQuery
                        }
                    }
                ],
                minimum_should_match: 1
            }
        };

        const options = {
            query: query,
            page,
            limit: Math.min( limit, 100 ),
            ...( sort && { sort: [ { [ sort ]: { order: 'asc' } } ] } )
        };

        return await this.elasticsearchService.searchWithSuggestions(
            'users',
            query,
            suggestQuery?.trim(),
            options
        );
    }

    @Get( 'contextual' )
    async getContextualSuggestions(
        @Query( 'q' ) query: string,
        @Query( 'active' ) isActive?: boolean,
        @Query( 'provider' ) provider?: string,
        @Query( 'size' ) size: number = 10
    ): Promise<BaseResponse> {
        if ( !query || query.trim().length === 0 ) {
            return {
                status: 'error',
                statusCode: HttpStatus.BAD_REQUEST,
                error: {
                    message: 'Query parameter is required'
                }
            };
        }

        try {
            const filters: any[] = [];

            if ( isActive !== undefined ) {
                filters.push( { term: { isActive } } );
            }

            if ( provider ) {
                filters.push( { term: { provider } } );
            }

            const contextQuery = filters.length > 0 ? {
                bool: {
                    filter: filters
                }
            } : { match_all: {} };

            const response = await this.elasticsearchService[ 'esService' ].search( {
                index: 'users',
                body: {
                    query: contextQuery,
                    suggest: {
                        name_suggest: {
                            prefix: query.trim(),
                            completion: {
                                field: 'name_suggest',
                                size: Math.min( size, 50 )
                            }
                        },
                        email_suggest: {
                            prefix: query.trim(),
                            completion: {
                                field: 'email_suggest',
                                size: Math.min( size, 50 )
                            }
                        }
                    },
                    size: 0
                }
            } );
            type Suggestion = {
                text: string;
                score: number;
                source: any;
                type: 'name' | string;
            };

            const suggestions: Suggestion[] = []; if ( response.suggest?.name_suggest ) {
                if ( Array.isArray( response.suggest.name_suggest[ 0 ].options ) ) {
                    response.suggest.name_suggest[ 0 ].options.forEach( ( option: any ) => {
                        suggestions.push( {
                            text: option.text,
                            score: option._score,
                            source: option._source,
                            type: 'name'
                        } );
                    } );
                }

            }

            if ( response.suggest?.email_suggest ) {
                if ( Array.isArray( response.suggest.email_suggest[ 0 ].options ) ) {
                    response.suggest.email_suggest[ 0 ].options.forEach( ( option: any ) => {
                        suggestions.push( {
                            text: option.text,
                            score: option._score,
                            source: option._source,
                            type: 'email'
                        } );
                    } );
                }

            }

            suggestions.sort( ( a, b ) => b.score - a.score );

            return {
                status: 'success',
                statusCode: HttpStatus.OK,
                message: 'Contextual suggestions retrieved successfully',
                data: {
                    suggestions: suggestions.slice( 0, size ),
                    total: suggestions.length,
                    query: query.trim(),
                    context: {
                        isActive,
                        provider
                    }
                }
            };

        } catch ( error ) {
            return {
                status: 'error',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: {
                    message: error.message || 'An error occurred while retrieving suggestions'
                }
            };
        }
    }

    @Get( 'analyze/:indexName' )
    async analyzeIndex(
        @Param( 'indexName' ) indexName: string,
        @Query( 'sampleSize' ) sampleSize?: number,
        @Query( 'testSearchability' ) testSearchability?: boolean
    ): Promise<FieldAnalysisResult & { potentiallyUnindexed?: string[], searchabilityTest?: any }> {
        const result = await this.fieldAnalyzerService.analyzeIndexFields( indexName );

        if ( sampleSize ) {
            const potentiallyUnindexed = await this.fieldAnalyzerService.analyzeBySampling(
                indexName,
                Number( sampleSize )
            );
            ( result as any ).potentiallyUnindexed = potentiallyUnindexed;
        }

        if ( testSearchability && result.unindexedFields.length > 0 ) {
            const searchabilityTest = await this.fieldAnalyzerService.batchTestFieldSearchability(
                indexName,
                result.unindexedFields
            );
            ( result as any ).searchabilityTest = searchabilityTest;
        }

        return result;
    }

    @Post( 'analyze/bulk' )
    async bulkAnalyze( @Body() request: BulkAnalysisRequest ) {
        const results: { [ indexName: string ]: FieldAnalysisResult } = {};

        for ( const indexName of request.indices ) {
            try {
                results[ indexName ] = await this.fieldAnalyzerService.analyzeIndexFields( indexName );

                if ( request.sampleSize ) {
                    const potentiallyUnindexed = await this.fieldAnalyzerService.analyzeBySampling(
                        indexName,
                        request.sampleSize
                    );
                    ( results[ indexName ] as any ).potentiallyUnindexed = potentiallyUnindexed;
                }
            } catch ( error ) {
                results[ indexName ] = {
                    error: error.message
                } as any;
            }
        }

        return results;
    }

    @Post( 'test-searchability' )
    async testSearchability(
        @Body() request: { indexName: string; fields: string[] }
    ) {
        return await this.fieldAnalyzerService.batchTestFieldSearchability(
            request.indexName,
            request.fields
        );
    }

    /**
     */
    @Get( 'summary' )
    async getIndexSummary( @Query( 'pattern' ) pattern: string = '*' ) {
        return { message: 'Summary endpoint - implement based on your needs' };
    }
}
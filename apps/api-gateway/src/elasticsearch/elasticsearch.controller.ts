import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query, Res } from "@nestjs/common";
import { ElasticSearchKafkaService } from "../kafka/elasticsearch/gateway.elasticsearch-kafka.service";
import { responseData } from "@app/common/utils/response";
import { throwCatchHtpp } from "@app/common/utils/http-throw-catch";
import type { BaseResponse } from "@app/common";
import { Public } from "../auth/public.decorator";
import type { SearchPaginationDto } from "@app/common/dto/search.dto";
import { createSortObject } from "@app/common/utils/sort";

@Controller( 'search' )
export class ElasticsearchController {
    constructor( private readonly elasticsearchKafkaClient: ElasticSearchKafkaService ) { }

    @Public()
    @Get( "mark-indexed" )
    async test( @Res() res ) {
        try {
            const result = await this.elasticsearchKafkaClient.markExistingRecordsAsIndexed();
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error )

        }
    }

    @Public()
    @Get( "delete-all-documents" )
    async delete( @Res() res ) {
        try {
            const result = await this.elasticsearchKafkaClient.deleteAllDocsInIndex();
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error )
        }
    }
    @Public()
    @Get( "index-records" )
    async indexRecordsAndMarkAsIndexed( @Res() res ) {
        try {
            const result = await this.elasticsearchKafkaClient.indexRecordsAndMarkAsIndexed();
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error )

        }
    }

    @Public()
    @Get( "update-indexed-docs" )
    async updateDocsAndMarkAsIndexed( @Res() res ) {
        try {
            const result = await this.elasticsearchKafkaClient.updateDocumentsAndMarkAsIndexed();
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error )

        }
    }

    @Public()
    @Get( "search/:index" )
    async searchWithQuery(
        @Param( 'index' ) index: string,
        @Res() res,
        @Query( 'q' ) q: string,
        @Query( 'page' ) page: number = 1,
        @Query( 'limit' ) limit: number = 10,
        @Query( 'sort' ) sort?: string,
    ) {
        try {
            const query = {
                multi_match: {
                    query: q,
                    fields: [ "*" ]
                }
            };

            const searchParams: SearchPaginationDto = {
                query,
                page: Number( page ),
                limit: Number( limit ),
            };

            if ( sort ) {
                searchParams.sort = createSortObject( sort );
            }

            const payload = { index, searchParams };
            const result = await this.elasticsearchKafkaClient.advancedSearch( payload );

            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error );
        }
    }
    @Public()
    @Post( "search-advance/:index" )
    async advancedSearch(
        @Param( 'index' ) index: string,
        @Body() searchParams: SearchPaginationDto,
        @Res() res,
    ) {
        try {

            if ( !index || index.trim() === '' ) {
                return responseData( res, {
                    status: "error",
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: "Index parameter is required",
                    data: null
                } );
            }

            if ( !searchParams.query ) {
                return responseData( res, {
                    status: "error",
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: "Query is required in request body",
                    data: null
                } );
            }

            const normalizedSearchParams = {
                query: searchParams.query,
                page: Math.max( 1, searchParams.page || 1 ),
                limit: Math.min( Math.max( 1, searchParams.limit || 10 ), 100 ),
                sort: searchParams.sort || undefined,
                _source: searchParams._source || undefined,
                highlight: searchParams.highlight || undefined
            };

            const payload = {
                index: index.trim(),
                searchParams: normalizedSearchParams,
            };

            const result = await this.elasticsearchKafkaClient.advancedSearch( payload );
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error );
        }
    }

}
import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query, Res } from "@nestjs/common";
import { ElasticSearchKafkaService } from "../kafka/elasticsearch/gateway.elasticsearch-kafka.service";
import { responseData } from "@app/common/utils/response";
import { throwCatchHtpp } from "@app/common/utils/http-throw-catch";
import type { BaseResponse } from "@app/common";
import { Public } from "../auth/public.decorator";
import type { SearchPaginationDto } from "@app/common/dto/search.dto";

@Controller( 'search' )
export class ElasticsearchController {
    constructor( private readonly elasticsearchKafkaClient: ElasticSearchKafkaService ) { }

    @Get( "mark-indexed" )
    async test( @Res() res ) {
        try {
            const result = await this.elasticsearchKafkaClient.markExistingRecordsAsIndexed();
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error )

        }
    }

    @Get( "delete-all-documents" )
    async delete( @Res() res ) {
        try {
            const result = await this.elasticsearchKafkaClient.deleteAllDocsInIndex();
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error )
        }
    }

    @Get( "index-records" )
    async test1( @Res() res ) {
        try {
            const result = await this.elasticsearchKafkaClient.indexRecordsAndMarkAsIndexed();
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
                const [ field, order ] = sort.split( ':' );
                searchParams.sort = [ { [ field ]: { order: order || 'asc' } } ];
            }

            const payload = { index, searchParams };
            const result = await this.elasticsearchKafkaClient.advancedSearch( payload );

            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error );
        }
    }

    @Post( "search-advance/:index" )
    async advancedSearch(
        @Param( 'index' ) index: string,
        @Body() searchParams: SearchPaginationDto,
        @Res() res,
    ) {
        try {
            const payload = {
                index,
                searchParams,
            };

            const result = await this.elasticsearchKafkaClient.advancedSearch( payload );
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error );
        }
    }

}
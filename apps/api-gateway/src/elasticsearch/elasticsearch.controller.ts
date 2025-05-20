import { Body, Controller, Get, HttpException, HttpStatus, Param, Query } from "@nestjs/common";
import { KafkaService } from "../kafka/kafka.service";

@Controller( 'search' )
export class ElasticsearchController {
    constructor( private readonly kafkaClient: KafkaService ) { }

    @Get( 'search/:index' )
    async search(
        @Param( 'index' ) index: string,
        @Query( 'q' ) query: string,
        @Query( 'size' ) size: number = 10,
        @Query( 'from' ) from: number = 0,
    ) {
        try {
            const payload = {
                index,
                queries: {
                    query,
                    size,
                    from,
                }
            }
            const result = await this.kafkaClient.search( payload );
            if ( !result ) {
                throw new HttpException( 'User not found', HttpStatus.NOT_FOUND );
            }
            return result;
        } catch ( error ) {
            throw new HttpException(
                error.message || 'Failed to fetch user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
    @Get( "search/:index" )
    async advancedSearch(
        @Param( 'index' ) index: string,
        @Body() searchParams: any,

    ) {
        try {

            const payload = {
                index,
                searchParams,
            }
            const result = await this.kafkaClient.advancedSearch( payload )
            if ( !result ) {
                throw new HttpException( 'User not found', HttpStatus.NOT_FOUND );
            }
            return result;
        } catch ( error ) {
            throw new HttpException(
                error.message || 'Failed to fetch user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }


    }

}
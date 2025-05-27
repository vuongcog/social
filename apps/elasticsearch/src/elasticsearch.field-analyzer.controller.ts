import { Controller, Get, Post, Query, Param, Body, Res } from '@nestjs/common';
import { ElasticsearchFieldAnalyzerService, type FieldAnalysisResult } from './elasticsearch.field-analyzer.service';
import { throwCatchHtpp } from '@app/common/utils/http-throw-catch';
import { responseData } from '@app/common/utils/response';

export interface FieldAnalysisRequest {
    indexName: string;
    sampleSize?: number;
    testSearchability?: boolean;
}

export interface BulkAnalysisRequest {
    indices: string[];
    sampleSize?: number;
}

@Controller( 'elasticsearch/analyzer' )
export class ElasticsearchAnalyzerController {
    constructor(
        private readonly fieldAnalyzerService: ElasticsearchFieldAnalyzerService
    ) { }

    @Get( "test" )
    async test( @Res() res ) {
        try {
            const result = await this.fieldAnalyzerService.markExistingRecordsAsIndexed();
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error )

        }
    }

    @Get( "delete" )
    async delete( @Res() res ) {
        try {
            const result = await this.fieldAnalyzerService.deleteAllDocsInIndex();
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error )
        }
    }

    @Get( "test1" )
    async test1( @Res() res ) {
        try {
            const result = await this.fieldAnalyzerService.indexRecordsAndMarkAsIndexed();
            return responseData( res, result );
        } catch ( error ) {
            throw throwCatchHtpp( error )

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

        // Optional: test searchability
        if ( testSearchability && result.unindexedFields.length > 0 ) {
            const searchabilityTest = await this.fieldAnalyzerService.batchTestFieldSearchability(
                indexName,
                result.unindexedFields
            );
            ( result as any ).searchabilityTest = searchabilityTest;
        }

        return result;
    }

    /**
     * Bulk analyze multiple indices
     */
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

    /**
     * Test field searchability
     */
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
     * Get summary của tất cả indices
     */
    @Get( 'summary' )
    async getIndexSummary( @Query( 'pattern' ) pattern: string = '*' ) {
        // This would require additional method in service to list indices
        // và analyze each one
        return { message: 'Summary endpoint - implement based on your needs' };
    }
}
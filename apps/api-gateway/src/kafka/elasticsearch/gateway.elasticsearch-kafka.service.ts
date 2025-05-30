import { CONSTANTS, type BaseResponse } from '@app/common';
import { CircuitBreakerService } from '@app/common/circuit-breaker/circuit-breaker.service';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom, timeout, catchError, type async } from 'rxjs';
import { throwCatch } from '@app/common/utils/throw-catch';
import type { UpdateDto } from '@app/common/dto/user.dto';
import type { LoginDto } from '@app/common/dto/auth.dto';
import { throwCatchGateWay } from '@app/common/utils/throw-catch-gateway';
import { handlerResponseBreaker } from '@app/common/utils/handle-response-breaker';
@Injectable()
export class ElasticSearchKafkaService implements OnModuleInit {
    private elasticServiceBreaker: any;


    constructor(
        @Inject( CONSTANTS.SERVICES.elasticsearch_service )
        private readonly elasticsearchClient: ClientKafka,

        private circuitBreakerService: CircuitBreakerService,
    ) {
        this.elasticServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.SERVER_NAME.ELASTICSEARCH_SERVER,
            this.callElasticSearchService.bind( this ),
        );
    }

    async onModuleInit() {
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_MARK_EXISTING_RECORD_AS_INDEXED )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_INDEX_RECORDS_AND_MARK_AS_INDEXED )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_UPDATE_DOCUMENTS_AND_MARK_AS_INDEXED )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_DELETE_ALL_DOCUMENT )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_DELETE_INDEX )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_INDEX_DOCUMENT )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_DELETE_DOCUMENT )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELSATICSEARCH_SEARCH )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_ADVANCED_SEARCH )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_HEALTH )

        await Promise.all( [
            this.elasticsearchClient.connect(),
        ] );
    }


    private async callElasticSearchService( data: { topic: string; payload: any } ) {
        return lastValueFrom(
            this.elasticsearchClient.send( data.topic, data.payload ).pipe(
                timeout( CONSTANTS.TIME_OUT.request ),
                catchError( err => {
                    console.error( `Error calling ElasticSearch Service (${ data.topic }):`, err );
                    throw err;
                } )
            )
        );
    }

    async deleteAllDocsInIndex(): Promise<BaseResponse> {
        try {
            const result = await this.elasticServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_DELETE_ALL_DOCUMENT,
                payload: {},
            } )
            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.API_GATEWAY_ELASTICSEARCH_CLIENT_ID, CONSTANTS.SERVER_NAME.ELASTICSEARCH_SERVER );

        }
    }

    async markExistingRecordsAsIndexed(): Promise<BaseResponse> {
        try {
            const result = await this.elasticServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_MARK_EXISTING_RECORD_AS_INDEXED,
                payload: {},
            } )
            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.API_GATEWAY_ELASTICSEARCH_CLIENT_ID, CONSTANTS.SERVER_NAME.ELASTICSEARCH_SERVER );

        }
    }
    async indexRecordsAndMarkAsIndexed( payload: number ): Promise<BaseResponse> {
        try {
            const result = await this.elasticServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_INDEX_RECORDS_AND_MARK_AS_INDEXED,
                payload: payload,
            } )
            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.API_GATEWAY_ELASTICSEARCH_CLIENT_ID, CONSTANTS.SERVER_NAME.ELASTICSEARCH_SERVER );

        }
    }

    async updateDocumentsAndMarkAsIndexed(): Promise<BaseResponse> {
        try {
            const result = await this.elasticServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_UPDATE_DOCUMENTS_AND_MARK_AS_INDEXED,
                payload: {},
            } )
            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.API_GATEWAY_ELASTICSEARCH_CLIENT_ID, CONSTANTS.SERVER_NAME.ELASTICSEARCH_SERVER );

        }
    }

    async search( payload: any ): Promise<BaseResponse> {
        try {
            const result = await this.elasticServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELSATICSEARCH_SEARCH,
                payload: payload,
            } )
            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.API_GATEWAY_ELASTICSEARCH_CLIENT_ID, CONSTANTS.SERVER_NAME.ELASTICSEARCH_SERVER );

        }
    }
    async advancedSearch( payload: any ): Promise<BaseResponse> {
        try {
            const result = await this.elasticServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_ADVANCED_SEARCH,
                payload: payload,
            } )
            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.API_GATEWAY_ELASTICSEARCH_CLIENT_ID, CONSTANTS.SERVER_NAME.ELASTICSEARCH_SERVER );

        }
    }

    async checkHealth() {
        try {
            return await this.elasticServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_HEALTH,
                payload: "",
            } )
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'ElasticSearch service is currently unavailable' );
        }
    }

}
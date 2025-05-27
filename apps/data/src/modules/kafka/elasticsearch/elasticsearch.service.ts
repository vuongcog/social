import { CONSTANTS, type BaseResponse } from "@app/common";
import type { CircuitBreakerService } from "@app/common/circuit-breaker/circuit-breaker.service";
import { KAFKA_TOPICS } from "@app/common/constants/kafka-topics";
import { handlerResponseBreaker } from "@app/common/utils/handle-response-breaker";
import { throwCatchGateWay } from '@app/common/utils/throw-catch-gateway';
import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { catchError, lastValueFrom, timeout } from "rxjs";

@Injectable()
export class ElasticSearchKafkaService implements OnModuleInit {

    private elasticsearchServiceBreaker: any;

    constructor(
        @Inject( CONSTANTS.SERVICES[ "data-elasticsearch-service" ] )
        private readonly elasticsearchClient: ClientKafka,

        private circuitBreakerService: CircuitBreakerService,

    ) {
        this.elasticsearchServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.CLIENT_ID.USER_CLIENT_ID,
            this.callElasticsearchService.bind( this ),
        );
    }

    async onModuleInit() {

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

    private async callElasticsearchService( data: { topic: string; payload: any } ) {
        return lastValueFrom(
            this.elasticsearchClient.send( data.topic, data.payload ).pipe(
                timeout( CONSTANTS.TIME_OUT.request ),
                catchError( err => {
                    console.error( `Error calling User Service (${ data.topic }):`, err );
                    throw err;
                } )
            )
        );
    }


    async createIndex(): Promise<BaseResponse> {
        try {
            const result = await this.elasticsearchServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_CREATE_INDEX,
                payload: "",
            } )

            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.GROUP_ID.DATA_ELASTICSEARCH_GROUP_ID, CONSTANTS.GROUP_ID.ELASTICSEARCH_GROUP_ID );

        }
    }
    async deleteIndex(): Promise<BaseResponse> {
        try {
            const result = await this.elasticsearchServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_DELETE_INDEX,
                payload: "",
            } )
            return handlerResponseBreaker( result )
        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.GROUP_ID.DATA_ELASTICSEARCH_GROUP_ID, CONSTANTS.GROUP_ID.ELASTICSEARCH_GROUP_ID );

        }
    }

    async search( payload: any ): Promise<BaseResponse> {
        try {
            const result = await this.elasticsearchServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELSATICSEARCH_SEARCH,
                payload: payload,
            } )
            return handlerResponseBreaker( result )

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.GROUP_ID.DATA_ELASTICSEARCH_GROUP_ID, CONSTANTS.GROUP_ID.ELASTICSEARCH_GROUP_ID );

        }
    }
    async advancedSearch( payload: any ): Promise<BaseResponse> {
        try {
            const result = await this.elasticsearchServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_ADVANCED_SEARCH,
                payload: payload,
            } )
            return handlerResponseBreaker( result )

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.GROUP_ID.DATA_ELASTICSEARCH_GROUP_ID, CONSTANTS.GROUP_ID.ELASTICSEARCH_GROUP_ID );

        }
    }

    async checkHealth() {
        try {
            return await this.elasticsearchServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_HEALTH,
                payload: "",
            } )
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'ElasticSearch service is currently unavailable' );
        }
    }





}
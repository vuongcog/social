import { CONSTANTS, type BaseResponse } from "@app/common";
import { CircuitBreakerService } from "@app/common/circuit-breaker/circuit-breaker.service";
import { KAFKA_TOPICS } from "@app/common/constants/kafka-topics";
import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { catchError, lastValueFrom, timeout } from "rxjs";
import { handlerResponseBreaker } from '@app/common/utils/handle-response-breaker';
import { throwCatchGateWay } from '@app/common/utils/throw-catch-gateway';
import type { UpdateDto } from "@app/common/dto/user.dto";

@Injectable()
export class ElasticSearchDataKafkaService implements OnModuleInit {

    private elasticSearchDataSreviceBreaker: any

    constructor(
        @Inject( CONSTANTS.SERVICES[ "elasticsearch-data-service" ] )
        private readonly elasticesarchDataClient: ClientKafka,

        private readonly circuitBreakerService: CircuitBreakerService ) {

        this.elasticSearchDataSreviceBreaker = this.circuitBreakerService.create(
            CONSTANTS.CLIENT_ID.USER_ELASTICSEARCH_CLIENT_ID,
            this.callElasticSearchService.bind( this ),
        );
    }

    onModuleInit() {
        this.elasticesarchDataClient.subscribeToResponseOf( CONSTANTS.KAFKA_TOPICS.DATA_GET_UNINDEX_RECORD )
        this.elasticesarchDataClient.subscribeToResponseOf( CONSTANTS.KAFKA_TOPICS.DATA_GET_UNINDEX_COUNT )
        this.elasticesarchDataClient.subscribeToResponseOf( CONSTANTS.KAFKA_TOPICS.DATA_UPDATE_FOR_UNINDEXED_ENTITIES )
        this.elasticesarchDataClient.subscribeToResponseOf( CONSTANTS.KAFKA_TOPICS.DATA_UPDATE_USER )
    }

    private async callElasticSearchService( data: { topic: string; payload: any } ) {
        return lastValueFrom(
            this.elasticesarchDataClient.send( data.topic, data.payload ).pipe(
                timeout( CONSTANTS.TIME_OUT.request ),
                catchError( err => {
                    console.error( `Error calling User Service (${ data.topic }):`, err );
                    throw err;
                } )
            )
        );
    }

    async getUnindexedRecords(): Promise<BaseResponse> {
        try {
            const result = await this.elasticSearchDataSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.DATA_GET_UNINDEX_RECORD,
                payload: {}

            } );
            return handlerResponseBreaker( result )

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.ELASTICSEARCH_DATA_CLIENT_ID, CONSTANTS.SERVER_ID.DATA_SERVER_ID )

        }
    }

    async updateUser( id: string, userData: UpdateDto ) {
        try {
            const result = await this.elasticSearchDataSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.DATA_UPDATE_USER,
                payload: {
                    id, userData
                },
            } );
            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.USER_DATA_CLIENT_ID, CONSTANTS.SERVER_ID.DATA_SERVER_ID );

        }

    }

    async countUnindexedRecords( userId: string ) {
        try {
            const result = await this.elasticSearchDataSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.DATA_GET_UNINDEX_COUNT,
            } );
            return handlerResponseBreaker( result )

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.ELASTICSEARCH_DATA_CLIENT_ID, CONSTANTS.SERVER_ID.DATA_SERVER_ID )

        }
    }

    async updateUnIndexedEntities( options: any ): Promise<BaseResponse> {
        try {
            const result = await this.elasticSearchDataSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.DATA_UPDATE_FOR_UNINDEXED_ENTITIES,
                payload: options,
            } );
            return handlerResponseBreaker( result )

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.ELASTICSEARCH_DATA_CLIENT_ID, CONSTANTS.SERVER_ID.DATA_SERVER_ID )

        }
    }
}
import { BaseResponse } from './../../../../../libs/common/src/interfaces/response.interface';
import { console } from 'node:inspector/promises';
import { CONSTANTS } from "@app/common";
import { CircuitBreakerService } from "@app/common/circuit-breaker/circuit-breaker.service";
import { KAFKA_TOPICS } from "@app/common/constants/kafka-topics";
import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { catchError, lastValueFrom, timeout } from "rxjs";
import { handlerResponseBreaker } from '@app/common/utils/handle-response-breaker';
import { throwCatchGateWay } from '@app/common/utils/throw-catch-gateway';

@Injectable()
export class UserElasticSearchKafkaService implements OnModuleInit {

    private userElasticSearchSreviceBreaker: any

    constructor( @Inject( CONSTANTS.SERVICES[ "user.elasticsearch-service" ] )
    private readonly userElasticesarchClient: ClientKafka,
        private readonly circuitBreakerService: CircuitBreakerService ) {

        this.userElasticSearchSreviceBreaker = this.circuitBreakerService.create(
            CONSTANTS.CLIENT_ID.USER_ELASTICSEARCH_CLIENT_ID,
            this.callElasticSearchService.bind( this ),
        );
    }

    onModuleInit() {
        this.userElasticesarchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_CREATE_INDEX )
        this.userElasticesarchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_DELETE_INDEX )
        this.userElasticesarchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_INDEX_DOCUMENT )
        this.userElasticesarchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_DELETE_DOCUMENT )
    }

    private async callElasticSearchService( data: { topic: string; payload: any } ) {
        return lastValueFrom(
            this.userElasticesarchClient.send( data.topic, data.payload ).pipe(
                timeout( CONSTANTS.TIME_OUT.request ),
                catchError( err => {
                    console.error( `Error calling User Service (${ data.topic }):`, err );
                    throw err;
                } )
            )
        );
    }

    async emitUserCreated( user: any ): Promise<BaseResponse> {
        try {
            const result = await this.userElasticSearchSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_INDEX_DOCUMENT,
                payload: {
                    index: 'users',
                    document: user
                },
            } );
            return handlerResponseBreaker( result )
        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.USER_ELASTICSEARCH_CLIENT_ID, CONSTANTS.SERVER_ID.ELASTICSEARCH_SERVER_ID )
        }
    }
    async emitUserUpdated( user: any ) {
        try {
            const result = await this.userElasticSearchSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_INDEX_DOCUMENT,
                payload: {
                    index: 'users',
                    ...user
                },
            } );
            return handlerResponseBreaker( result )

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.USER_ELASTICSEARCH_CLIENT_ID, CONSTANTS.SERVER_ID.ELASTICSEARCH_SERVER_ID )

        }

    }
    async emitUserDeleted( userId: string ) {
        try {
            const result = await this.userElasticSearchSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_DELETE_DOCUMENT,
                payload: {
                    index: 'users',
                    id: userId,
                },
            } );
            return handlerResponseBreaker( result )

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.USER_ELASTICSEARCH_CLIENT_ID, CONSTANTS.SERVER_ID.ELASTICSEARCH_SERVER_ID )

        }
    }
    // async syncAllUsers() {
    //     try {
    //         const users = await this.prismaService.user.findMany();
    //         await this.esService.syncFromDatabase( users, 'users' );
    //         this.logger.log( `Synced ${ users.length } users to Elasticsearch` );
    //         return { success: true, count: users.length };
    //     } catch ( error ) {
    //         this.logger.error( `Failed to sync users: ${ error.message }`, error.stack );
    //         throw error;
    //     }
    // }

}
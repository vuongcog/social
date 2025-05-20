import { console } from 'node:inspector/promises';
import { CONSTANTS } from "@app/common";
import { CircuitBreakerService } from "@app/common/circuit-breaker/circuit-breaker.service";
import { KAFKA_TOPICS } from "@app/common/constants/kafka-topics";
import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { catchError, lastValueFrom, timeout, type async } from "rxjs";

@Injectable()
export class KafkaService implements OnModuleInit {

    private userElasticSearchSreviceBreaker: any

    constructor( @Inject( CONSTANTS.SERVICES[ "user-elasticsearch-service" ] )
    private readonly userElasticesarchClient: ClientKafka,
        private readonly circuitBreakerService: CircuitBreakerService ) {

        this.userElasticSearchSreviceBreaker = this.circuitBreakerService.create(
            CONSTANTS.CLIENT_ID.USER_ELASTICSEARCH_CLIENT_ID,
            this.callElasticSearchService.bind( this ),
            { timeout: 5000 }
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
                timeout( 3000 ),
                catchError( err => {
                    console.error( `Error calling User Service (${ data.topic }):`, err );
                    throw err;
                } )
            )
        );
    }
    async emitUserCreated( user: any ) {
        try {
            const result = await this.userElasticSearchSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_INDEX_DOCUMENT,
                payload: {
                    index: 'users',
                    document: user
                },
            } );
            return result;
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            console.error( "ElasticSearch service is currently unavailable" )
            return false
        }
    }
    async emitUserUpdated( user: any ) {
        try {
            return await this.userElasticSearchSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_INDEX_DOCUMENT,
                payload: {
                    index: 'users',
                    ...user
                },
            } );
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'Elasticsearch service is currently unavailable' );
        }

    }
    async emitUserDeleted( userId: string ) {
        try {
            return await this.userElasticSearchSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_DELETE_DOCUMENT,
                payload: {
                    index: 'users',
                    id: userId,
                },
            } );
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'Elasticsearch service is currently unavailable' );
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
import { console } from 'node:inspector/promises';
import { BaseResponse } from './../../../../libs/common/src/interfaces/response.interface';
import { CONSTANTS } from '@app/common';
import { CircuitBreakerService } from '@app/common/circuit-breaker/circuit-breaker.service';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom, timeout, catchError, type async } from 'rxjs';
import { throwCatch } from '@app/common/utils/throw-catch';
@Injectable()
export class KafkaService implements OnModuleInit {
    private authServiceBreaker: any;
    private userServiceBreaker: any;
    private elasticServiceBreaker: any;


    constructor(
        @Inject( CONSTANTS.SERVICES[ 'auth-service' ] )
        private readonly authClient: ClientKafka,

        @Inject( CONSTANTS.SERVICES[ 'user-service' ] )
        private readonly userClient: ClientKafka,

        @Inject( CONSTANTS.SERVICES.elasticsearch_service )
        private readonly elasticsearchClient: ClientKafka,

        private circuitBreakerService: CircuitBreakerService,
    ) {
        this.authServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.CLIENT_ID.AUTH_CLIENT_ID,
            this.callAuthService.bind( this ),
            { timeout: 5000 }
        );

        this.userServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.CLIENT_ID.USER_CLIENT_ID,
            this.callUserService.bind( this ),
            { timeout: 5000 }
        );

        this.elasticServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.CLIENT_ID.ELASTICSEARCH_CLIENT_ID,
            this.callElasticSearchService.bind( this ),
            { timeout: 5000 }
        );
    }

    async onModuleInit() {
        // Auth Service
        this.authClient.subscribeToResponseOf( KAFKA_TOPICS.AUTH_REGISTER );
        this.authClient.subscribeToResponseOf( KAFKA_TOPICS.AUTH_LOGIN );
        this.authClient.subscribeToResponseOf( KAFKA_TOPICS.AUTH_VALIDATE );
        this.authClient.subscribeToResponseOf( KAFKA_TOPICS.AUTH_GOOGLE_LOGIN );
        this.authClient.subscribeToResponseOf( KAFKA_TOPICS.AUTH_VALIDATE_GOOLE );
        this.authClient.subscribeToResponseOf( KAFKA_TOPICS.AUTH_VALIDATE_USER );


        // User Service
        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_GET );
        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_UPDATED );
        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_DELETED );

        //ElasticSerach Service
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_DELETE_INDEX )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_INDEX_DOCUMENT )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_DELETE_DOCUMENT )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELSATICSEARCH_SEARCH )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_ADVANCED_SEARCH )
        this.elasticsearchClient.subscribeToResponseOf( KAFKA_TOPICS.ELASTICSEARCH_HEALTH )

        await Promise.all( [
            this.authClient.connect(),
            this.userClient.connect(),
            this.elasticsearchClient.connect(),
        ] );
    }

    private async callAuthService( data: { topic: string; payload: any } ) {
        return lastValueFrom(
            this.authClient.send( data.topic, data.payload ).pipe(
                timeout( 3000 ),
                catchError( err => {
                    console.error( `Error calling Auth Service (${ data.topic }):`, err );
                    throw err;
                } )
            )
        );
    }

    private async callUserService( data: { topic: string; payload: any } ) {
        return lastValueFrom(
            this.userClient.send( data.topic, data.payload ).pipe(
                timeout( 3000 ),
                catchError( err => {
                    console.error( `Error calling User Service (${ data.topic }):`, err );
                    throw err;
                } )
            )
        );
    }

    private async callElasticSearchService( data: { topic: string; payload: any } ) {
        return lastValueFrom(
            this.elasticsearchClient.send( data.topic, data.payload ).pipe(
                timeout( 3000 ),
                catchError( err => {
                    console.error( `Error calling ElasticSearch Service (${ data.topic }):`, err );
                    throw err;
                } )
            )
        );
    }



    async register( userData: any ): Promise<BaseResponse> {
        try {
            const result: BaseResponse = await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_REGISTER,
                payload: userData,
            } );

            if ( result?.error ) {
                if ( result.error.break ) {
                    throw result
                }
                return Promise.reject( result )
            }
            return result;

        } catch ( error ) {
            throw throwCatch( error );
        }
    }


    async login( credentials: any ) {
        try {
            return await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_LOGIN,
                payload: credentials,
            } );
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'Authentication service is currently unavailable' );
        }
    }

    async googleLogin( userData: any ) {
        try {

            return await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_GOOGLE_LOGIN,
                payload: userData,
            } );

        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'Authentication service is currently unavailable' );
        }
    }

    async validateUser( email, password ) {
        try {
            return await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_VALIDATE_USER,
                payload: {
                    email, password,
                },
            } );

        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'Authentication service is currently unavailable' );
        }
    }

    async validateGoogleUser( userData: any ) {
        try {
            return await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_VALIDATE_GOOLE,
                payload: userData,
            } );

        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'Authentication service is currently unavailable' );
        }
    }


    async validateToken( token: string ) {
        try {
            return await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_VALIDATE,
                payload: { token },
            } );
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'Authentication service is currently unavailable' );
        }
    }

    async getUserById( id: string ) {
        try {
            return await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_GET,
                payload: { id },
            } );
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'User service is currently unavailable' );
        }
    }

    async updateUser( id: string, userData: any ) {
        try {
            return await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_UPDATED,
                payload: { id, userData },
            } );
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'User service is currently unavailable' );
        }
    }

    async deleteUser( id: string ) {
        try {
            return await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_DELETED,
                payload: { id },
            } );
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'User service is currently unavailable' );
        }
    }
    async createIndex() {
        try {
            return await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_CREATE_INDEX,
                payload: "",
            } )
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'ElasticSearch service is currently unavailable' );
        }
    }
    async deleteIndex() {
        try {
            return await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_DELETE_INDEX,
                payload: "",
            } )
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'ElasticSearch service is currently unavailable' );
        }
    }

    async search( payload: any ) {
        try {
            return await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELSATICSEARCH_SEARCH,
                payload: payload,
            } )
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'ElasticSearch service is currently unavailable' );
        }
    }
    async advancedSearch( payload: any ) {
        try {
            return await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_ADVANCED_SEARCH,
                payload: payload,
            } )
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'ElasticSearch service is currently unavailable' );
        }
    }

    async checkHealth() {
        try {
            return await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELASTICSEARCH_HEALTH,
                payload: "",
            } )
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'ElasticSearch service is currently unavailable' );
        }
    }

}
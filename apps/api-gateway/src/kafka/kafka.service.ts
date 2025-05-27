import { BaseResponse } from './../../../../libs/common/src/interfaces/response.interface';
import { CONSTANTS } from '@app/common';
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
            CONSTANTS.SERVER_NAME.AUTH_SERVER,
            this.callAuthService.bind( this ),
        );

        this.userServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.SERVER_NAME.USER_SERVER,
            this.callUserService.bind( this ),
        );

        this.elasticServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.SERVER_NAME.ELASTICSEARCH_SERVER,
            this.callElasticSearchService.bind( this ),
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
                timeout( CONSTANTS.TIME_OUT.request ),
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
                timeout( CONSTANTS.TIME_OUT.request ),
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
                timeout( CONSTANTS.TIME_OUT.request ),
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

            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.API_GATEWAY_AUTH_CLIENT_ID, CONSTANTS.SERVER_NAME.AUTH_SERVER );
        }
    }


    async login( credentials: LoginDto ) {
        try {
            const result: BaseResponse = await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_LOGIN,
                payload: credentials,
            } );

            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.API_GATEWAY_AUTH_CLIENT_ID, CONSTANTS.SERVER_NAME.AUTH_SERVER );
        }
    }

    async googleLogin( userData: any ) {
        try {

            const result = await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_GOOGLE_LOGIN,
                payload: userData,
            } );

            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.API_GATEWAY_AUTH_CLIENT_ID, CONSTANTS.SERVER_NAME.AUTH_SERVER );

        }
    }

    async validateUser( email, password ): Promise<BaseResponse<LoginDto>> {
        try {
            const result: BaseResponse<LoginDto> = await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_VALIDATE_USER,
                payload: {
                    email, password
                },
            } );

            return handlerResponseBreaker( result );


        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.API_GATEWAY_AUTH_CLIENT_ID, CONSTANTS.SERVER_NAME.AUTH_SERVER );
        }
    }

    async validateGoogleUser( userData: any ): Promise<BaseResponse> {
        try {
            const result = await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_VALIDATE_GOOLE,
                payload: userData,
            } );

            return handlerResponseBreaker( result );


        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.API_GATEWAY_AUTH_CLIENT_ID, CONSTANTS.SERVER_NAME.AUTH_SERVER );

        }
    }


    async validateToken( token: string ): Promise<BaseResponse> {
        try {
            const result: BaseResponse = await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_VALIDATE,
                payload: {
                    token
                },
            } );

            return handlerResponseBreaker( result );


        } catch ( error ) {
            throw throwCatch( error );
        }
    }

    async getUserById( id: string ) {
        try {
            const result = await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_GET,
                payload: { id },
            } );

            return handlerResponseBreaker( result );

        } catch ( error ) {

            throw throwCatch( error );

        }
    }



    async updateUser( id: string, userData: UpdateDto ) {
        try {
            const result: BaseResponse = await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_UPDATED,
                payload: {
                    id, userData
                },
            } );

            return handlerResponseBreaker( result );


        } catch ( error ) {
            throw throwCatch( error );
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

    async search( payload: any ): Promise<BaseResponse> {
        try {
            const result = await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.ELSATICSEARCH_SEARCH,
                payload: payload,
            } )
            return result
        } catch ( error ) {

            throw throwCatch( error );

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
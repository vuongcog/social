import { CONSTANTS, type BaseResponse } from "@app/common";
import { CircuitBreakerService } from "@app/common/circuit-breaker/circuit-breaker.service";
import { KAFKA_TOPICS } from "@app/common/constants/kafka-topics";
import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { catchError, lastValueFrom, timeout } from "rxjs";
import type { UpdateDto } from '@app/common/dto/user.dto';
import { handlerResponseBreaker } from '@app/common/utils/handle-response-breaker';
import { throwCatchGateWay } from '@app/common/utils/throw-catch-gateway';
import type { RegisterDto } from '@app/common/dto/auth.dto';

@Injectable()
export class UserDataKafkaService implements OnModuleInit {

    private userDataSreviceBreaker: any

    constructor( @Inject( CONSTANTS.SERVICES[ "user.data-service" ] )
    private readonly userDataClient: ClientKafka,
        private readonly circuitBreakerService: CircuitBreakerService ) {

        this.userDataSreviceBreaker = this.circuitBreakerService.create(
            CONSTANTS.CLIENT_ID.USER_ELASTICSEARCH_CLIENT_ID,
            this.callElasticSearchService.bind( this ),
        );
    }

    onModuleInit() {
        this.userDataClient.subscribeToResponseOf( KAFKA_TOPICS.DATA_CREATE_USER )
        this.userDataClient.subscribeToResponseOf( KAFKA_TOPICS.DATA_UPDATE_USER )
        this.userDataClient.subscribeToResponseOf( KAFKA_TOPICS.DATA_GET_USER )
        this.userDataClient.subscribeToResponseOf( KAFKA_TOPICS.DATA_GET_USER_BY_EMAIL )
        this.userDataClient.subscribeToResponseOf( KAFKA_TOPICS.DATA_GET_USER_BY_ID )
    }

    private async callElasticSearchService( data: { topic: string; payload: any } ) {
        return lastValueFrom(
            this.userDataClient.send( data.topic, data.payload ).pipe(
                timeout( CONSTANTS.TIME_OUT.request ),
                catchError( err => {
                    console.error( `Error calling User Service (${ data.topic }):`, err );
                    throw err;
                } )
            )
        );
    }

    async createUser( payload: RegisterDto ): Promise<BaseResponse> {
        try {
            const result: BaseResponse = await this.userDataSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.DATA_CREATE_USER,
                payload: payload
            } );
            return handlerResponseBreaker( result );
        } catch ( error ) {

            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.USER_DATA_CLIENT_ID, CONSTANTS.SERVER_ID.DATA_SERVER_ID );

        }
    }

    async updateUser( id: string, userData: UpdateDto ) {
        try {
            const result = await this.userDataSreviceBreaker.fire( {
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

    async findUserByEmail( email: string ) {
        try {
            const result = await this.userDataSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.DATA_GET_USER_BY_EMAIL,
                payload: email
            } );
            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.USER_DATA_CLIENT_ID, CONSTANTS.SERVER_ID.DATA_SERVER_ID );

        }
    }
    async findUserById( id: string ) {
        try {
            const result = await this.userDataSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.DATA_GET_USER_BY_ID,
                payload: id
            } );
            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.USER_DATA_CLIENT_ID, CONSTANTS.SERVER_ID.DATA_SERVER_ID );

        }
    }

    async getUser( data: { id?: string; email?: string } ) {
        try {
            const result = await this.userDataSreviceBreaker.fire( {
                topic: KAFKA_TOPICS.DATA_GET_USER,
                payload: data
            } );
            return handlerResponseBreaker( result );

        } catch ( error ) {
            throw throwCatchGateWay( error, CONSTANTS.CLIENT_ID.USER_DATA_CLIENT_ID, CONSTANTS.SERVER_ID.DATA_SERVER_ID );

        }
    }

}
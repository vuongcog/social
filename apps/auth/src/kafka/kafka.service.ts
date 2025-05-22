import { CONSTANTS, type BaseResponse } from '@app/common';
import { CircuitBreakerService } from '@app/common/circuit-breaker/circuit-breaker.service';
import { CLIENT_ID } from '@app/common/constants/client-id';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
import { SERVER_NAME } from '@app/common/constants/server';
import { handlerResponseBreaker } from '@app/common/utils/handle-response-breaker';
import { throwCatch } from '@app/common/utils/throw-catch';
import { throwCatchGateWay } from '@app/common/utils/throw-catch-gateway';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom, timeout, catchError, of } from 'rxjs';

@Injectable()
export class KafkaService implements OnModuleInit {
    private userServiceBreaker: any;

    constructor(
        @Inject( CONSTANTS.SERVICES[ 'user-service' ] )
        private readonly userClient: ClientKafka,

        @Inject( CONSTANTS.SERVICES[ 'health-service' ] )
        private readonly healthClient: ClientKafka,


        private circuitBreakerService: CircuitBreakerService,
    ) {
        this.userServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.CLIENT_ID.USER_CLIENT_ID,
            this.callUserService.bind( this ),
            { timeout: 5000 }
        );
    }

    async onModuleInit() {

        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_GET );
        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_CREATED );
        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_FIND_BY_EMAIL )

        this.healthClient.subscribeToResponseOf( KAFKA_TOPICS.AUTH_HEALTH )

        await Promise.all( [
            this.userClient.connect(),
            this.healthClient.connect(),
        ] );

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

    async findByEmail( data: string ): Promise<BaseResponse> {
        try {
            const result: BaseResponse = await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_FIND_BY_EMAIL,
                payload: data
            } );

            return handlerResponseBreaker( result )

        } catch ( error: BaseResponse | any ) {
            throw throwCatchGateWay( error, CLIENT_ID.AUTH_CLIENT_ID, SERVER_NAME.USER_SERVER );
        }
    }

    async getUserById( id: string ): Promise<BaseResponse> {
        try {
            const result: BaseResponse = await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_GET,
                payload: {
                    id
                },
            } );
            return handlerResponseBreaker( result )

        } catch ( error: BaseResponse | any ) {
            throw throwCatchGateWay( error, CLIENT_ID.AUTH_CLIENT_ID, SERVER_NAME.USER_SERVER );
        }
    }



    async createUser( userData: any ): Promise<BaseResponse> {

        try {
            const result: BaseResponse = await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_CREATED,
                payload: userData
            } );
            return handlerResponseBreaker( result )
        } catch ( error: BaseResponse | any ) {
            throw throwCatchGateWay( error, CLIENT_ID.AUTH_CLIENT_ID, SERVER_NAME.USER_SERVER );


        }

    }

    async ping(): Promise<boolean> {
        try {
            const result = await lastValueFrom(
                this.healthClient.send( CONSTANTS.KAFKA_TOPICS.AUTH_HEALTH, { timestamp: Date.now() } ).pipe(
                    timeout( 1000 ),
                    catchError( err => {
                        console.error( 'Error pinging Kafka:', err );
                        return of( false );
                    } )
                )
            );


            return !!result;
        } catch ( error ) {
            console.error( 'Kafka ping failed:', error );
            return false;
        }
    }
}
// auth-service/src/kafka/kafka.service.ts
import { CONSTANTS, type BaseResponse } from '@app/common';
import { CircuitBreakerService } from '@app/common/circuit-breaker/circuit-breaker.service';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
import { throwCatch } from '@app/common/utils/throw-catch';
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
            const result = await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_FIND_BY_EMAIL,
                payload: data
            } );

            if ( result?.error ) {
                if ( result.error.break ) {
                    throw result
                }
                return Promise.reject( result )
            }

            return result;

        } catch ( error: BaseResponse | any ) {
            throw throwCatch( error );


        }
    }

    async getUserById( id: string ) {
        try {
            return await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_GET,
                payload: {
                    id
                },
            } );
        } catch ( error: BaseResponse | any ) {
            if ( error.status ) {
                throw error as BaseResponse
            }
            else {
                throw {
                    status: 'error',
                    error: {
                        details: error,
                    }
                } as BaseResponse;
            }

        }
    }



    async createUser( userData: any ): Promise<BaseResponse> {

        try {
            return await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_CREATED,
                payload: userData
            } );

        } catch ( error: BaseResponse | any ) {
            if ( error.status ) {
                throw error as BaseResponse
            }
            else {
                throw {
                    status: 'error',
                    error: {
                        details: error,
                    }
                } as BaseResponse;
            }

        }

    }

    async ping(): Promise<boolean> {
        try {
            const result = await lastValueFrom(
                this.healthClient.send( CONSTANTS.KAFKA_TOPICS.AUTH_HEALTH, { timestamp: Date.now() } ).pipe(
                    timeout( 1000 ),
                    catchError( err => {
                        console.error( 'Error pinging Kafka:', err );
                        return of( false ); // ✅ trả về Observable<boolean>
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
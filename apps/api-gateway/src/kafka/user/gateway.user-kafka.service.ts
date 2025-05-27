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
export class UserKafkaService implements OnModuleInit {
    private userServiceBreaker: any;


    constructor(

        @Inject( CONSTANTS.SERVICES[ 'user-service' ] )
        private readonly userClient: ClientKafka,


        private circuitBreakerService: CircuitBreakerService,
    ) {

        this.userServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.SERVER_NAME.USER_SERVER,
            this.callUserService.bind( this ),
        );

    }

    async onModuleInit() {
        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_GET );
        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_UPDATED );

        await Promise.all( [
            this.userClient.connect(),
        ] );
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





    async getUserById( id: string ): Promise<BaseResponse> {
        try {
            const result: BaseResponse = await this.userServiceBreaker.fire( {
                topic: KAFKA_TOPICS.USER_GET,
                payload: { id },
            } );

            return handlerResponseBreaker( result );

        } catch ( error ) {

            throw throwCatch( error );

        }
    }



    async updateUser( id: string, userData: UpdateDto ): Promise<BaseResponse> {
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

}
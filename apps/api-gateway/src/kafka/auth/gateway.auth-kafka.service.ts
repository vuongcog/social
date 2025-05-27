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
export class AuthKafkaService implements OnModuleInit {
    private authServiceBreaker: any;


    constructor(
        @Inject( CONSTANTS.SERVICES[ 'auth-service' ] )
        private readonly authClient: ClientKafka,

        private circuitBreakerService: CircuitBreakerService,
    ) {
        this.authServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.SERVER_NAME.AUTH_SERVER,
            this.callAuthService.bind( this ),
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



        await Promise.all( [
            this.authClient.connect(),
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
}
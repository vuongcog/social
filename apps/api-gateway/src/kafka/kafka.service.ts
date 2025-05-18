// api-gateway/src/kafka/kafka.service.ts
import { CONSTANTS } from '@app/common';
import { CircuitBreakerService } from '@app/common/circuit-breaker/circuit-breaker.service';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom, timeout, catchError } from 'rxjs';
@Injectable()
export class KafkaService implements OnModuleInit {
    private authServiceBreaker: any;
    private userServiceBreaker: any;

    constructor(
        @Inject( CONSTANTS.SERVICES[ 'auth-service' ] )
        private readonly authClient: ClientKafka,

        @Inject( CONSTANTS.SERVICES[ 'user-service' ] )
        private readonly userClient: ClientKafka,
        private circuitBreakerService: CircuitBreakerService,
    ) {
        this.authServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.CLIENT_ID.USER_CLIENT_ID,
            this.callAuthService.bind( this ),
            { timeout: 5000 }
        );

        this.userServiceBreaker = this.circuitBreakerService.create(
            CONSTANTS.CLIENT_ID.USER_CLIENT_ID,
            this.callUserService.bind( this ),
            { timeout: 5000 }
        );
    }

    async onModuleInit() {
        // Auth Service
        this.authClient.subscribeToResponseOf( KAFKA_TOPICS.AUTH_REGISTER );
        this.authClient.subscribeToResponseOf( KAFKA_TOPICS.AUTH_LOGIN );
        this.authClient.subscribeToResponseOf( KAFKA_TOPICS.AUTH_VALIDATE );

        // User Service
        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_GET );
        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_UPDATED );
        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_DELETED );

        await Promise.all( [
            this.authClient.connect(),
            this.userClient.connect(),
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

    async register( userData: any ) {
        try {
            return await this.authServiceBreaker.fire( {
                topic: KAFKA_TOPICS.AUTH_REGISTER,
                payload: userData,
            } );
        } catch ( error ) {
            console.error( 'Circuit is open or error occurred:', error );
            throw new Error( 'Authentication service is currently unavailable' );
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
}
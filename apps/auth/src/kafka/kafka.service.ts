// auth-service/src/kafka/kafka.service.ts
import { CONSTANTS } from '@app/common';
import { CircuitBreakerService } from '@app/common/circuit-breaker/circuit-breaker.service';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
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
            this.getUserData.bind( this ),
            { timeout: 5000 }
        );
    }

    async onModuleInit() {

        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_GET );
        this.userClient.subscribeToResponseOf( KAFKA_TOPICS.USER_CREATED );

        this.healthClient.subscribeToResponseOf( KAFKA_TOPICS.AUTH_HEALTH )

        await Promise.all( [
            this.userClient.connect(),
            this.healthClient.connect(),
        ] );

    }
    private async getUserData( data: { id?: string; email?: string } ) {
        return lastValueFrom(
            this.userClient.send( KAFKA_TOPICS.USER_GET, data ).pipe(
                timeout( 3000 ),
                catchError( err => {
                    console.error( 'Error calling User Service:', err );
                    throw err;
                } )
            )
        );
    }


    async getUserById( id: string ) {
        try {
            return await this.userServiceBreaker.fire( { id } );
        } catch ( error ) {
            console.error( 'Circuit is open, returning fallback data' );
            return null;
        }
    }

    async getUserByEmail( email: string ) {
        try {

            return await this.userServiceBreaker.fire( { email } );

        } catch ( error ) {
            console.error( 'Circuit is open, returning fallback data' );
            return null;
        }
    }

    async createUser( userData: { email: string; name: string; password: string } ) {
        try {
            return await lastValueFrom(
                this.userClient.send( KAFKA_TOPICS.USER_CREATED, userData ).pipe(
                    timeout( 5000 ),
                    catchError( err => {
                        console.error( 'Error creating user:', err );
                        throw err;
                    } )
                )
            );
        } catch ( error ) {
            console.error( 'Failed to create user:', error );
            throw error;
        }
    }

    async ping(): Promise<boolean> {
        try {
            // Trong thực tế có thể dùng một topic riêng cho health check
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
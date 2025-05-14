import {
    Injectable,
    Scope,
    Inject,
} from '@nestjs/common';
import { CircuitBreaker, CircuitBreakerOptions } from 'opossum';

@Injectable( { scope: Scope.TRANSIENT } )
export class CircuitBreakerService {
    private breaker: CircuitBreaker;

    constructor(
        @Inject( 'CIRCUIT_BREAKER_OPTIONS' )
        private options: CircuitBreakerOptions,
    ) { }

    initializeCircuitBreaker( fn: Function ) {
        this.breaker = new CircuitBreaker( fn, this.options );
        return this.breaker;
    }

    async fire( ...args: any[] ): Promise<any> {
        if ( !this.breaker ) {
            throw new Error( 'Circuit breaker chưa được khởi tạo' );
        }
        return this.breaker.fire( ...args );
    }
}

import * as CircuitBreaker from 'opossum';

export class CircuitBreakerService {
    private breakers: Map<string, any> = new Map()

    create( name: string, fn: ( ...args: unknown[] ) => Promise<unknown>, options: CircuitBreaker.Options = {} ) {
        const defaultOptions = {
            timeout: 3000,
            errorThresholdPercentage: 50,
            resetTimeout: 10000,
            ...options,

        }
        const breaker = new CircuitBreaker( fn, defaultOptions );

        breaker.on( 'open', () => console.log( `Circuit ${ name } is OPEN` ) );
        breaker.on( 'close', () => console.log( `Circuit ${ name } is CLOSE` ) );
        breaker.on( 'halfOpen', () => console.log( `Circuit ${ name } is HALF-OPEN` ) );

        this.breakers.set( name, breaker );
        return breaker;

    }
    get( name: string ) {
        return this.breakers.get( name );
    }

}
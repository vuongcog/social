import { Injectable, Inject } from '@nestjs/common';
import { HealthCheckError, HealthIndicatorResult } from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheHealthIndicator {
    constructor( @Inject( CACHE_MANAGER ) private cacheManager: Cache ) { }

    async checkCache(): Promise<HealthIndicatorResult> {
        try {
            // Kiểm tra cache bằng cách thực hiện thao tác set/get
            const testKey = `health_check_${ Date.now() }`;
            await this.cacheManager.set( testKey, 'test', 10 );
            const value = await this.cacheManager.get( testKey );
            const isHealthy = value === 'test';

            if ( !isHealthy ) {
                throw new HealthCheckError(
                    'Cache check failed',
                    { cache: { status: 'down' } }
                );
            }

            return { cache: { status: 'up' } };
        } catch ( error ) {
            return {
                cache: {
                    status: 'down',
                    error: error.message
                }
            };
        }
    }
}

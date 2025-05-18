import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, timeout, catchError } from 'rxjs';

interface ServiceConfig {
    name: string;
    url: string;
}

@Injectable()
export class ServicesHealthIndicator extends HealthIndicator {
    private services: ServiceConfig[];

    constructor(
        private httpService: HttpService,
        private configService: ConfigService
    ) {
        super();
        this.services = [
            {
                name: 'auth-service-liveness',
                url: 'http://localhost:3001/health/liveness',

            },
            {
                name: 'auth-service-readiness',
                url: 'http://localhost:3001/health/readiness',
            }
        ];
    }

    async checkServices(): Promise<HealthIndicatorResult> {
        const results = {};
        let isHealthy = true;

        for ( const service of this.services ) {
            const serviceResult = await this.checkServiceHealth( service );
            const serviceName = Object.keys( serviceResult )[ 0 ];

            results[ serviceName ] = serviceResult[ serviceName ];

            if ( serviceResult[ serviceName ].status === 'down' ) {
                isHealthy = false;
            }
        }
        return this.getStatus( 'services', isHealthy, results );
    }

    async checkService( serviceName: string ): Promise<HealthIndicatorResult> {
        const service = this.services.find( s => s.name === serviceName );
        if ( !service ) {
            return this.getStatus( serviceName, false, {
                reason: 'Service not found'
            } );
        }

        const result = await this.checkServiceHealth( service );
        const status = result[ service.name ].status === 'up';

        return this.getStatus( serviceName, status, result[ service.name ] );
    }

    private async checkServiceHealth( service: ServiceConfig ): Promise<any> {
        try {
            const result = await lastValueFrom(
                this.httpService.get( service.url ).pipe(
                    timeout( 3000 ),
                    catchError( error => {
                        throw new Error( `${ service.name } health check failed: ${ error.message }` );
                    } )
                )
            );

            return {
                [ service.name ]: {
                    status: result.status === 200 ? 'up' : 'down',
                    statusCode: result.status,
                    details: result.data
                }
            };
        } catch ( error ) {
            return {
                [ service.name ]: {
                    status: 'down',
                    error: error.message,
                    timeStamp: new Date().toISOString()
                }
            };
        }
    }
}
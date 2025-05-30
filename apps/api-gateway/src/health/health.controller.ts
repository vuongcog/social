import { Controller, Get, Param, Res } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    MemoryHealthIndicator,
    DiskHealthIndicator
} from '@nestjs/terminus';
import { ServicesHealthIndicator } from './indicators/services.health';

@Controller( 'health' )
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private memory: MemoryHealthIndicator,
        private disk: DiskHealthIndicator,
        private servicesHealth: ServicesHealthIndicator,

    ) { }



    @Get()
    @HealthCheck()
    check() {
        const check = [
            () => this.memory.checkHeap( 'memory_heap', 300 * 1024 * 1024 ),
            () => this.disk.checkStorage( 'disk', { path: '/', thresholdPercent: 0.9 } ),
            () => this.servicesHealth.checkServices(),
        ]
        return this.health.check( [
            () => this.memory.checkHeap( 'memory_heap', 300 * 1024 * 1024 ),
            () => this.disk.checkStorage( 'disk', { path: '/', thresholdPercent: 0.9 } ),
            () => this.servicesHealth.checkServices(),
        ] );
    }

    @Get( '/liveness' )
    @HealthCheck()
    checkLiveness() {
        return this.health.check( [
            () => this.memory.checkHeap( 'memory_heap', 300 * 1024 * 1024 ),
            () => this.disk.checkStorage( 'disk', { path: '/', thresholdPercent: 0.9 } ),
        ] );
    }

    @Get( '/services' )
    @HealthCheck()
    checkServices() {
        return this.health.check( [
            () => this.servicesHealth.checkServices(),
        ] );
    }

    @Get( '/services/:serviceName' )
    @HealthCheck()
    checkService( @Param( 'serviceName' ) serviceName: string ) {
        return this.health.check( [
            () => this.servicesHealth.checkService( serviceName ),
        ] );
    }
}
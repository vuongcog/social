import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    MemoryHealthIndicator,
    DiskHealthIndicator
} from '@nestjs/terminus';
import { KafkaHealthIndicator } from './kafka.health';
import { CacheHealthIndicator } from './cache.health';

@Controller( 'health' )
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private memory: MemoryHealthIndicator,
        private disk: DiskHealthIndicator,
        private kafkaHealth: KafkaHealthIndicator,
        private cacheHealth: CacheHealthIndicator
    ) { }

    @Get( '/liveness' )
    @HealthCheck()
    checkLiveness() {
        return this.health.check( [
            // Kiểm tra basic, service có chạy không
            () => this.memory.checkHeap( 'memory_heap', 300 * 1024 * 1024 ),
            () => this.disk.checkStorage( 'disk', { path: '/', thresholdPercent: 0.9 } ),
        ] );
    }

    @Get( '/readiness' )
    @HealthCheck()
    checkReadiness() {
        return this.health.check( [
            // Kiểm tra service có sẵn sàng phục vụ requests không
            () => this.kafkaHealth.checkKafka(),
            () => this.cacheHealth.checkCache(),
        ] );
    }
}
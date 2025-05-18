import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicatorResult } from '@nestjs/terminus';
import { KafkaService } from '../../kafka/kafka.service';

@Injectable()
export class KafkaHealthIndicator {
    constructor( private readonly kafkaService: KafkaService ) { }

    async checkKafka(): Promise<HealthIndicatorResult> {
        try {
            const isHealthy = await this.kafkaService.ping();

            if ( !isHealthy ) {
                throw new HealthCheckError(
                    'Kafka check failed',
                    { kafka: { status: 'down' } }
                );
            }

            return { kafka: { status: 'up' } };
        } catch ( error ) {
            return {
                kafka: {
                    status: 'down',
                    error: error.message
                }
            };
        }
    }
}
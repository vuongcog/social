import { Module } from "@nestjs/common";
import { ElasticSearchDataKafkaService } from "./data/elasticsearch.data-kafka.service";
import { CircuitBreakerService } from "@app/common/circuit-breaker/circuit-breaker.service";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { CONSTANTS } from "@app/common";
import { convertBrokers } from "@app/common/utils/convert-brokers";

@Module( {
    imports: [ ClientsModule.register( [
        {
            name: CONSTANTS.SERVICES[ 'elasticsearch-data-service' ],
            transport: Transport.KAFKA,
            options: {
                client: {
                    clientId: CONSTANTS.CLIENT_ID.ELASTICSEARCH_DATA_CLIENT_ID,
                    brokers: convertBrokers()
                },
                consumer: {
                    groupId: CONSTANTS.GROUP_ID.ELASTICSEARCH_DATA_GROUP_ID,
                },
            },
        },


    ] ) ],
    providers: [ ElasticSearchDataKafkaService, CircuitBreakerService ],
    exports: [ ElasticSearchDataKafkaService ],
} )
export class KafkaModule { }
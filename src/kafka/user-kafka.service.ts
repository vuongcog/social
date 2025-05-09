import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import type { PrismaService } from "src/prisma/prisma.service";
import type { KafkaService } from "./kafka.service";
import type { MyElasticSearchService } from "src/elasticsearch/myelasticsearch.service";

@Injectable()
export class UserKafkaService implements OnModuleInit {
    private readonly logger = new Logger( UserKafkaService.name );
    private readonly USER_TOPIC = 'user-events'

    constructor( private readonly prismaService: PrismaService,
        private readonly kafkaService: KafkaService,
        private readonly esService: MyElasticSearchService ) {

    }
    async onModuleInit() {
        await this.kafkaService.consume( [ this.USER_TOPIC, ], async ( message ) => {
            if ( !message.value ) return;
            try {
                const event = JSON.parse( message.value.toString() );

            } catch ( error ) {

            }
        } )
    }
    private async processUserEvent( event: any ) {
        const { type, payload } = event;

    }


}
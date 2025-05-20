import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { KafkaService } from "../../kafka/kafka.service";
import { MyElasticSearchService } from "src/elasticsearch/myelasticsearch.service";
import { type } from "node:os";
import { console } from "node:inspector/promises";

@Injectable()
export class UserKafkaService implements OnModuleInit {

    private readonly logger = new Logger( UserKafkaService.name );
    private readonly USER_TOPIC = 'user-events'
    private readonly ROLE_TOPIC = 'role-events'
    private readonly USER_ROLE = 'user-role-events'


    constructor( private readonly prismaService: PrismaService,
        private readonly kafkaService: KafkaService,
        private readonly esService: MyElasticSearchService ) {

    }

    async onModuleInit() {
        await this.kafkaService.consume( [ this.USER_TOPIC ], async ( message ) => {
            if ( !message.value ) return;
            try {
                const event = JSON.parse( message.value.toString() );
                await this.processUserEvent( event );
            } catch ( error ) {
                this.logger.error( `Error processing user event: ${ error.message }`, error.stack );
            }
        } );
    }

    private async processUserEvent( event: any ) {
        const { type, payload } = event;
        switch ( type ) {
            case 'USER_CREATED':
                await this.esService.indexDocument( 'users', payload.id, payload );
                this.logger.log( `Indexed new user: ${ payload.id }` );
                break;
            case 'USER_UPDATED':
                await this.esService.indexDocument( 'users', payload.id, payload );
                this.logger.log( `Updated user in Elasticsearch: ${ payload.id }` );
                break;
            case 'USER_DELETED':
                await this.esService.deleteDocument( 'users', payload.id );
                this.logger.log( `Deleted user from Elasticsearch: ${ payload.id }` );
                break;
            default:
                this.logger.warn( `Unknown event type: ${ type }` );
        }

    }

    async emitUserCreated( user: any ) {
        return this.kafkaService.sendMessage( this.USER_TOPIC, user.id, {
            type: 'USER_CREATED',
            payload: user,
            metadata: { timestamp: new Date().toISOString() }
        } )
    }

    async emitUserUpdated( user: any ) {
        return this.kafkaService.sendMessage( this.USER_TOPIC, user.id, {
            type: 'USER_UPDATED',
            payload: user,
            metadata: {
                timestamp: new Date().toISOString(),
            },
        } );
    }

    async emitUserDeleted( userId: string ) {
        return this.kafkaService.sendMessage( this.USER_TOPIC, userId, {
            type: 'USER_DELETED',
            payload: { id: userId },
            metadata: {
                timestamp: new Date().toISOString(),
            },
        } );
    }

    async syncAllUsers() {
        try {
            const users = await this.prismaService.user.findMany();
            await this.esService.syncFromDatabase( users, 'users' );
            this.logger.log( `Synced ${ users.length } users to Elasticsearch` );
            return { success: true, count: users.length };
        } catch ( error ) {
            this.logger.error( `Failed to sync users: ${ error.message }`, error.stack );
            throw error;
        }
    }
}
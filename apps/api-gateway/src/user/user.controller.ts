import { Body, Controller, Delete, Get, Inject, Param, Put, UseGuards, type OnModuleInit } from '@nestjs/common';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { InjectKafkaClient } from '../kafka/kafka.decorator';
import { ConfigService } from '@nestjs/config';
import { CONSTANTS } from '@app/common';

@Controller( 'users' )
// @UseGuards( AuthGuard )
export class UserController implements OnModuleInit {

    constructor(
        @Inject( process.env.USER_SERVICE || CONSTANTS.SERVICES[ 'user-service' ] ) private readonly userClient: ClientKafka,
        private readonly configService: ConfigService

    ) {
    }


    async onModuleInit() {
        this.userClient.subscribeToResponseOf( 'user.findAll' );
        this.userClient.subscribeToResponseOf( 'user.findOne' );

        await this.userClient.connect();

    }



    @Get()
    async findAll() {
        const response = await lastValueFrom(
            this.userClient.send( 'user.findAll', {} ),
        );

        if ( !response.success ) {
            return { success: false, message: response.message };
        }

        return { success: true, data: response.data };
    }

    @Get( ':id' )
    async findOne( @Param( 'id' ) id: string ) {
        const response = await lastValueFrom(
            this.userClient.send( 'user.findOne', { id } ),
        );

        if ( !response.success ) {
            return { success: false, message: response.message };
        }

        return { success: true, data: response.data };
    }

    @Put( ':id' )
    async update( @Param( 'id' ) id: string, @Body() body: { name?: string } ) {
        const response = await lastValueFrom(
            this.userClient.send( 'user.update', { id, ...body } ),
        );

        if ( !response.success ) {
            return { success: false, message: response.message };
        }

        return { success: true, data: response.data };
    }

    @Delete( ':id' )
    async remove( @Param( 'id' ) id: string ) {
        const response = await lastValueFrom(
            this.userClient.send( 'user.remove', { id } ),
        );

        if ( !response.success ) {
            return { success: false, message: response.message };
        }

        return { success: true };
    }
}
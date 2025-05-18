// api-gateway/src/user/user.controller.ts
import { Controller, Get, Put, Delete, Param, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller( 'users' )
@UseGuards( AuthGuard )
export class UserController {
    constructor( private readonly kafkaService: KafkaService ) { }

    @Get( 'me' )
    async getProfile( @Request() req ) {
        try {
            const user = await this.kafkaService.getUserById( req.user.userId );
            if ( !user ) {
                throw new HttpException( 'User not found', HttpStatus.NOT_FOUND );
            }
            return user;
        } catch ( error ) {
            throw new HttpException(
                error.message || 'Failed to fetch user profile',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get( ':id' )
    async getUserById( @Param( 'id' ) id: string ) {
        try {
            const user = await this.kafkaService.getUserById( id );
            if ( !user ) {
                throw new HttpException( 'User not found', HttpStatus.NOT_FOUND );
            }
            return user;
        } catch ( error ) {
            throw new HttpException(
                error.message || 'Failed to fetch user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Put( 'me' )
    async updateProfile( @Request() req, @Body() userData: any ) {
        try {
            return await this.kafkaService.updateUser( req.user.userId, userData );
        } catch ( error ) {
            throw new HttpException(
                error.message || 'Failed to update profile',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Delete( 'me' )
    async deleteProfile( @Request() req ) {
        try {
            return await this.kafkaService.deleteUser( req.user.userId );
        } catch ( error ) {
            throw new HttpException(
                error.message || 'Failed to delete profile',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
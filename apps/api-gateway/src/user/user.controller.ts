// api-gateway/src/user/user.controller.ts
import { Controller, Get, Put, Delete, Param, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { AuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';
import type { UpdateDto } from '@app/common/dto/user.dto';
import type { BaseResponse } from '@app/common';

@Controller( 'users' )
// @UseGuards( AuthGuard )
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


    @Put( ':id' )
    async update( @Body() updateDto: UpdateDto, @Param( 'id' ) id: string, @Request() req ) {
        try {

            const result = await this.kafkaService.updateUser( id, updateDto );

            if ( result.status === "error" ) {
                throw result;
            }
            return result

        } catch ( error ) {
            if ( error.status ) {
                throw new HttpException( error as BaseResponse, HttpStatus.BAD_REQUEST,
                )
            }
            else {
                throw new HttpException( {
                    status: 'error',
                    error: {
                        details: error,
                    }
                } as BaseResponse, HttpStatus.BAD_REQUEST )
            }
        }
    }



}
import { BaseResponse } from './../../../../libs/common/src/interfaces/response.interface';
import { Controller, Get, Put, Delete, Param, Body, UseGuards, Request, HttpException, HttpStatus, Res } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import type { UpdateDto } from '@app/common/dto/user.dto';
import { responseData } from '@app/common/utils/response';
import { throwCatchHtpp } from '@app/common/utils/http-throw-catch';
import { Public } from '../auth/public.decorator';
import { UserKafkaService } from '../kafka/user/gateway.user-kafka.service';

@Controller( 'users' )
// @UseGuards( AuthGuard )
export class UserController {
    constructor( private readonly kafkaService: UserKafkaService ) { }

    @Get( 'me' )
    async getProfile( @Request() req, @Res() res ) {
        try {
            const result: BaseResponse = await this.kafkaService.getUserById( req.user.id );
            return responseData( res, result );

        } catch ( error ) {
            throw throwCatchHtpp( res )
        }
    }

    @Public()
    @Get( ':id' )
    async getUserById( @Param( 'id' ) id: string, @Res() res ) {
        try {
            const result: BaseResponse = await this.kafkaService.getUserById( id );
            return responseData( res, result );

        } catch ( error ) {
            throw throwCatchHtpp( res )
        }
    }


    @Put( ':id' )
    async update( @Body() updateDto: UpdateDto, @Param( 'id' ) id: string, @Request() req, @Res() res ) {
        try {

            const result: BaseResponse = await this.kafkaService.updateUser( id, updateDto );

            return responseData( res, result );

        } catch ( error ) {
            throw throwCatchHtpp( error )

        }
    }



}
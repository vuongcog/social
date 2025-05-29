import { UserProcessingService } from './data.user-processing.service';
import { HttpStatus } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
import type { BaseResponse } from '@app/common';
import { throwCatch } from '@app/common/utils/throw-catch';
import type { UpdateDto } from '@app/common/dto/user.dto';

@Controller()
export class UserProcessingController {
    constructor( private readonly dataProcessingService: UserProcessingService ) {

    }

    @MessagePattern( KAFKA_TOPICS.DATA_CREATE_USER )
    async createUser( @Payload() data: { email: string; name: string; password: string } ): Promise<BaseResponse> {
        try {
            const user: BaseResponse = await this.dataProcessingService.createUser( data );
            return user
        } catch ( error ) {

            return throwCatch( error )

        }
    }


    @MessagePattern( KAFKA_TOPICS.DATA_UPDATE_USER )
    async updateUser( @Payload() data: { id: string; userData: UpdateDto } ) {
        try {
            const user = await this.dataProcessingService.updateUser( data.id, data.userData );
            return user
        } catch ( error ) {
            return throwCatch( error )
        }
    }

    @MessagePattern( KAFKA_TOPICS.DATA_GET_USER )
    async getUser( @Payload() data: { id?: string; email?: string } ): Promise<BaseResponse> {

        try {
            let result: BaseResponse;

            if ( data.id ) {
                result = await this.dataProcessingService.findUserById( data.id );
            } else {
                if ( !data.email )
                    throw {
                        statusCode: HttpStatus.BAD_REQUEST,
                        status: "error",
                        error: {
                            message: "Email is undefine"
                        }
                    } as BaseResponse

                result = await this.dataProcessingService.findUserByEmail( data.email );
            }
            return result

        } catch ( error ) {
            ;
            return throwCatch( error )

        }

    }


    @MessagePattern( KAFKA_TOPICS.DATA_GET_USER_BY_EMAIL )
    async findByEmail( @Payload() email: string ) {
        try {
            const user = await this.dataProcessingService.findUserByEmail( email );

            if ( !email ) {
                const throwError = {
                    statusCode: HttpStatus.BAD_REQUEST,
                    status: "error",
                    error: {
                        message: "Email Field is undefine"
                    }
                } as BaseResponse
                throw throwError;
            }

            return user
        } catch ( error ) {
            return throwCatch( error )
        }
    }

    @MessagePattern( KAFKA_TOPICS.DATA_GET_USER_BY_ID )
    async findById( @Payload() id: string ): Promise<BaseResponse> {
        try {

            if ( !id ) {
                const throwError = {
                    statusCode: HttpStatus.BAD_REQUEST,
                    status: "error",
                    error: {
                        message: "Id Field is undefine"
                    }
                } as BaseResponse
                throw throwError;
            }

            const user = await this.dataProcessingService.findUserById( id );
            return user
        } catch ( error ) {
            return throwCatch( error )


        }
    }


    @MessagePattern( KAFKA_TOPICS.DATA_GET_UNINDEX_RECORD )
    async getUnindexedRecords(): Promise<BaseResponse> {
        try {
            const result = await this.dataProcessingService.getUnindexedRecords();
            return result
        } catch ( error ) {
            return throwCatch( error )
        }
    }

    @MessagePattern( KAFKA_TOPICS.DATA_GET_INDEXEX_RECORDS )
    async getIndexedRecords(): Promise<BaseResponse> {
        try {
            const result = await this.dataProcessingService.getIndexedRecords();
            return result
        } catch ( error ) {
            return throwCatch( error )
        }
    }

    @MessagePattern( KAFKA_TOPICS.DATA_GET_UNINDEX_COUNT )
    async countUnindexedRecords(): Promise<BaseResponse> {
        try {
            const result = await this.dataProcessingService.countUnindexedRecords();
            return result
        } catch ( error ) {
            return throwCatch( error )
        }
    }

    @MessagePattern( KAFKA_TOPICS.DATA_UPDATE_FOR_UNINDEXED_ENTITIES )
    async updateUnIndexedEntities( @Payload() options: any ): Promise<BaseResponse> {
        try {
            const result = await this.dataProcessingService.updateUnIndexedEntities( options );
            return result
        } catch ( error ) {
            return throwCatch( error )
        }
    }

    @MessagePattern( KAFKA_TOPICS.DATA_GET_USERS )
    async getUsers( @Payload() payload ): Promise<BaseResponse> {
        try {
            if ( typeof payload !== "number" ) {
                payload = parseInt( payload )
            }
            const result = await this.dataProcessingService.getUsers( payload );
            return result
        } catch ( error ) {
            return throwCatch( error )
        }
    }

}
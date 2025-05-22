import { HttpStatus } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
import type { BaseResponse } from '@app/common';
import type { UpdateDto } from '@app/common/dto/user.dto';
import { throwCatch } from '@app/common/utils/throw-catch';

@Controller()
export class UserController {
    constructor( private readonly userService: UserService ) { }

    @MessagePattern( KAFKA_TOPICS.USER_CREATED )
    async createUser( @Payload() data: { email: string; name: string; password: string } ): Promise<BaseResponse> {
        try {
            const user: BaseResponse = await this.userService.createUser( data );
            return user
        } catch ( error ) {

            return throwCatch( error )

        }
    }

    @MessagePattern( KAFKA_TOPICS.USER_GET )
    async getUser( @Payload() data: { id?: string; email?: string } ): Promise<BaseResponse> {

        try {
            let result: BaseResponse;

            if ( data.id ) {
                result = await this.userService.findUserById( data.id );
            } else {
                if ( !data.email )
                    throw {
                        statusCode: HttpStatus.BAD_REQUEST,
                        status: "error",
                        error: {
                            message: "Email is undefine"
                        }
                    } as BaseResponse

                result = await this.userService.findUserByEmail( data.email );
            }
            return result

        } catch ( error ) {
            ;
            return throwCatch( error )

        }

    }

    @MessagePattern( KAFKA_TOPICS.USER_UPDATED )
    async updateUser( @Payload() data: { id: string; userData: UpdateDto } ) {
        try {
            const user = await this.userService.updateUser( data.id, data.userData );
            return user
        } catch ( error ) {
            return throwCatch( error )
        }
    }


    @MessagePattern( KAFKA_TOPICS.USER_FIND_BY_EMAIL )
    async findByEmail( @Payload() email: string ) {
        try {
            const user = await this.userService.findUserByEmail( email );
            return user
        } catch ( error ) {
            return throwCatch( error )

        }
    }
}
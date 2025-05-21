import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';
import type { BaseResponse } from '@app/common';
import type { UpdateDto } from '@app/common/dto/user.dto';

@Controller()
export class UserController {
    constructor( private readonly userService: UserService ) { }

    @MessagePattern( KAFKA_TOPICS.USER_CREATED )
    async createUser( @Payload() data: { email: string; name: string; password: string } ) {
        try {
            const user = await this.userService.createUser( data );
            return user
        } catch ( error ) {
            if ( error.status ) {
                return error as BaseResponse
            }
            else {
                throw {
                    status: 'error',
                    error: {
                        details: error,
                    }
                } as BaseResponse;
            }
        }
    }

    @MessagePattern( KAFKA_TOPICS.USER_GET )
    async getUser( @Payload() data: { id?: string; email?: string } ) {
        let user;

        if ( data.id ) {
            user = await this.userService.findUserById( data.id );
        } else if ( data.email ) {
            user = await this.userService.findUserByEmail( data.email );
        }

        if ( !user ) {
            return null;
        }

        return { id: user.id, email: user.email, name: user.name };
    }

    @MessagePattern( KAFKA_TOPICS.USER_UPDATED )
    async updateUser( @Payload() data: { id: string; userData: UpdateDto } ) {
        try {
            const user = await this.userService.updateUser( data.id, data.userData );
            return user
        } catch ( error ) {
            if ( error.status ) {
                return error as BaseResponse
            }
            else {
                return {
                    status: 'error',
                    error: {
                        details: error,
                    }
                } as BaseResponse;
            }
        }
    }


    @MessagePattern( KAFKA_TOPICS.USER_FIND_BY_EMAIL )
    async findByEmail( @Payload() email: string ) {
        try {
            const user = await this.userService.findUserByEmail( email );
            return user
        } catch ( error ) {
            if ( error.status ) {
                return error as BaseResponse
            }
            else {
                return {
                    status: 'error',
                    error: {
                        details: error,
                    }
                } as BaseResponse;
            }
        }
    }
}
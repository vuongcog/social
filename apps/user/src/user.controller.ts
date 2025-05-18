import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { KAFKA_TOPICS } from '@app/common/constants/kafka-topics';

@Controller()
export class UserController {
    constructor( private readonly userService: UserService ) { }

    @MessagePattern( KAFKA_TOPICS.USER_CREATED )
    async createUser( @Payload() data: { email: string; name: string; password: string } ) {
        const user = await this.userService.createUser( data );
        return { id: user.id, email: user.email, name: user.name };
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
    async updateUser( @Payload() data: { id: string; userData: any } ) {
        const user = await this.userService.updateUser( data.id, data.userData );
        return { id: user.id, email: user.email, name: user.name };
    }

    @MessagePattern( KAFKA_TOPICS.USER_DELETED )
    async deleteUser( @Payload() data: { id: string } ) {
        const user = await this.userService.deleteUser( data.id );
        return { success: true, id: user.id };
    }
}
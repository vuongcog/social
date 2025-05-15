import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class UserController {
    constructor( private readonly userService: UserService, private readonly configService: ConfigService ) {
    }

    @MessagePattern( 'user.findAll' )
    async findAll() {
        try {
            // const users = await this.userService.findAll();
            // return { success: true, data: users };
            return { success: true, }

        } catch ( error ) {
            return { success: false, message: error.message };
        }
    }

    @MessagePattern( 'user.findOne' )
    async findOne( @Payload() data: { id: string } ) {
        try {
            const user = await this.userService.findOne( data.id );
            if ( !user ) {
                return { success: false, message: 'User not found' };
            }
            return { success: true, data: user };
        } catch ( error ) {
            return { success: false, message: error.message };
        }
    }

    @MessagePattern( 'user.update' )
    async update( @Payload() data: { id: string; name?: string } ) {
        try {
            const user = await this.userService.update( data.id, { name: data.name } );
            return { success: true, data: user };
        } catch ( error ) {
            return { success: false, message: error.message };
        }
    }

    @MessagePattern( 'user.remove' )
    async remove( @Payload() data: { id: string } ) {
        try {
            await this.userService.remove( data.id );
            return { success: true };
        } catch ( error ) {
            return { success: false, message: error.message };
        }
    }

}
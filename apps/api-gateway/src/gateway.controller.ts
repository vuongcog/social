import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class GatewayController {
    @MessagePattern( 'user.response' )
    handleUserResponse( @Payload() data: any ) {
        console.log( 'Received user response:', data );
        return data;
    }
}
import { Controller, Get, Param } from '@nestjs/common';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Controller()
export class GatewayController {
    constructor(
        @Inject( 'ROLE_SERVICE' ) private readonly roleClient: ClientProxy,
    ) { }


    @Get( 'orders/:id' )
    getOrder( @Param( 'id' ) id: string ) {
        return this.roleClient.send( { cmd: 'get-order' }, id ).toPromise();
    }
}
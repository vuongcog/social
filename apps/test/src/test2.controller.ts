import { Controller, Get } from "@nestjs/common";
import { TestService } from "./test.service";

@Controller( 'test2' )
export class Test2Controller {
    constructor( private readonly service: TestService ) {

    }
    @Get()
    async test2() {
        return this.service.getHello();
    }
}
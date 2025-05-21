import { Controller, Get, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { TestService } from './test.service';
import test from 'node:test';

@Controller()
export class TestController {
  constructor( private readonly testService: TestService ) { }

  testService1() {

    // throw new HttpException( { status: 'error', message: "asd", code: 111, details: "asd" }, HttpStatus.ACCEPTED )
    // throw new UnauthorizedException( "testadf ladfjl akjfl;aj " )

    // throw ( { status: 'error', message: "asd", code: 111, details: "asd" } )
    throw new UnauthorizedException( { status: 'error', message: "asd", code: 111, details: "asd" } )


  }

  @Get( "test" )
  async test() {
    try {
      this.testService1()

    } catch ( error ) {
      throw ( "asds" )
    }
  }


}

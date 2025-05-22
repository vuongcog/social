import { Controller, Get, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { TestService } from './test.service';
@Controller()
export class TestController {
  constructor( private readonly testService: TestService ) { }

  testService1() {
    throw {
      status: "success",
      statusCode: HttpStatus.AMBIGUOUS,
    }
  }

  @Get( "test" )
  async test() {
    try {
      this.testService1()

    } catch ( error ) {
      throw new HttpException( error, error.statusCode )
    }
  }


}

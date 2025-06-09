import { Body, Controller, Get, HttpException, Post, Request } from '@nestjs/common';
import { TestService } from './test.service';
import { TestDto } from './test.dto';

@Controller()
export class TestController {
  constructor( private readonly testService: TestService ) { }

  @Get( "test" )
  async test() {
    try {
      return "hello"
    } catch ( error ) {
      throw new HttpException( error, error.statusCode )
    }
  }

  @Post( "test" )
  async test1( @Body() body: TestDto ) {
    try {
      return this.testService.getResponse( {
        name: "hello",
        email: "hello",
      } )

    } catch ( error ) {
      throw new HttpException( error, error.statusCode )
    }
  }
}

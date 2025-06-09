import { Injectable } from '@nestjs/common';
import { TestDto } from './test.dto';

@Injectable()
export class TestService {
  getHello(): string {
    return 'Hello World!';
  }
  getResponse( body: TestDto ) {
    return body
  }
}

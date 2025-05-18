import { Injectable } from '@nestjs/common';

@Injectable()
export class DataService {
  getHello(): string {
    return 'Hello World!';
  }
}

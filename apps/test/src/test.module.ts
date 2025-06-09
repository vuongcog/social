import { Global, Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { TestService } from './test.service';

@Global()
@Module( {
  imports: [],
  controllers: [ TestController ],
  providers: [ TestService ],
  exports: [ TestService ]
} )
export class TestModule { }

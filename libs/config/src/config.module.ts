import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { configs } from '@app/common';

@Global()
@Module( {
  imports: [
    NestConfigModule.forRoot( {
      isGlobal: true,
      envFilePath: `.env.${ process.env.NODE_ENV }`,
      load: configs
    } ),
  ],
  providers: [ ConfigService ],
  exports: [ ConfigService ],
} )
export class ConfigModule { }
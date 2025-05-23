import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

@Module( {
  imports: [
    NestConfigModule.forRoot( {
      envFilePath: `.env.${ process.env.NODE_ENV || "development" }`,
      isGlobal: true,
    } ),
  ],

} )
export class ConfigModule { }

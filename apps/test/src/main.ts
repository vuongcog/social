import { NestFactory } from '@nestjs/core';
import { TestModule } from './test.module';
import { ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create( AppModule );

  app.useGlobalPipes( new ValidationPipe( {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: false,
  } ) );

  app.useGlobalFilters( new ValidationExceptionFilter() );


  await app.listen( process.env.port ?? 4000 );
  console.log( "Runing on port 4000" )
}
bootstrap();

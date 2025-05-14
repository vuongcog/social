import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create( AppModule );
  const configService = app.get( ConfigService );

  app.useGlobalPipes( new ValidationPipe( { transform: true } ) );
  app.enableCors();

  app.enableVersioning( {
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  } );

  const config = new DocumentBuilder()
    .setTitle( 'API Gateway' )
    .setDescription( 'API Gateway cho microservices' )
    .setVersion( '1.0' )
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument( app, config );
  SwaggerModule.setup( 'api', app, document );

  const port = configService.get<number>( 'PORT' ) || 3000;
  await app.listen( port );
  console.log( `API Gateway đang chạy tại: ${ await app.getUrl() }` );
}
bootstrap();
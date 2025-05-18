import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@app/config';
import { CONSTANTS } from '@app/common';
async function bootstrap() {
  const app = await NestFactory.create( AppModule );
  const configService = app.get( ConfigService );
  const brokers = configService.kafkaBrokerUrls;

  const microservice = app.connectMicroservice<MicroserviceOptions>( {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: CONSTANTS.CLIENT_ID.AUTH_CLIENT_ID,
        brokers: brokers,
      },
      consumer: {
        groupId: CONSTANTS.GROUP_ID.AUTH_GROUP_ID,
      },
    },
  } );

  await app.startAllMicroservices();
  await app.listen( 3001 );
  console.log( 'Auth service is running on port 3001' );
}

bootstrap();
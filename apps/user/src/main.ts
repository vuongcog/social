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
        clientId: CONSTANTS.CLIENT_ID.USER_CLIENT_ID,
        brokers: brokers
      },
      consumer: {
        groupId: CONSTANTS.GROUP_ID.USER_GROUP_ID,
      },
    },
  } );

  await app.startAllMicroservices();
  await app.listen( 3002 );
  console.log( 'User service is running on port 3002' );
}

bootstrap();
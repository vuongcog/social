import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { CONSTANTS } from '@app/common';
import { ConfigService } from '@app/config';
import { DataModule } from './data.module';

async function bootstrap() {

  const app = await NestFactory.create( DataModule );
  const configService = app.get( ConfigService );
  const logger = new Logger( 'DataService' );

  const brokers = configService.kafkaBrokerUrls;

  app.connectMicroservice<MicroserviceOptions>( {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: CONSTANTS.SERVER_ID.DATA_SERVER_ID,
        brokers: brokers,
      },
      consumer: {
        groupId: CONSTANTS.GROUP_ID.DATA_GROUP_ID,
      },
    },
  } );

  await app.startAllMicroservices();
  await app.listen( 3006 );

  console.log( 'Data service is running on port 3006' );
}
bootstrap();
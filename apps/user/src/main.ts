import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@app/config';

async function bootstrap() {
  const app = await NestFactory.create( AppModule );
  const configService = app.get( ConfigService );

  const microservice = app.connectMicroservice<MicroserviceOptions>( {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'user',
        brokers: [
          'localhost:19092',
          'localhost:29092',
          'localhost:39092'
        ]
      },
      consumer: {
        groupId: 'user-consumer-deptrai',
      },
    },
  } );

  await app.startAllMicroservices();
  await app.listen( 3002 );
  console.log( 'User service is running on port 3002' );
}

bootstrap();
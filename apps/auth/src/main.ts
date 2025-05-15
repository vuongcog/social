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
        clientId: 'auth',
        brokers: configService.kafkaBrokerUrls,
      },
      consumer: {
        groupId: 'auth-consumer-deptrai',
      },
    },
  } );

  await app.startAllMicroservices();
  await app.listen( 3001 );
  console.log( 'Auth service is running on port 3001' );
}

bootstrap();
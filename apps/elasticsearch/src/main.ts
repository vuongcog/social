import { GROUP_ID } from './../../../libs/common/src/constants/group-id';
import { ConfigService } from './../../../libs/config/src/config.service';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CLIENT_ID } from '@app/common/constants/client-id';

async function bootstrap() {
  const app = await NestFactory.create( AppModule )
  const configService = app.get( ConfigService )
  const broksers = configService.kafkaBrokerUrls;
  const microservice = app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: CLIENT_ID.ELASTICSEARCH_CLIENT_ID,
          brokers: broksers
        },
        consumer: {
          groupId: GROUP_ID.ELASTICSEARCH_GROUP_ID,
        }

      }
    }
  )
  await app.startAllMicroservices()
  await app.listen( 3004 )
  console.log( 'Elastic Search service is running on port 3001' );

}
bootstrap();

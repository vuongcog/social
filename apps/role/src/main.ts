import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RoleModule } from './role.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>( RoleModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3001,
    },
  } );

  await app.listen();
  console.log( 'Role service is listening on port 3001' );
}
bootstrap();

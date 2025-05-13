import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validationPipe } from './pipes/validation.pipe';
import { LoggingInterceptor } from './api/user/user.interceptor';

async function bootstrap() {
  const app = await NestFactory.create( AppModule );

  app.useGlobalPipes( validationPipe );
  app.useGlobalInterceptors( new LoggingInterceptor() );

  await app.listen( process.env.PORT ?? 3000 );
}
bootstrap();

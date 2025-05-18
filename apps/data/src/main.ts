import { NestFactory } from '@nestjs/core';
import { DataModule } from './data.module';

async function bootstrap() {
  const app = await NestFactory.create(DataModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();

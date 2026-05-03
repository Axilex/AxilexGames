import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ALLOWED_ORIGINS } from './common/game-room';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: ALLOWED_ORIGINS, credentials: true });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`API running on port ${port}`, 'Bootstrap');
}

bootstrap();

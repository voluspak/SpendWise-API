import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module.js';
import { config } from './config/app/index.js';
import { Logger } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.setGlobalPrefix('api');

  app.use(helmet());
  app.use(cookieParser());

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.enableCors(config.api.cors);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  Logger.log(
    `API is running on ${config.api.url}:${config.api.port}/api/v${config.api.version}`,
  );
  await app.listen(config.api.port);
}

void bootstrap();

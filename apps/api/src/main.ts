import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

async function bootstrap() {
  const logger = new Logger('SLLAS_API');
  if (process.env.NODE_ENV === 'production' && (!process.env.OIDC_ISSUER || !process.env.OIDC_AUDIENCE)) {
    throw new Error('OIDC_ISSUER and OIDC_AUDIENCE are required in production');
  }

  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.disable('x-powered-by');

  app.use((req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress || 'unknown';

    const now = Date.now();
    const current = rateLimitStore.get(ip);

    if (!current || current.resetAt <= now) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + 60_000 });
    } else {
      current.count += 1;
      if (current.count > 120) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please retry in a minute.',
          },
        });
      }
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('X-Request-Id', req.headers['x-correlation-id']?.toString() || crypto.randomUUID());

    next();
  });

  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? [process.env.WEB_APP_URL].filter(Boolean)
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:8081',
          'exp://localhost:8081',
          process.env.WEB_APP_URL || '',
        ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id', 'Idempotency-Key'],
  });

  app.use(cookieParser());

  // Global Validation Pipe with automatic sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SLLAS — Smart Land Lease and Allocation System API')
    .setDescription(
      'Official Sovereign Registry API for land parcels, lease applications, and explainable recommendations in Zimbabwe.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter Keycloak or dev JWT token',
        in: 'header',
      },
      'bearer',
    )
    .addCookieAuth('sllas_session')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 SLLAS API listening on port ${port}`);
  logger.log(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();

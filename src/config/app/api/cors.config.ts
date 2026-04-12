import { type CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const parseAllowedOrigins = (): CorsOptions['origin'] => {
  if (process.env['NODE_ENV'] !== 'production') {
    return true;
  }

  const origins =
    process.env['CORS_ALLOWED_ORIGINS'] ?? 'https://localhost:3000';

  return origins.split(',').map((origin) => origin.trim());
};

export const corsConfig: CorsOptions = {
  origin: parseAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Content-Length',
    'Content-Language',
  ],
  exposedHeaders: ['take', 'page', 'count', 'limit', 'X-Response-Time'],
};

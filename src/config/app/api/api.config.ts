import { corsConfig } from './cors.config.js';

export const apiConfig = {
  api: {
    url: 'http://localhost',
    port: 3000,
    version: '1',
    responseTime: true,
    cors: corsConfig,
  },
};

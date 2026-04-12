import { apiConfig } from './api/api.config.js';
import { ConfigFactory } from './config-factory.service.js';
import { environmentVariablesConfig } from './environment/environment-variables.config.js';
import { projectConfig } from './project/project.config.js';

const envFile = process.env['NODE_ENV'] === 'test' ? '.env.test' : '.env';

if (process.env['NODE_ENV'] !== 'production') {
  process.loadEnvFile(envFile);
  console.info(
    `Loading environment variables from ${envFile} file in ${process.env['NODE_ENV']} mode...`,
  );
}

type AppConfig = typeof environmentVariablesConfig &
  typeof apiConfig &
  typeof projectConfig;

export const configClass = new ConfigFactory<AppConfig>({
  ...environmentVariablesConfig,
  ...apiConfig,
  ...projectConfig,
});

export const config = configClass.get();

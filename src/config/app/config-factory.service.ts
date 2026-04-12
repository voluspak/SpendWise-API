import * as process from 'process';

import { deepFreeze } from '../utils/deep-freeze.utility.js';
import { parseJSONString } from '../utils/parser.utility.js';

export const REQUIRED = Symbol('REQUIRED_ENV_VAR');

export interface ConfigBaseOptions {
  [k: string]: unknown;
  envKey?: string;
  environment?: string;
  isProduction?: boolean;
  PWD?: string;
}

export class ConfigFactory<Config> {
  protected config: Config & ConfigBaseOptions;
  protected frozenConfig!: Config & ConfigBaseOptions;
  private readonly requiredPaths: string[];

  constructor(configs: Config & ConfigBaseOptions) {
    this.config = configs;
    this.requiredPaths = this.collectRequiredPaths(
      configs as Record<string, unknown>,
    );
    this.set();
  }

  set(): void {
    this.checkEnv();
    this.validateRequiredVars();
    this.deepFreeze();
  }

  get(): Config & ConfigBaseOptions {
    return this.frozenConfig;
  }

  protected checkEnv(): void {
    if (process.env['PWD']) {
      this.config.PWD = process.env['PWD'];
    }
    if (process.env['ENV_KEY']) {
      this.config.envKey = process.env['ENV_KEY'];
    }

    if (process.env['NODE_ENV']) {
      this.config.environment = process.env['NODE_ENV'];
      this.config.isProduction = process.env['NODE_ENV'] === 'production';
    }

    const regex = new RegExp(`${String(this.config.envKey)}_`, 'i');

    Object.getOwnPropertyNames(process.env).forEach((propName) => {
      if (!regex.test(propName)) {
        return;
      }

      const key = propName.replace(regex, '');
      const value = this.sanitizeValue(process.env[propName]);
      this.setConfigValue(
        this.config as Record<string, unknown>,
        key,
        value,
      );
    });
  }

  protected deepFreeze(): void {
    this.frozenConfig = { ...this.config };
    deepFreeze(this.frozenConfig);
  }

  protected sanitizeValue(value: string | undefined): unknown {
    if (value === undefined) {
      return value;
    }

    if (!Number.isNaN(+value)) {
      return Number(value);
    }

    if (value === 'null') {
      return null;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    if (value.startsWith('{') && value.endsWith('}')) {
      return parseJSONString(value);
    }

    return value;
  }

  protected setConfigValue(
    obj: Record<string, unknown>,
    key: string | string[],
    value: unknown,
  ): void {
    if (typeof key === 'string') {
      this.setConfigValue(obj, key.split('_'), value);
      return;
    }

    if (key.length === 1) {
      obj[key[0]] = value;
    } else {
      if (!obj[key[0]]) {
        obj[key[0]] = {};
      }

      this.setConfigValue(
        obj[key[0]] as Record<string, unknown>,
        key.slice(1),
        value,
      );
    }
  }

  private collectRequiredPaths(
    obj: Record<string, unknown>,
    prefix = '',
  ): string[] {
    const paths: string[] = [];
    for (const key of Object.keys(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      if (value === REQUIRED) {
        paths.push(fullPath);
      } else if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        paths.push(
          ...this.collectRequiredPaths(
            value as Record<string, unknown>,
            fullPath,
          ),
        );
      }
    }
    return paths;
  }

  private getNestedValue(
    obj: Record<string, unknown>,
    path: string,
  ): unknown {
    return path
      .split('.')
      .reduce<unknown>(
        (current, key) =>
          current !== null &&
          current !== undefined &&
          typeof current === 'object'
            ? (current as Record<string, unknown>)[key]
            : undefined,
        obj,
      );
  }

  private validateRequiredVars(): void {
    const missing = this.requiredPaths.filter(
      (path) =>
        this.getNestedValue(
          this.config as Record<string, unknown>,
          path,
        ) === REQUIRED,
    );

    if (missing.length > 0) {
      const envKey = this.config.envKey ?? 'APP';
      const expectedVars = missing.map(
        (path) => `  - ${envKey}_${path.replace(/\./g, '_')}`,
      );
      console.error(
        `\n[ConfigFactory] Faltan variables de entorno requeridas:\n${expectedVars.join('\n')}\n`,
      );
      process.exit(1);
    }
  }
}

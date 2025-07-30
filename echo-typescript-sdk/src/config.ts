export interface EchoConfig {
  baseUrl: string;
  apiKey?: string;
}

export const defaultConfig: EchoConfig = {
  baseUrl:
    (typeof process !== 'undefined' && process.env?.ECHO_BASE_URL) ||
    'https://echo.merit.systems',
};

export function getConfig(overrides?: Partial<EchoConfig>): EchoConfig {
  return {
    ...defaultConfig,
    ...overrides,
  };
}

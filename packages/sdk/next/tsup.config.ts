import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/client.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
  external: [
    'axios',
    'react', 
    'react-dom',
    '@merit-systems/echo-react-sdk',
    'swr',
    'ai',
    '@ai-sdk/react',
    'next',
    'next/headers',
    'next/server'
  ],
  // Bundle AI SDK provider packages to prevent version conflicts
  noExternal: [
    '@ai-sdk/openai',
    '@ai-sdk/anthropic',
    '@ai-sdk/google', 
    '@openrouter/ai-sdk-provider'
  ],
  splitting: false,
  bundle: true,
});

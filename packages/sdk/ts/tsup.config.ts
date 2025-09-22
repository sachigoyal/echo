import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
  splitting: false,
  bundle: true,
  // Don't externalize these packages - bundle them instead
  noExternal: [
    '@ai-sdk/openai',
    '@ai-sdk/anthropic', 
    '@ai-sdk/google',
    '@openrouter/ai-sdk-provider'
  ],
});

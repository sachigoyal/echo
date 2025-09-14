import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/client.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
  external: ['axios', 'react', 'react-dom', '@merit-systems/echo-react-sdk'],
  splitting: false,
  bundle: true,
});

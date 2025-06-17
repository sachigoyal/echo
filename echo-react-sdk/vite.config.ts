import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EchoReactSDK',
      formats: ['es', 'cjs', 'umd'],
      fileName: format => {
        switch (format) {
          case 'es':
            return 'index.js';
          case 'cjs':
            return 'index.cjs';
          case 'umd':
            return 'echo-react-sdk.umd.js';
          default:
            return `index.${format}.js`;
        }
      },
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        // Node.js modules that should not be bundled for browser
        'inquirer',
        'commander',
        'chalk',
        'open',
        'fs',
        'path',
        'child_process',
        'os',
        'util',
        'stream',
        'readline',
        'tty',
        'crypto',
        'assert',
        'events',
        // Node.js built-in modules
        /^node:/,
        // CLI helper functions from echo-typescript-sdk
        /@zdql\/echo-typescript-sdk.*cli/,
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
  },
  esbuild: {
    target: 'es2020',
  },
});

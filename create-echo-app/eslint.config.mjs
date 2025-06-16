import tsParser from '@typescript-eslint/parser';

export default [
  {
    name: 'create-echo-app/ts-base',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    name: 'create-echo-app/ignores',
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '**/*.d.ts',
      'templates/',
    ],
  },
]; 
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Setup MSW server
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Mock window.crypto for PKCE testing
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
    randomUUID: vi.fn(() => 'mock-uuid-1234'),
    getRandomValues: vi.fn(array => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
  },
});

// Mock window.location for OAuth redirects
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    href: 'http://localhost:3000/',
    assign: vi.fn(),
    replace: vi.fn(),
  },
  writable: true,
});

// Mock history API
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn(),
    pushState: vi.fn(),
  },
});

// Mock window.confirm for payment flow tests
Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true), // Default to true for tests
  writable: true,
});

// Mock window.open for payment flow tests
Object.defineProperty(window, 'open', {
  value: vi.fn(() => null), // Default to null (popup blocked)
  writable: true,
});

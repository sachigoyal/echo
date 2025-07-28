import '@testing-library/jest-dom';

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3001',
    search: '',
    pathname: '/',
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock UserManager for Echo SDK tests
global.__echoUserManager = {
  getUser: jest.fn().mockResolvedValue(null),
  signinRedirect: jest.fn(),
  signoutRedirect: jest.fn(),
  removeUser: jest.fn(),
  events: {
    addUserLoaded: jest.fn(),
    addUserUnloaded: jest.fn(),
    addAccessTokenExpiring: jest.fn(),
    addAccessTokenExpired: jest.fn(),
    addSilentRenewError: jest.fn(),
    removeUserLoaded: jest.fn(),
    removeUserUnloaded: jest.fn(),
    removeAccessTokenExpiring: jest.fn(),
    removeAccessTokenExpired: jest.fn(),
    removeSilentRenewError: jest.fn(),
  },
};

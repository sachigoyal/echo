/// <reference types="jest" />

declare module 'supertest' {
  import { SuperTest, Test } from 'supertest';
  export default function supertest(app: any): SuperTest<Test>;
}

declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any> {
      mockResolvedValueOnce(value: T): this;
      mockRejectedValueOnce(value: any): this;
    }
  }
}

// Mock types for testing
export interface MockEchoControlService {
  verifyApiKey: jest.Mock;
  getBalance: jest.Mock;
  createTransaction: jest.Mock;
  getUserId: jest.Mock;
  getEchoAppId: jest.Mock;
  getUser: jest.Mock;
  getEchoApp: jest.Mock;
  getAuthResult: jest.Mock;
}

export interface MockAuthenticationResult {
  userId: string;
  echoAppId: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  echoApp: {
    id: string;
    name: string;
    userId: string;
  };
}

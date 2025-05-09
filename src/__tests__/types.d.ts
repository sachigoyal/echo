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
export class HttpError extends Error {
    constructor(
        public statusCode: number,
        message: string
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message: string = 'Unauthorized') {
        super(401, message);
    }
}

export class PaymentRequiredError extends HttpError {
    constructor(message: string = 'Payment Required') {
        super(402, message);
    }
} 
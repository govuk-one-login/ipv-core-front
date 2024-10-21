class BadRequestError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export default BadRequestError;

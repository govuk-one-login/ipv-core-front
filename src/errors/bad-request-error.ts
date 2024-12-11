import HttpError from "./http-error";

class BadRequestError extends HttpError {
  status = 400;

  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export default BadRequestError;

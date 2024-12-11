import HttpError from "./http-error";

class UnauthorizedError extends HttpError {
  status = 401;

  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export default UnauthorizedError;

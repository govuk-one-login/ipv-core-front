import HttpError from "./http-error";

class ForbiddenError extends HttpError {
  status = 403;

  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ForbiddenError;

import HttpError from "./http-error";

class NotFoundError extends HttpError {
  status = 404;

  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export default NotFoundError;

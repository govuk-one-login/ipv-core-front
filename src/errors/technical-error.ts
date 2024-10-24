import HttpError from "./http-error";

class TechnicalError extends HttpError {
  status = 500;

  constructor(message: string, cause?: unknown) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    if (this.stack && cause instanceof Error && cause?.stack) {
      this.stack = `${this.stack}\ncaused by: ${cause.stack}`;
    }
  }
}

export default TechnicalError;

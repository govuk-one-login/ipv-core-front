class NotFoundError extends Error {
  status = 404;

  constructor() {
    super();
    Error.captureStackTrace(this, this.constructor);
  }
}

export default NotFoundError;

import HttpError from "./http-error";

class ServiceUnavailable extends HttpError {
  status = 503;

  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ServiceUnavailable;

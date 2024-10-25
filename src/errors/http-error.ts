// Base class for errors that return a particular status code
abstract class HttpError extends Error {
  abstract status: number;
}

export default HttpError;

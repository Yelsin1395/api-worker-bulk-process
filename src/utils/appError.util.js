export default class AppError extends Error {
  constructor(errorStatus = 400, errorCode, message) {
    super(errorStatus, errorCode, message);

    this.errorStatus = parseInt(errorStatus);
    this.errorCode = errorCode;
    this.message = message;
  }
}

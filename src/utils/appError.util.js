export default class AppError extends Error {
  constructor(errorStatus, errorCode, message) {
    super(errorStatus, errorCode, message);

    this.errorStatus = parseInt(errorStatus);
    this.errorCode = errorCode;
    this.message = message;
  }
}

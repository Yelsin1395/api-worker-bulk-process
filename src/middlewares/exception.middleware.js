export const errorMiddleware = (err, req, res, next) => {
  if (err.errorCode) {
    const statusHttp = err.errorStatus || 400;
    res.status(statusHttp);
    res.send({
      status: statusHttp,
      code: err.errorCode,
      message: err.message,
    });
  } else {
    res.status(500);
    res.send({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

export const notFoundMiddleware = (err, req, res, next) => {
  return res.status(404).send({
    status: 404,
    code: 'RESOURCE_NOT_FOUND',
  });
};

export const errorMiddleware = (err, req, res, next) => {
  if (err.errorCode) {
    res.status(err.errorStatus);
    res.send({
      status: err.errorStatus,
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

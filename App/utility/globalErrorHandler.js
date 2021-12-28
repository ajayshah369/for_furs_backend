const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    statusCode: err.statusCode,
    status: err.status,
    message: err.message,
    err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  return res.status(err.statusCode).json({
    statusCode: err.statusCode,
    status: err.status,
    message: /^5/.test(String(err.statusCode))
      ? 'Internal Server Error'
      : err.message,
  });
};

module.exports = (err, req, res, next) => {
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  if (!err.status) {
    err.status = 'Internal Server Error';
  }

  if (process.env.NODE_ENV == 'development') {
    sendErrorDev(err, req, res);
  } else {
    sendErrorProd(err, req, res);
  }
};

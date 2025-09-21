module.exports.errorMiddleware = (err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV !== 'test') {
    console.error('[ERROR]', status, message);
  }
  res.status(status).json({ error: message });
};

let Sentry = null;
try {
  Sentry = require('../instrument');
} catch (e) {
  // Sentry não disponível
}

module.exports.errorMiddleware = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  if (Sentry && process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.captureException(err, {
      user: {
        id: req.userId || req.user?.id,
        email: req.user?.email,
      },
      tags: {
        endpoint: req.path,
        method: req.method,
        statusCode: status,
      },
      extra: {
        url: req.url,
        query: req.query,
        body: req.body,
      },
    });
  }
  
  if (process.env.NODE_ENV !== 'test') {
    console.error('[ERROR]', status, message);
  }
  
  res.status(status).json({ error: message });
};

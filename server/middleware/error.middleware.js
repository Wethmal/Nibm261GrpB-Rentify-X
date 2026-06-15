/**
 * @file error.middleware.js
 * @module ErrorMiddleware
 *
 * @description
 * Global error handling middleware for the Rentify Express application. Catches all
 * errors passed via next(err) from routes and middleware. Formats error responses
 * consistently with appropriate HTTP status codes. In development mode, includes
 * stack traces for debugging; in production, returns sanitized error messages.
 * Must be mounted as the LAST middleware in server.js.
 *
 * @dependencies
 * - None
 *
 * @exports
 * - errorHandler: Express error-handling middleware (err, req, res, next)
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

/**
 * Global error handler middleware.
 * Signature MUST have 4 parameters for Express to recognize it as error middleware.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // TODO: Log error details to a logging service (Winston, Pino) in production
  // TODO: Differentiate between operational errors (expected) and programming errors (bugs)
  // TODO: Handle specific error types:
  //   - ValidationError → 400
  //   - UnauthorizedError → 401
  //   - ForbiddenError → 403
  //   - NotFoundError → 404
  //   - MulterError (file upload) → 400
  //   - pg database errors → 500
  // TODO: Send error alerts for 500 errors in production (Slack, email)

  console.error('[Rentify Error]', err.message, err.stack);

  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: { message: 'File too large.' } });
  }

  if (err.message === 'Invalid file type' || err.message === 'Only JPEG, PNG, and WebP images are allowed.') {
    return res.status(415).json({ error: { message: err.message } });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

/**
 * @file validate.middleware.js
 * @module ValidateMiddleware
 *
 * @description
 * Request validation middleware using express-validator. Provides a reusable validate()
 * function that checks the validation result from express-validator chains and returns
 * 400 with formatted error messages if validation fails. Used in route definitions
 * after validation chain declarations. Also exports common validation chains for
 * reuse across routes.
 *
 * @dependencies
 * - express-validator: validationResult for checking validation errors
 *
 * @exports
 * - validate: Middleware that checks express-validator results and returns 400 on failure
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

const { validationResult } = require('express-validator');

/**
 * Middleware that processes express-validator validation results.
 * If validation errors exist, returns 400 with an array of error messages.
 * If no errors, calls next() to proceed to the route handler.
 *
 * @example
 * router.post('/register',
 *   [body('email').isEmail(), body('password').isLength({ min: 8 })],
 *   validate,
 *   authController.register
 * );
 */
const validate = (req, res, next) => {
  // TODO: Consider grouping errors by field for better frontend error display
  // TODO: Consider sanitizing input values (trim, escape) automatically
  // TODO: Add support for custom error message formatting

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = validate;

const jwt = require('jsonwebtoken');

const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, proceed anonymously
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    // If token is invalid, just proceed anonymously rather than throwing an error,
    // since the route doesn't strictly require authentication.
    next();
  }
};

module.exports = optionalAuthenticate;

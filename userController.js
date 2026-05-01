export const notFound = (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
};

export const errorHandler = (err, _req, res, _next) => {
  console.error(err);

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `${field} already in use` });
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    });
  }

  // Cast errors (bad ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }

  res.status(err.status || 500).json({
    message: err.publicMessage || err.message || 'Internal server error',
  });
};

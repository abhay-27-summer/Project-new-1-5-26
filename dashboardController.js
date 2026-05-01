/**
 * Wraps a zod schema into Express middleware.
 * Usage: router.post('/', validate(schema), handler)
 * If schema has shape { body, query, params }, validates each section.
 * Otherwise, treats it as a body schema.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    if (schema?.body) req.body = schema.body.parse(req.body);
    if (schema?.query) req.query = schema.query.parse(req.query);
    if (schema?.params) req.params = schema.params.parse(req.params);
    if (!schema?.body && !schema?.query && !schema?.params && schema?.parse) {
      req.body = schema.parse(req.body);
    }
    next();
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
      });
    }
    next(err);
  }
};

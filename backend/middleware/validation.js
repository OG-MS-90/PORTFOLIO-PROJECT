// middleware/validation.js
const { ValidationError } = require('../utils/errors');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        throw new ValidationError('Validation failed', errors);
      }
      
      req.validatedData = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

const validateCsvData = (schema) => {
  return (data) => {
    try {
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          row: err.path[0] + 1, // Convert to 1-based indexing
          field: err.path.slice(1).join('.'),
          message: err.message,
          code: err.code
        }));
        
        throw new ValidationError('CSV validation failed', errors);
      }
      
      return result.data;
    } catch (error) {
      throw error;
    }
  };
};

module.exports = {
  validate,
  validateCsvData
};

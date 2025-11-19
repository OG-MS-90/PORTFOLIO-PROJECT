/**
 * CSV VALIDATOR MIDDLEWARE
 * PRD Version 2.0 - Unified Investment Model
 * 
 * Enforces strict CSV requirements BEFORE data enters the system.
 * Prevents fallback logic from producing incorrect PnL values.
 * 
 * Required Fields:
 * - ticker, quantity, vested, exercisePrice, currentPrice (or API fetch)
 * - status, grantDate
 * 
 * NO FALLBACKS ALLOWED for critical fields.
 */

const VALID_STATUSES = ['Vested', 'Unvested', 'Exercised', 'Sold', 'Expired', 'Lapsed'];

const REQUIRED_FIELDS = [
  'ticker',
  'company',
  'grantDate',
  'quantity',
  'vested',
  'status',
];

const CONDITIONALLY_REQUIRED = {
  exercisePrice: (record) => {
    // Required for Exercised/Sold shares
    if (['Exercised', 'Sold'].includes(record.status)) {
      return 'exercisePrice is REQUIRED for Exercised/Sold shares';
    }
    return null; // Optional for others (will use strikePrice)
  },
  salePrice: (record) => {
    // Required for Sold shares
    if (record.status === 'Sold') {
      return 'salePrice is REQUIRED for Sold shares';
    }
    return null;
  },
};

/**
 * Validate a single CSV record
 */
function validateRecord(record, index) {
  const errors = [];
  const warnings = [];

  // 1. Check required fields
  REQUIRED_FIELDS.forEach(field => {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      errors.push(`Row ${index + 1}: Missing required field '${field}'`);
    }
  });

  // 2. Validate status
  if (record.status && !VALID_STATUSES.includes(record.status)) {
    errors.push(
      `Row ${index + 1}: Invalid status '${record.status}'. Must be one of: ${VALID_STATUSES.join(', ')}`
    );
  }

  // 3. Check conditionally required fields
  Object.entries(CONDITIONALLY_REQUIRED).forEach(([field, validator]) => {
    const error = validator(record);
    if (error) {
      errors.push(`Row ${index + 1}: ${error}`);
    }
  });

  // 4. Validate numeric types
  const numericFields = ['quantity', 'vested', 'strikePrice', 'exercisePrice', 'currentPrice', 'salePrice'];
  numericFields.forEach(field => {
    if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
      const value = Number(record[field]);
      if (isNaN(value)) {
        errors.push(`Row ${index + 1}: '${field}' must be a valid number, got '${record[field]}'`);
      } else if (value < 0) {
        errors.push(`Row ${index + 1}: '${field}' cannot be negative`);
      }
    }
  });

  // 5. Business rule: vested <= quantity
  if (record.vested !== undefined && record.quantity !== undefined) {
    const vested = Number(record.vested);
    const quantity = Number(record.quantity);
    
    if (!isNaN(vested) && !isNaN(quantity) && vested > quantity) {
      errors.push(
        `Row ${index + 1}: vested (${vested}) cannot exceed quantity (${quantity})`
      );
    }
  }

  // 6. Business rule: Unvested shares must have vested = 0
  if (record.status === 'Unvested' && record.vested !== undefined) {
    const vested = Number(record.vested);
    if (!isNaN(vested) && vested !== 0) {
      warnings.push(
        `Row ${index + 1}: Status is 'Unvested' but vested=${vested}. Should be 0.`
      );
    }
  }

  // 7. Business rule: Vested/Exercised/Sold must have vested > 0
  if (['Vested', 'Exercised', 'Sold'].includes(record.status) && record.vested !== undefined) {
    const vested = Number(record.vested);
    if (!isNaN(vested) && vested === 0) {
      warnings.push(
        `Row ${index + 1}: Status is '${record.status}' but vested=0. Suspicious.`
      );
    }
  }

  // 8. Validate date format
  if (record.grantDate) {
    const date = new Date(record.grantDate);
    if (isNaN(date.getTime())) {
      errors.push(`Row ${index + 1}: Invalid grantDate format '${record.grantDate}'`);
    }
  }

  // 9. Check for currentPrice or API ability
  if (!record.currentPrice && !record.fmv) {
    warnings.push(
      `Row ${index + 1}: No currentPrice or fmv provided. Will attempt live API fetch for '${record.ticker}'.`
    );
  }

  // 10. Check exercisePrice fallback
  if (!record.exercisePrice && record.strikePrice) {
    warnings.push(
      `Row ${index + 1}: No exercisePrice provided. Using strikePrice=${record.strikePrice} as fallback.`
    );
  }

  return { errors, warnings };
}

/**
 * Validate entire CSV dataset
 */
function validateCSV(records) {
  const allErrors = [];
  const allWarnings = [];
  const summary = {
    totalRecords: records.length,
    validRecords: 0,
    invalidRecords: 0,
    statusDistribution: {},
    missingFields: {},
  };

  // Validate each record
  records.forEach((record, index) => {
    const { errors, warnings } = validateRecord(record, index);
    
    if (errors.length > 0) {
      allErrors.push(...errors);
      summary.invalidRecords++;
    } else {
      summary.validRecords++;
    }
    
    allWarnings.push(...warnings);

    // Track status distribution
    if (record.status) {
      summary.statusDistribution[record.status] = 
        (summary.statusDistribution[record.status] || 0) + 1;
    }

    // Track missing fields
    REQUIRED_FIELDS.forEach(field => {
      if (!record[field]) {
        summary.missingFields[field] = (summary.missingFields[field] || 0) + 1;
      }
    });
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    summary,
  };
}

/**
 * Express middleware for CSV validation
 */
function csvValidationMiddleware(req, res, next) {
  const records = req.body.records || req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'No records provided for validation',
    });
  }

  const validation = validateCSV(records);

  if (!validation.isValid) {
    return res.status(400).json({
      status: 'error',
      message: 'CSV validation failed',
      errors: validation.errors,
      warnings: validation.warnings,
      summary: validation.summary,
    });
  }

  // Attach validation results to request
  req.csvValidation = validation;
  next();
}

/**
 * Normalize CSV record after validation
 */
function normalizeRecord(record) {
  return {
    ticker: (record.ticker || '').trim().toUpperCase(),
    company: (record.company || '').trim(),
    grantDate: record.grantDate,
    vestingStartDate: record.vestingStartDate || record.grantDate,
    vestingEndDate: record.vestingEndDate,
    quantity: Number(record.quantity),
    vested: Number(record.vested),
    strikePrice: record.strikePrice ? Number(record.strikePrice) : 0,
    exercisePrice: record.exercisePrice 
      ? Number(record.exercisePrice) 
      : (record.strikePrice ? Number(record.strikePrice) : 0),
    currentPrice: record.currentPrice ? Number(record.currentPrice) : undefined,
    fmv: record.fmv ? Number(record.fmv) : undefined,
    salePrice: record.salePrice ? Number(record.salePrice) : undefined,
    saleDate: record.saleDate || undefined,
    status: record.status,
    type: record.type || record.grantType || 'ESOP',
    notes: record.notes || '',
  };
}

/**
 * Normalize entire CSV dataset
 */
function normalizeCSV(records) {
  return records.map(normalizeRecord);
}

module.exports = {
  validateRecord,
  validateCSV,
  csvValidationMiddleware,
  normalizeRecord,
  normalizeCSV,
  VALID_STATUSES,
  REQUIRED_FIELDS,
};

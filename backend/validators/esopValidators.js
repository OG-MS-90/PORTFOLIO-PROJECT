// validators/esopValidators.js
const { z } = require('zod');

const esopSchema = z.object({
  grantDate: z.string().optional().nullable(),
  exercisePrice: z.string().optional().transform((val) => {
    if (!val) return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }),
  vestingSchedule: z.string().optional().default('Standard'),
  expirationDate: z.string().optional().nullable(),
  totalGrants: z.string().optional().transform((val) => {
    if (!val) return 0;
    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : num;
  }),
  vested: z.string().optional().transform((val) => {
    if (!val) return 0;
    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : num;
  }),
  unvested: z.string().optional().transform((val) => {
    if (!val) return 0;
    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : num;
  }),
  exercised: z.string().optional().transform((val) => {
    if (!val) return 0;
    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : num;
  }),
  ticker: z.string().optional().default('N/A'),
  type: z.string().optional().default('ISO'),
  exerciseDate: z.string().optional().nullable(),
  notes: z.string().optional().default('')
});

const csvRowSchema = z.array(esopSchema).min(1, 'CSV must contain at least one row of data');

const goalSchema = z.object({
  monthlyIncome: z.number().min(0, 'Monthly income must be positive'),
  retirementGoal: z.number().min(0, 'Retirement goal must be positive'),
  esopExercise: z.number().min(0, 'ESOP exercise amount must be positive'),
  investmentHorizon: z.number().min(1, 'Investment horizon must be at least 1 year'),
  phoneNumber: z.string().optional()
});

module.exports = {
  esopSchema,
  csvRowSchema,
  goalSchema
};

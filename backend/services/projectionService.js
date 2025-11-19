// services/projectionService.js
// Handles all dynamic financial calculations for future value, retirement planning, etc.

/**
 * Calculates the future value of a series of regular investments (annuity).
 * @param {number} P - Principal amount (initial investment).
 * @param {number} PMT - Periodic payment (monthly contribution).
 * @param {number} r - Annual interest rate (as a decimal, e.g., 0.08 for 8%).
 * @param {number} n - Number of times interest is compounded per year.
 * @param {number} t - Number of years.
 * @returns {number} The future value.
 */
function calculateFutureValue(P, PMT, r, n, t) {
  const principalPart = P * Math.pow(1 + r / n, n * t);
  const pmtPart = PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));
  return principalPart + pmtPart;
}

/**
 * Adjusts a future value for inflation.
 * @param {number} futureValue - The calculated future value.
 * @param {number} inflationRate - The annual inflation rate (as a decimal).
 * @param {number} years - The number of years.
 * @returns {number} The inflation-adjusted (real) future value.
 */
function adjustForInflation(futureValue, inflationRate, years) {
  return futureValue / Math.pow(1 + inflationRate, years);
}

/**
 * Builds a full projection series for charting.
 * @param {Object} userGoals - The user's financial goals.
 * @param {Object} marketContext - Live market data (CAGR, inflation).
 * @returns {Array} A series of { year, value, realValue } points.
 */
function buildProjectionSeries(userGoals, marketContext) {
  const {
    monthlyContribution,
    investmentHorizon,
    riskTolerance,
  } = userGoals;

  const { expectedCagr, inflationRate } = marketContext;

  if (expectedCagr === null || inflationRate === null) {
    console.warn('[projectionService] Missing CAGR or inflation rate for projections.');
    return [];
  }

  const rate = expectedCagr / 100;
  const inflation = inflationRate / 100;
  const series = [];

  for (let year = 1; year <= investmentHorizon; year++) {
    const fv = calculateFutureValue(0, monthlyContribution, rate, 12, year);
    const realFv = adjustForInflation(fv, inflation, year);
    series.push({
      year,
      value: Math.round(fv),
      realValue: Math.round(realFv),
    });
  }

  return series;
}

module.exports = {
  calculateFutureValue,
  adjustForInflation,
  buildProjectionSeries,
};

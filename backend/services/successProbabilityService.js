// services/successProbabilityService.js

/**
 * Performs a simplified Monte Carlo simulation to estimate the probability of
 * achieving a financial goal based on risk profile and time horizon.
 * This is a simplified model for illustrative purposes.
 *
 * @param {string} riskTolerance - 'low', 'medium', or 'high'.
 * @param {number} timeHorizon - Investment time horizon in years.
 * @param {number} initialInvestment - The starting investment amount.
 * @param {number} goalAmount - The target financial goal.
 * @param {number} annualContribution - Amount added each year (e.g., 12 × monthly contribution).
 * @returns {object} - An object containing the success probability and average outcome.
 */
function runSimulation(riskTolerance, timeHorizon, initialInvestment, goalAmount, annualContribution) {
  const scenarios = 1000; // Number of simulation runs
  let successCount = 0;

  const riskProfiles = {
    // Slightly conservative long‑term assumptions; we want failure to be
    // realistically possible, especially over shorter horizons.
    low: { mean: 0.045, stdDev: 0.08 },    // Lower return, lower volatility
    medium: { mean: 0.07, stdDev: 0.15 },  // Balanced return and volatility
    high: { mean: 0.095, stdDev: 0.22 },   // Higher return, higher volatility
  };

  const { mean, stdDev } = riskProfiles[riskTolerance] || riskProfiles.medium;

  for (let i = 0; i < scenarios; i++) {
    let currentValue = initialInvestment;
    for (let year = 0; year < timeHorizon; year++) {
      // Generate a random return based on a normal distribution (Box-Muller transform)
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const annualReturn = mean + z * stdDev;
      // Grow existing capital plus new contributions
      currentValue = (currentValue + (annualContribution || 0)) * (1 + annualReturn);
    }

    if (currentValue >= goalAmount) {
      successCount++;
    }
  }

  const successProbability = (successCount / scenarios) * 100;

  return {
    successProbability: parseFloat(successProbability.toFixed(2)),
    riskTolerance,
    timeHorizon,
  };
}

/**
 * Generates success probabilities for multiple time horizons.
 * @param {object} esopData - The user's ESOP data to determine initial investment.
 * @param {object} userGoals - The user's financial goals.
 * @returns {object} - An object with success probabilities for each risk profile.
 */
function generateSuccessProbabilities(esopData, userGoals) {
  const initialInvestment = esopData.reduce((sum, grant) => sum + (grant.vested * grant.exercisePrice), 0);

  const explicitGoal = userGoals.savingsGoal || 0;
  const annualContribution = (userGoals.monthlyContribution || 0) * 12;

  const horizons = [5, 10, 15, 20];
  const results = {
    lowRisk: {},
    mediumRisk: {},
    highRisk: {},
  };

  for (const risk of ['lowRisk', 'mediumRisk', 'highRisk']) {
    for (const horizon of horizons) {
      // Horizon‑specific target: at least ~40–60% growth over total capital
      // (initial ESOP + contributions), or the user's explicit goal if higher.
      const totalCapital = initialInvestment + annualContribution * horizon;

      // Require meaningful growth over what the user actually contributes.
      // Reduced multipliers to make success more achievable but still non-trivial
      const baselineTarget = totalCapital * (horizon <= 7 ? 1.2 : horizon <= 12 ? 1.3 : 1.4);

      const horizonGoal = explicitGoal > 0
        ? Math.max(explicitGoal, baselineTarget)
        : baselineTarget;

      const simResult = runSimulation(
        risk.replace('Risk', ''),
        horizon,
        initialInvestment,
        horizonGoal,
        annualContribution,
      );
      results[risk][`year${horizon}`] = simResult.successProbability;
    }
  }

  return results;
}

module.exports = { generateSuccessProbabilities };

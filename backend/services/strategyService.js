// services/strategyService.js
// Advanced Financial Modelling & Strategy Engine

/**
 * Calculate comprehensive success probability using Monte Carlo-lite heuristics
 * @param {Object} params - Financial parameters
 * @returns {number} Probability of success (0-100)
 */
function calculateSuccessProbability({
  savingsRate,      // Savings as % of income
  riskProfile,      // 'low', 'medium', 'high'
  horizonYears,     // Investment horizon
  liquidityRatio    // Liquid assets / Monthly expenses
}) {
  // Base baseline
  let score = 50;

  // 1. Savings Rate Impact (Weight: 40%)
  // A healthy savings rate is >20%. Below 10% is risky.
  const savingsImpact = Math.min(savingsRate * 2, 40); 
  score += (savingsImpact - 20); // Center around 20% savings

  // 2. Time Horizon Impact (Weight: 30%)
  // Longer horizons smooth out volatility
  const horizonImpact = Math.min(horizonYears * 1.5, 30);
  score += horizonImpact;

  // 3. Risk/Volatility Penalty (Weight: 30%)
  // Higher risk requires longer horizon or higher buffer
  const volatilityMap = { low: 5, medium: 12, high: 20 };
  const volatility = volatilityMap[riskProfile] || 12;
  
  // If horizon is short (<3 years) and risk is high, massive penalty
  if (horizonYears < 3 && riskProfile === 'high') {
    score -= 25;
  } else if (horizonYears < 5 && riskProfile === 'medium') {
    score -= 10;
  }

  // 4. Liquidity Buffer Bonus
  if (liquidityRatio > 6) score += 5; // 6 months cushion is solid

  // Clamp between 5-99 (never 100%)
  return Math.min(Math.max(Math.round(score), 5), 99);
}

/**
 * Generate detailed investment strategies with precise regional tax/asset context
 */
function generateDetailedStrategies(planningRegion, riskTolerance, userGoals = {}) {
  const age = userGoals.currentAge || 35;
  const horizon = userGoals.investmentHorizon || 10;
  const monthlyIncome = userGoals.monthlyIncome || 100000;
  const monthlyExpenses = userGoals.monthlyExpenses || 50000;
  
  // Calculate derived metrics
  const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;

  // Region-specific constants
  const REGION_CONFIG = {
    us: {
      equityReturn: { low: 6, medium: 8, high: 10 },
      riskFree: 'US T-Bills',
      index: 'S&P 500'
    },
    india: {
      equityReturn: { low: 9, medium: 12, high: 15 },
      riskFree: 'Liquid BeES/Arbitrage Funds',
      index: 'Nifty 50'
    }
  }[planningRegion] || { equityReturn: { low: 7, medium: 9, high: 11 } }; // Default fallback

  // Base Allocation Model
  const allocations = getRiskAdjustedAllocation(planningRegion, riskTolerance);

  // Strategy 1: Core Portfolio (The Engine)
  const strategies = [{
    title: 'Core Strategic Allocation',
    description: `Primary wealth engine tailored for ${planningRegion.toUpperCase()} tax efficiency and ${riskTolerance} risk.`,
    allocation: 60,
    examples: planningRegion === 'india' 
      ? ['Nifty 50 Index Fund (Low Cost)', 'Flexi-Cap Funds (Alpha)', 'Corporate Bond Funds (Stability)']
      : ['Vanguard Total Stock (VTI)', 'Total Bond Market (BND)', 'International Equity (VXUS)'],
    detailedAdvice: `Allocate 60% of capital here. For ${planningRegion === 'india' ? 'Indian' : 'US'} markets, this mix targets a ${REGION_CONFIG.equityReturn[riskTolerance]}% annualized return over ${horizon} years. Rebalance annually to maintain the ${allocations.equity}/${allocations.bonds} split.`
  }];

  // Strategy 2: Tactical/Satellite (The Alpha)
  strategies.push({
    title: 'Tactical Growth Satellites',
    description: 'High-conviction bets to outperform the benchmark.',
    allocation: 25,
    examples: riskTolerance === 'high' 
      ? ['Momentum Factor ETFs', 'Small-Cap Value', 'Technology Sector'] 
      : ['Dividend Aristocrats', 'Quality Factor ETFs', 'Healthcare Sector'],
    detailedAdvice: `Use this 25% to capture excess returns. ${riskTolerance === 'high' ? 'Aggressive factor investing (Momentum/Value) works well with your >10yr horizon.' : 'Focus on quality factors (high ROE, low debt) to compound steadily.'}`
  });

  // Strategy 3: Liquidity & Opportunity Fund
  strategies.push({
    title: 'Liquidity & Opportunity Fund',
    description: 'Dry powder for market corrections and emergencies.',
    allocation: 15,
    examples: planningRegion === 'india'
      ? ['Liquid BeES', 'Arbitrage Funds (Tax Efficient)', 'Overnight Funds']
      : ['T-Bills', 'High Yield Savings', 'Money Market Funds'],
    detailedAdvice: `Keep 15% liquid. In ${planningRegion === 'india' ? 'India, Arbitrage funds offer equity taxation benefits (10% LTCG) with debt-like safety' : 'the US, T-Bills currently offer competitive risk-free yields'}. Deploy this capital when market falls >10%.`
  });

  return strategies;
}

/**
 * Calculate Downside Metrics (Value at Risk)
 */
function calculateDownsideMetrics(planningRegion, riskTolerance) {
  // Volatility assumptions (Standard Deviation)
  const vol = {
    us: { low: 6, medium: 12, high: 18 },
    india: { low: 8, medium: 15, high: 22 }
  }[planningRegion][riskTolerance];

  return {
    volatility: vol,
    maxDrawdown: -(vol * 2), // 2-sigma event (95% confidence)
    recoveryTime: riskTolerance === 'high' ? '18-24 Months' : '12-18 Months',
    stressTest: {
      inflationSpike: -5,
      recession: -(vol * 1.5),
      marketCrash: -(vol * 2.5)
    },
    advisories: [
      `Expect daily fluctuations of ±${(vol/16).toFixed(1)}%`,
      `A 1-year loss of ${vol}% is statistically normal (1 in 6 years)`,
      `Stay invested: Missing the 10 best days halves long-term returns`
    ]
  };
}

/**
 * Precise ESOP Strategy with Tax & Leverage Calculations
 */
function generateDetailedEsopStrategy(planningRegion, riskTolerance, analyticsSummary, userGoals) {
  const esopValue = analyticsSummary?.esopOverview?.totalValue || 0;
  const costBasis = analyticsSummary?.esopOverview?.totalCost || 0;
  
  // Tax Logic
  const taxConfig = planningRegion === 'india' 
    ? { rate: 0.10, name: 'LTCG (10% > 1L)' } 
    : { rate: 0.20, name: 'Federal+State CGT (~20%)' };
  
  const estimatedGain = Math.max(esopValue - costBasis, 0);
  const potentialTax = estimatedGain * taxConfig.rate;
  
  // Concentration Risk
  const liquidNetWorth = (userGoals.currentSavings || 0) + (userGoals.otherInvestments || 0);
  const totalNetWorth = liquidNetWorth + esopValue;
  const concentrationPct = totalNetWorth > 0 ? (esopValue / totalNetWorth) * 100 : 0;
  
  let strategy = {
    overview: `Managing ${concentrationPct.toFixed(1)}% portfolio concentration in company stock.`,
    taxPlanning: `Estimated Tax Liability: ${userGoals.currency || '$'}${Math.round(potentialTax).toLocaleString()} via ${taxConfig.name}.`,
    actionSteps: []
  };

  // Decision Logic
  if (concentrationPct > 20) {
    strategy.riskAssessment = "CRITICAL: High Concentration Risk (>20%)";
    strategy.actionSteps.push({
      step: "Systematic Liquidation",
      details: "Sell 5-10% of vested shares quarterly regardless of price to diversify.",
      timeline: "Starting Next Quarter"
    });
  } else {
    strategy.riskAssessment = "Healthy: Concentration within manageable limits.";
    strategy.actionSteps.push({
      step: "Hold & Compound",
      details: "Retain shares for long-term compounding, tax-deferred growth.",
      timeline: "Review Annually"
    });
  }

  if (potentialTax > (liquidNetWorth * 0.2)) {
    strategy.actionSteps.push({
      step: "Tax Fund Creation",
      details: "Start setting aside cash monthly to cover future tax liability upon exercise.",
      timeline: "Immediate"
    });
  }

  return strategy;
}

/**
 * Allocation Helper
 */
function getRiskAdjustedAllocation(planningRegion, riskTolerance) {
  const allocations = {
    low: { equity: 40, bonds: 50, alternatives: 10 },
    medium: { equity: 60, bonds: 30, alternatives: 10 },
    high: { equity: 80, bonds: 10, alternatives: 10 }
  };
  return allocations[riskTolerance] || allocations.medium;
}

/**
 * Benchmark Generator
 */
function generateDetailedBenchmarks(planningRegion) {
  const benchmarks = {
    us: {
      primary: { name: 'S&P 500', cagr: 10.2 },
      secondary: { name: 'Nasdaq 100', cagr: 14.5 }
    },
    india: {
      primary: { name: 'Nifty 50', cagr: 12.5 },
      secondary: { name: 'Nifty Midcap 150', cagr: 16.2 }
    }
  };
  return { benchmarks: benchmarks[planningRegion] };
}

module.exports = {
  generateDetailedStrategies,
  generateDetailedBenchmarks,
  generateDetailedEsopStrategy,
  calculateDownsideMetrics,
  getRiskAdjustedAllocation,
  calculateSuccessProbability
};

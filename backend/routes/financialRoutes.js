// routes/financialRoutes.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const { generateFinancialPlan } = require('../services/aiService');
const Esop = require('../models/Esop');
const { requireAuth } = require('../middleware/auth');
const { buildAnalyticsSummary } = require('../services/analyticsService');
const { calculateBenchmarkStats, getInflationRate, getMarketOutperformers } = require('../services/marketDataService');
const { buildProjectionSeries } = require('../services/projectionService');
const { generateSuccessProbabilities } = require('../services/successProbabilityService');
const { getRiskAdjustedAllocation, calculateSuccessProbability } = require('../services/strategyService');

const BENCHMARK_CONFIG = {
  india: {
    primary: '^NSEI', // Nifty 50
    secondary: '^BSESN', // Sensex
    riskFreeSymbol: 'IN-10-YR', // Placeholder, ideally from a bond API
    riskFreeRate: 6.5, // Fallback India 10Y G-Sec
  },
  us: {
    primary: '^GSPC', // S&P 500
    secondary: '^IXIC', // Nasdaq Composite
    riskFreeSymbol: 'US-10-YR', // Placeholder
    riskFreeRate: 4.2, // Fallback US 10Y Treasury
  },
};

// Lightweight ESOP analytics endpoint (real-time PnL + region exposure)
router.get('/esop-analytics', requireAuth, async (req, res) => {
  try {
    const regionParam = (req.query.region || '').toString().toLowerCase();
    const planningRegion = regionParam === 'us' ? 'us' : (regionParam === 'india' ? 'india' : 'india');

    const esopDocs = await Esop.find({ userId: req.user._id });

    const userGoals = {
      planningRegion,
    };

    const analyticsSummary = await buildAnalyticsSummary(userGoals, esopDocs);

    if (!analyticsSummary) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to build ESOP analytics summary',
      });
    }

    const currency = planningRegion === 'india' ? 'INR' : 'USD';

    res.json({
      status: 'success',
      planningRegion,
      currency,
      analyticsSummary,
    });
  } catch (error) {
    console.error('[financialRoutes] Error in /financial/esop-analytics:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to load ESOP analytics',
    });
  }
});

// Live preview endpoint for dynamic form updates
router.post("/preview", requireAuth, async (req, res) => {
  try {
    const { planningRegion, riskTolerance, monthlyIncome, monthlyExpenses } = req.body;
    
    // Validate required fields
    if (!planningRegion || !riskTolerance) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: planningRegion, riskTolerance'
      });
    }
    
    // Get allocation from strategyService
    const allocation = getRiskAdjustedAllocation(planningRegion, riskTolerance);

    // Get live benchmarks using Yahoo Finance driven stats
    const benchmarkStats = await calculateBenchmarkStats(planningRegion);
    const primaryBenchmark = benchmarkStats?.benchmarks?.primary;
    const secondaryBenchmark = benchmarkStats?.benchmarks?.secondary;
    
    // Calculate savings rate
    const income = monthlyIncome || 100000;
    const expenses = monthlyExpenses || 50000;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 30;
    
    // Create AI summary based on inputs
    const regionName = planningRegion === 'us' ? 'US' : 'Indian';
    const riskLevel = riskTolerance === 'high' ? 'aggressive' : riskTolerance === 'medium' ? 'balanced' : 'conservative';
    
    const primaryCagr = primaryBenchmark?.cagr ?? 0;
    const aiSummary = `For a ${riskTolerance}-risk ${regionName} investor with ${savingsRate.toFixed(0)}% savings, this preview suggests ${allocation.equity}% equities and ${allocation.bonds}% bonds, anchored to ${primaryBenchmark?.name || primaryBenchmark?.symbol || 'the primary index'} with an estimated ${primaryCagr.toFixed(1)}% annualised return based on historical data.`;
    
    res.json({
      status: 'success',
      allocation,
      aiSummary,
      expectedCagr: primaryCagr,
      benchmarks: {
        primary: primaryBenchmark?.name || primaryBenchmark?.symbol || 'Primary benchmark',
        secondary: secondaryBenchmark?.name || secondaryBenchmark?.symbol || 'Secondary benchmark',
        primaryCagr,
        secondaryCagr: secondaryBenchmark?.cagr ?? null
      },
      riskProfile: riskLevel,
      savingsRate: savingsRate.toFixed(1)
    });
  } catch (error) {
    console.error('[financialRoutes] Error in preview:', error.message);
    res.status(500).json({status: 'error',
      message: error.message
    });
  }
});

// Generate financial plan endpoint
router.post("/generate-plan", requireAuth, async (req, res) => {
  try {
    const { 
      monthlyIncome, 
      monthlyExpenses, 
      savingsGoal, 
      investmentHorizon, 
      planningRegion, 
      currentAge, 
      riskTolerance, 
      retirementAge, 
      reinvestDividends, 
      monthlyContribution, 
      emergencyFundMonths 
    } = req.body;

    // Validate required fields
    if (!monthlyIncome || !investmentHorizon || !currentAge || !riskTolerance) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: monthlyIncome, investmentHorizon, currentAge, riskTolerance',
      });
    }

    // Get user's ESOP data
    const esopData = await Esop.find({ userId: req.user._id });

    // Create a user goals object for the AI service
    const userGoals = {
      monthlyIncome,
      monthlyExpenses: monthlyExpenses || 0,
      investmentHorizon,
      currentAge,
      riskTolerance,
      savingsGoal: savingsGoal || 0,
      planningRegion: planningRegion || 'india',
      retirementAge: retirementAge || 60,
      reinvestDividends: !!reinvestDividends,
      monthlyContribution: monthlyContribution || 0,
      emergencyFundMonths: emergencyFundMonths || 6,
    };

    const analyticsSummary = await buildAnalyticsSummary(userGoals, esopData);

    const regionConfig = BENCHMARK_CONFIG[userGoals.planningRegion] || BENCHMARK_CONFIG.india;

    console.log('[financialRoutes] Fetching market data for region:', userGoals.planningRegion);
    
    // Use the enhanced benchmark stats calculation that includes detailed metrics and region-specific benchmarks
    const [benchmarkStats, inflationRate] = await Promise.all([
      calculateBenchmarkStats(userGoals.planningRegion),
      getInflationRate(userGoals.planningRegion),
    ]);

    console.log('[financialRoutes] Primary benchmark data available:', benchmarkStats.primaryAvailable);
    console.log('[financialRoutes] Secondary benchmark data available:', benchmarkStats.secondaryAvailable);

    const marketContext = {
      benchmarks: benchmarkStats.benchmarks,
      inflationRate: inflationRate ?? (userGoals.planningRegion === 'india' ? 6.0 : 3.5),
      riskFreeRate: regionConfig.riskFreeRate,
      region: userGoals.planningRegion,
      currency: userGoals.planningRegion === 'india' ? 'INR' : 'USD',
    };

    console.log('[financialRoutes] Market context prepared with inflation rate:', marketContext.inflationRate);
    
    // Set expected CAGR based on risk tolerance and benchmark data
    // Fully dynamic: scales with real benchmark performance (no hardcoded caps)
    let expectedCagr;
    const baseCagr = benchmarkStats.benchmarks?.primary?.cagr || 11.0;
    
    if (userGoals.riskTolerance === 'low') {
      // Conservative: 75% of benchmark (bonds and defensive equities)
      expectedCagr = baseCagr * 0.75;
    } else if (userGoals.riskTolerance === 'medium') {
      // Moderate: 95% of benchmark (balanced portfolio)
      expectedCagr = baseCagr * 0.95;
    } else { // high
      // Aggressive: 105% of benchmark (growth-oriented, no cap - trusts benchmark data)
      expectedCagr = baseCagr * 1.05;
    }
    console.log('[financialRoutes] Using expected CAGR:', expectedCagr.toFixed(2) + '%', '(Risk:', userGoals.riskTolerance + ')');

    const projections = buildProjectionSeries(userGoals, {
      expectedCagr,
      inflationRate: marketContext.inflationRate,
    });

    try {
      console.log('[financialRoutes] Calling Gemini API to generate financial plan');
      let plan;
      
      try {
        plan = await generateFinancialPlan(userGoals, analyticsSummary, marketContext);
        console.log('[financialRoutes] Plan structure received:', Object.keys(plan).join(', '));
        
        // Always ensure projections are included
        if (!plan.projections || !Array.isArray(plan.projections) || plan.projections.length < 2) {
          console.log('[financialRoutes] Missing or incomplete projections, adding generated projections');
          plan.projections = projections;
        }
        
        // Validate and add defaults for required fields
        if (!plan.strategies || !Array.isArray(plan.strategies) || plan.strategies.length === 0) {
          console.warn('[financialRoutes] Missing or empty strategies, adding defaults');
          plan.strategies = [
            {
              title: 'Core Investment Strategy',
              description: 'Build a diversified portfolio using low-cost index funds aligned with your risk tolerance.',
              examples: ['S&P 500 ETFs for US stocks', 'Bond index funds for stability'],
              allocation: 60
            },
            {
              title: 'ESOP Diversification',
              description: 'Gradually diversify concentrated ESOP holdings into a broader portfolio.',
              examples: ['Sell 10-15% of vested shares annually', 'Reinvest in diversified assets'],
              allocation: 25
            },
            {
              title: 'Emergency Fund',
              description: 'Maintain liquid reserves covering 6 months of expenses for financial security.',
              examples: ['High-yield savings account', 'Money market funds'],
              allocation: 15
            }
          ];
        }
        
        // Ensure allocation field exists in each strategy
        plan.strategies = plan.strategies.map((s, i) => ({
          ...s,
          allocation: s.allocation || (i === 0 ? 50 : i === 1 ? 30 : 20)
        }));
        
        // Validate esopStrategy has all required fields
        if (!plan.esopStrategy || typeof plan.esopStrategy !== 'object') {
          plan.esopStrategy = {};
        }
        
        // Process ESOP strategy with structured fields
        let exerciseFundingStrategy;
        if (typeof plan.esopStrategy.exerciseFundingStrategy === 'string') {
          // Convert string to structured object with default values
          exerciseFundingStrategy = {
            estimatedCost: 15000, // Default if not provided
            monthlySavingsTarget: Math.round(15000 / 12), // Default monthly target
            annualSellPercentage: userGoals.riskTolerance === 'high' ? 20 : userGoals.riskTolerance === 'medium' ? 15 : 10,
            taxRate: userGoals.planningRegion === 'india' ? 10 : 22, // Default tax rates
            fundingSources: ['savings', 'sell-to-cover']
          };
        } else if (typeof plan.esopStrategy.exerciseFundingStrategy === 'object') {
          // Already structured, just ensure all fields
          exerciseFundingStrategy = {
            estimatedCost: plan.esopStrategy.exerciseFundingStrategy.estimatedCost || 15000,
            monthlySavingsTarget: plan.esopStrategy.exerciseFundingStrategy.monthlySavingsTarget || Math.round(15000 / 12),
            annualSellPercentage: plan.esopStrategy.exerciseFundingStrategy.annualSellPercentage || 
              (userGoals.riskTolerance === 'high' ? 20 : userGoals.riskTolerance === 'medium' ? 15 : 10),
            taxRate: plan.esopStrategy.exerciseFundingStrategy.taxRate || (userGoals.planningRegion === 'india' ? 10 : 22),
            fundingSources: plan.esopStrategy.exerciseFundingStrategy.fundingSources || ['savings', 'sell-to-cover']
          };
        } else {
          // Create new one based on user data
          const estimatedCost = analyticsSummary.esopOverview?.totalValue * 0.2 || 15000;
          exerciseFundingStrategy = {
            estimatedCost: Math.round(estimatedCost),
            monthlySavingsTarget: Math.round(estimatedCost / 12),
            annualSellPercentage: userGoals.riskTolerance === 'high' ? 20 : userGoals.riskTolerance === 'medium' ? 15 : 10,
            taxRate: userGoals.planningRegion === 'india' ? 10 : 22,
            fundingSources: ['savings', 'sell-to-cover']
          };
        }

        const defaultEsopStrategy = {
          overview: plan.esopStrategy.overview || 'Systematic approach to managing ESOP holdings for balanced risk.',
          riskAssessment: plan.esopStrategy.riskAssessment || 'Monitor concentration risk and diversify holdings over time.',
          liquidationPlan: plan.esopStrategy.liquidationPlan || `Sell ${userGoals.riskTolerance === 'high' ? '15-25%' : userGoals.riskTolerance === 'medium' ? '10-20%' : '5-15%'} of vested shares annually to reduce concentration.`,
          taxPlanning: plan.esopStrategy.taxPlanning || `In ${userGoals.planningRegion.toUpperCase()}, ESOP gains are taxed at ${userGoals.planningRegion === 'india' ? 'LTCG 10% above ₹1 lakh' : 'ordinary income rates for exercise, capital gains rates for sale'}.`,
          futureVestingStrategy: plan.esopStrategy.futureVestingStrategy || 'Review vesting schedule quarterly and plan liquidation strategy in advance.',
          exerciseFundingStrategy: exerciseFundingStrategy
        };
        
        plan.esopStrategy = defaultEsopStrategy;
        
        // Ensure implementationSteps exists and has at least 4 steps
        if (!plan.implementationSteps || !Array.isArray(plan.implementationSteps) || plan.implementationSteps.length < 3) {
          plan.implementationSteps = [
            { step: 1, action: 'Build emergency fund covering 3-6 months of expenses.', isCompleted: false },
            { step: 2, action: 'Set up automatic monthly contributions to investment accounts.', isCompleted: false },
            { step: 3, action: 'Implement recommended asset allocation across accounts.', isCompleted: false },
            { step: 4, action: 'Review and rebalance portfolio quarterly.', isCompleted: false }
          ];
        }
        
      } catch (aiError) {
        console.error('[financialRoutes] Error from AI service:', aiError.message);
        // Use a fallback template if AI fails
        plan = {
          title: 'Basic Financial Plan',
          description: 'This is a basic financial plan based on your goals and market data.',
          summary: 'A personalized financial strategy based on your risk tolerance and investment horizon.',
          allocation: [
            { name: 'Equities', value: userGoals.riskTolerance === 'high' ? 70 : userGoals.riskTolerance === 'medium' ? 60 : 50 },
            { name: 'Bonds', value: userGoals.riskTolerance === 'high' ? 20 : userGoals.riskTolerance === 'medium' ? 30 : 40 },
            { name: 'Alternatives', value: 10 }
          ],
          strategies: [
            {
              title: 'Core Investment Strategy',
              description: 'A diversified portfolio aligned with your risk profile and investment goals.',
              examples: ['Low-cost index ETFs', 'Target date funds']
            }
          ],
          esopStrategy: {
            overview: 'A systematic approach to managing your ESOP holdings.',
            riskAssessment: 'Based on your current portfolio concentration.',
            liquidationPlan: `Sell ${userGoals.riskTolerance === 'high' ? '15-25%' : userGoals.riskTolerance === 'medium' ? '10-20%' : '5-15%'} of vested shares annually to reduce concentration.`,
            taxPlanning: `In ${userGoals.planningRegion.toUpperCase()}, ESOP gains are taxed at ${userGoals.planningRegion === 'india' ? 'LTCG 10% above ₹1 lakh' : 'ordinary income rates for exercise, capital gains rates for sale'}.`,
            futureVestingStrategy: 'Plan to review and adjust your strategy as shares vest according to your vesting schedule.',
            exerciseFundingStrategy: {
              estimatedCost: Math.round((analyticsSummary.esopOverview?.totalValue || 100000) * 0.2),
              monthlySavingsTarget: Math.round((analyticsSummary.esopOverview?.totalValue || 100000) * 0.2 / 12),
              annualSellPercentage: userGoals.riskTolerance === 'high' ? 20 : userGoals.riskTolerance === 'medium' ? 15 : 10,
              taxRate: userGoals.planningRegion === 'india' ? 10 : 22,
              fundingSources: ['savings', 'sell-to-cover']
            }
          },
          implementationSteps: [
            { step: 1, action: 'Set up an emergency fund covering 3-6 months of expenses.', isCompleted: false },
            { step: 2, action: 'Open investment accounts and set up regular contributions.', isCompleted: false },
            { step: 3, action: 'Implement the recommended asset allocation.', isCompleted: false },
            { step: 4, action: 'Review and rebalance your portfolio quarterly.', isCompleted: false }
          ]
        };
      }

      const successProbability = generateSuccessProbabilities(esopData, userGoals);

      // Primary headline comes from the Monte Carlo grid for the chosen risk & horizon,
      // with a heuristic fallback when data is missing.
      const income = userGoals.monthlyIncome || 0;
      const expenses = userGoals.monthlyExpenses || 0;
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
      const liquidityRatio = userGoals.emergencyFundMonths || 0;

      const riskKey = userGoals.riskTolerance === 'low'
        ? 'lowRisk'
        : userGoals.riskTolerance === 'medium'
        ? 'mediumRisk'
        : 'highRisk';

      const horizon = userGoals.investmentHorizon || 10;
      let horizonKey = 'year10';
      if (horizon <= 5) horizonKey = 'year5';
      else if (horizon <= 10) horizonKey = 'year10';
      else if (horizon <= 15) horizonKey = 'year15';
      else horizonKey = 'year20';

      const gridSuccess = successProbability?.[riskKey]?.[horizonKey];

      const heuristicSuccess = calculateSuccessProbability({
        savingsRate,
        riskProfile: userGoals.riskTolerance,
        horizonYears: userGoals.investmentHorizon,
        liquidityRatio,
      });

      const headlineSuccess =
        typeof gridSuccess === 'number' ? Math.round(gridSuccess) : heuristicSuccess;

      const planWithAnalytics = {
        ...plan,
        expectedCagr,
        riskProfile: userGoals.riskTolerance,
        analyticsSummary,
        marketContext,
        projections,
        successProbability,
        headlineSuccessProbability: headlineSuccess,
      };

      try {
        const marketLeaders = await getMarketOutperformers(userGoals.planningRegion);
        planWithAnalytics.marketLeaders = marketLeaders;
      } catch (marketError) {
        console.error('[financialRoutes] Failed to fetch market outperformers:', marketError.message);
      }

      // Generate unique wealth manager ID
      const wealthManagerId = uuidv4();
      const dataAsOf = new Date().toISOString().split('T')[0];

      console.log('[financialRoutes] Financial plan generated successfully');
      res.json({
        status: 'success',
        wealthManagerId,
        dataAsOf,
        data: planWithAnalytics
      });
    } catch (error) {
      console.error('[financialRoutes] Critical error in plan generation flow:', error.message);
      // Still return the data we have for visualizations even if everything fails
      res.json({
        status: 'partial',
        message: 'Financial plan generation failed, but basic data is available',
        data: {
          title: 'Error Generating Plan',
          description: 'The system failed to generate a financial plan. Please try again later.',
          summary: `An error occurred: ${error.message}`,
          analyticsSummary,
          marketContext,
          projections,
          successProbability: generateSuccessProbabilities(esopData, userGoals),
          allocation: [
            { name: 'Equities', value: 60 },
            { name: 'Bonds', value: 30 },
            { name: 'Alternatives', value: 10 }
          ],
          strategies: [],
          esopStrategy: {},
          implementationSteps: [],
        }
      });
    }

  } catch (error) {
    console.error('Error generating financial plan:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate financial plan'
    });
  }
});

module.exports = router;

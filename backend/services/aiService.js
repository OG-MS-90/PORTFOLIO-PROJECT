// services/aiService.js
require("dotenv").config();
const axios = require("axios");
const strategyService = require("./strategyService");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Using the stable version of Gemini 2.5 Flash as it supports all the features we need
const PRIMARY_MODEL = 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.warn('[aiService] GEMINI_API_KEY is not configured. AI requests will fail.');
}

const getGeminiApiUrl = (model) => `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

function buildAiPrompt(userGoals, analyticsSummary, marketContext) {
  const { planningRegion, riskTolerance } = userGoals;
  const currency = planningRegion === 'us' ? 'USD' : 'INR';

  // Simplify analytics to only key metrics to reduce token usage
  const analyticsText = analyticsSummary
    ? `ANALYTICS SUMMARY:
    - Total ESOP Value: ${analyticsSummary.esopOverview?.totalValue || 0}
    - Total Positions: ${analyticsSummary.esopOverview?.totalPositions || 0}
    - High Concentration Risk: ${analyticsSummary.riskFlags?.highConcentration ? 'Yes' : 'No'}
    - Region Exposure: India ${Math.round((analyticsSummary.regionExposure?.india || 0) * 100)}%, US ${Math.round((analyticsSummary.regionExposure?.us || 0) * 100)}%`
    : 'No ESOP analytics available.';

  // Simplify market context to only essential data
  const marketText = marketContext
    ? `MARKET CONTEXT:
    - Inflation Rate: ${marketContext.inflationRate}%
    - Risk-Free Rate: ${marketContext.riskFreeRate}%
    - Primary Benchmark CAGR: ${marketContext.benchmarks?.primary?.cagr?.toFixed(2) || 'N/A'}%
    - Market Volatility: ${marketContext.benchmarks?.primary?.volatility?.toFixed(2) || 'N/A'}%`
    : 'No market context available.';

  return `
  You are a financial advisor AI. Your task is to create a personalized, data-driven financial plan based on the user's goals and the provided market data. Do not invent any numbers; all financial metrics must come from the provided context.

  USER GOALS:
  - Monthly Income: ${currency} ${userGoals.monthlyIncome}
  - Monthly Expenses: ${currency} ${userGoals.monthlyExpenses || 0}
  - Savings Goal: ${currency} ${userGoals.savingsGoal || 0}
  - Investment Horizon: ${userGoals.investmentHorizon} years
  - Current Age: ${userGoals.currentAge}
  - Retirement Age: ${userGoals.retirementAge || 60}
  - Risk Tolerance: ${riskTolerance}
  - Planning Region: ${planningRegion}

  ${analyticsText}

  ${marketText}

  Based *only* on the data above, create a comprehensive, industry-backed financial plan with deep, actionable insights. The plan must be region-specific and highly personalized to the user's age, risk profile, and financial situation.

  CRITICAL: Use REALISTIC, CONSERVATIVE growth projections based on historical industry data:
  - Low risk: 7-9% CAGR (primarily bonds and fixed income)
  - Medium risk: 10-11% CAGR (balanced portfolio)
  - High risk: 12-13% CAGR MAX (aggressive equities)

  Generate REGION-SPECIFIC recommendations tailored to ${planningRegion} and ${currency}.
  
  The plan must include:
  1.  **Asset Allocation:** 3-4 asset classes with percentage weights based on risk level and AGE:
      - low risk: 50% Bonds, 40% Large-Cap Equities, 10% Gold/Cash
      - medium risk: 55% Equities (diversified), 35% Bonds, 10% Alternatives
      - high risk: 75% Equities (growth-focused), 15% Bonds, 10% Alternatives
  
  2.  **Investment Strategies:** 3-4 detailed strategies SPECIFIC TO ${planningRegion.toUpperCase()}. Each must have:
      - title (concise, 3-5 words)
      - description (detailed 60-80 word explanation of WHY this strategy fits the user's profile)
      - examples (array with 3-4 REAL, tradeable ETFs/mutual funds available in ${planningRegion})
      - allocation (percentage number)
      - detailedAdvice (120-150 words explaining implementation, rebalancing frequency, tax optimization, and specific action items)
      
      For US region: Use real ETFs like VOO, VTI, QQQ, IWM, BND, VXUS, VNQ, TLT
      For India region: Use real funds like NIFTYBEES, JUNIORBEES, LIQUIDBEES, UTI Nifty 50 Index, ICICI Prudential Nifty ETF
  
  3.  **ESOP Strategy:** Comprehensive 6-field strategy with SPECIFIC, ACTIONABLE guidance:
      - overview (80-100 words explaining systematic approach based on user's age ${userGoals.currentAge} and risk tolerance)
      - riskAssessment (60-80 words analyzing concentration risk, company-specific risks, and sector exposure)
      - liquidationPlan (Include SPECIFIC % like "Sell 12-15% of vested shares annually" based on risk: low=5-10%, medium=10-15%, high=15-20%)
      - taxPlanning (100-120 words with ACTUAL tax rates and optimization strategies):
          * US: Include federal tax brackets, NIIT, AMT considerations, qualified vs ordinary income treatment
          * India: Include STCG 15%, LTCG 10% above ₹1 lakh, indexation benefits, holding period rules
      - futureVestingStrategy (60-80 words on planning for upcoming vests, exercise timing, cashless vs cash exercise)
      - exerciseFundingStrategy: MUST be an object with:
          * estimatedCost: number (calculate as 20% of ESOP value from analytics)
          * monthlySavingsTarget: number (divide estimatedCost by 12)
          * annualSellPercentage: number (10-20 based on risk)
          * taxRate: number (${planningRegion === 'india' ? 10 : 22})
          * fundingSources: array like ["monthly savings", "sell-to-cover", "emergency fund"]
  
  4.  **Projections:** Generate realistic year-by-year projections:
      - Use ${marketContext.inflationRate}% for inflation
      - For nominal CAGR, use CONSERVATIVE estimates: low=8%, medium=11%, high=13% MAX
      - Each year: { "year": number, "value": number, "realValue": number }
  
  5.  **Implementation Steps:** 4 steps with action text (max 20 words each).

  IMPORTANT: Your entire response must be strictly valid JSON only. Do not include any explanation or comments outside the JSON.
  
  Respond with a JSON object with the following structure:
  {
    "title": "Your Personalized Financial Plan",
    "description": "A dynamic financial plan based on your goals and live market data.",
    "summary": "A concise, AI-generated summary of the overall strategy.",
    "allocation": [
      { "name": "Equities", "value": 60 },
      { "name": "Bonds", "value": 30 },
      { "name": "Alternatives", "value": 10 }
    ],
    "strategies": [
      {
        "title": "Core Equity Strategy",
        "description": "Based on the market context, a core holding in a low-cost index fund tracking the primary benchmark is recommended.",
        "examples": ["Example: Vanguard S&P 500 ETF (VOO) for US, or ICICI Prudential Nifty 50 ETF for India."]
      }
    ],
    "esopStrategy": {
      "overview": "A summary of the ESOP management approach.",
      "riskAssessment": "Analysis of concentration risk based on the analytics summary.",
      "liquidationPlan": "A systematic plan to diversify away from single-stock risk with annual targets.",
      "taxPlanning": "Region-specific tax considerations with actual rates.",
      "futureVestingStrategy": "Timeline and approach for managing unvested shares as they vest over time.",
      "exerciseFundingStrategy": {
        "estimatedCost": 15000,
        "monthlySavingsTarget": 1200, 
        "annualSellPercentage": 10,
        "taxRate": 22,
        "fundingSources": ["savings", "sell-to-cover", "loans"]
      }
    },
    "projections": [
      { "year": 1, "value": 110000, "realValue": 107800 },
      { "year": 2, "value": 121000, "realValue": 116688 }
    ],
    "implementationSteps": [
      { "step": 1, "action": "Establish a 3-6 month emergency fund based on your monthly expenses.", "isCompleted": false },
      { "step": 2, "action": "Begin investing in a diversified portfolio according to the recommended asset allocation.", "isCompleted": false }
    ]
  }
  `;
}

async function generateFinancialPlan(userGoals, analyticsSummary, marketContext) {
  const prompt = buildAiPrompt(userGoals, analyticsSummary, marketContext);

  try {
    console.log(`[aiService] Using Gemini model: ${PRIMARY_MODEL}`);
    console.log('[aiService] API Key configured:', !!GEMINI_API_KEY && GEMINI_API_KEY.length > 20);
    console.log('[aiService] Market data available:', !!marketContext);
    console.log('[aiService] Analytics data available:', !!analyticsSummary);
    console.log('[aiService] Sending request to Gemini API...');
    
    const apiUrl = getGeminiApiUrl(PRIMARY_MODEL);
    console.log(`[aiService] API URL: ${apiUrl}`);
    
    const response = await axios.post(
      `${apiUrl}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Add verbose logging to debug the response structure
    console.log('[aiService] Response received, analyzing structure...');
    
    if (!response.data) {
      throw new Error('Empty response data from Gemini API');
    }
    
    console.log('[aiService] Response data structure:', JSON.stringify(response.data).substring(0, 200) + '...');
    
    if (!response.data.candidates || !Array.isArray(response.data.candidates) || response.data.candidates.length === 0) {
      throw new Error('No candidates in Gemini API response');
    }
    
    const candidate = response.data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      throw new Error('Invalid content structure in Gemini API response');
    }
    
    const part = candidate.content.parts[0];
    if (!part || typeof part.text !== 'string') {
      throw new Error('Missing text content in Gemini API response');
    }
    
    let generatedText = part.text.trim();
    console.log('[aiService] Generated text length:', generatedText.length);
    console.log('[aiService] Text sample:', generatedText.substring(0, 100) + '...');
    
    // Enhanced JSON extraction and cleaning
    try {
      // Strip markdown code blocks if present
      // Gemini sometimes wraps JSON in ```json ... ``` blocks
      if (generatedText.startsWith('```')) {
        console.log('[aiService] Detected markdown code block, stripping...');
        // Remove opening ```json or ``` 
        generatedText = generatedText.replace(/^```json\s*\n?/i, '').replace(/^```\s*\n?/, '');
        // Remove closing ```
        generatedText = generatedText.replace(/\n?```\s*$/g, '');
      }

      // Try to find where JSON starts and ends
      const jsonStartIndex = generatedText.indexOf('{');
      const jsonEndIndex = generatedText.lastIndexOf('}');
      
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        // Extract the JSON portion
        generatedText = generatedText.substring(jsonStartIndex, jsonEndIndex + 1);
        console.log('[aiService] Extracted JSON content between { and }');
      }

      // Fix common JSON syntax issues
      generatedText = generatedText
        // Fix trailing commas before closing brackets/braces
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix unquoted property keys (words followed by colon)
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
        // Fix single quotes around strings (convert to double quotes)
        .replace(/:(\s*)\'([^\']*)\'(\s*[,}])/g, ':"$2"$3');
      
      console.log('[aiService] Fixed potential JSON issues');
      
      // Attempt to parse the JSON
      const planData = JSON.parse(generatedText);
      
      // Validate required fields
      if (!planData.title || !planData.summary || !planData.allocation) {
        throw new Error('AI response is missing critical fields: title, summary, or allocation');
      }

      // Log what we received for debugging
      console.log('[aiService] Parsed plan data keys:', Object.keys(planData));
      console.log('[aiService] Strategies count:', planData.strategies?.length || 0);
      console.log('[aiService] ESOP strategy fields:', planData.esopStrategy ? Object.keys(planData.esopStrategy).join(', ') : 'none');
      console.log('[aiService] Projections count:', planData.projections?.length || 0);
      
      // Generate projections if missing
      if (!planData.projections || !Array.isArray(planData.projections) || planData.projections.length < 2) {
        console.log('[aiService] Generating missing projections data...');
        const defaultCAGR = userGoals.riskTolerance === 'low' ? 8 : 
                           userGoals.riskTolerance === 'medium' ? 12 : 18;
        const inflation = marketContext.inflationRate / 100;
        const startValue = 100000; // Default starting value
        const years = userGoals.investmentHorizon || 10;
        
        planData.projections = Array.from({ length: years + 1 }, (_, i) => {
          const year = i;
          const value = Math.round(startValue * Math.pow(1 + (defaultCAGR / 100), year));
          const realValue = Math.round(value / Math.pow(1 + inflation, year));
          
          return { year, value, realValue };
        });
        
        console.log('[aiService] Generated projections for', planData.projections.length, 'years');
      }
      
      return planData;
    } catch (jsonError) {
      console.error('[aiService] JSON parsing error:', jsonError.message);
      console.error('[aiService] Raw text sample:', generatedText.substring(0, 200));
      console.error('[aiService] Raw text end:', generatedText.substring(Math.max(0, generatedText.length - 200)));
      
      // Generate a complete fallback plan with proper data structures
      // This ensures the frontend will always have the expected data format
      const fallbackPlan = createFallbackFinancialPlan(userGoals, analyticsSummary, marketContext);
      console.log('[aiService] Created fallback plan with all required fields');
      return fallbackPlan;
    }
  } catch (error) {
    console.error('Error generating financial plan with Gemini:', error.message);
    if (error.response) {
      console.error('Gemini response status:', error.response.status);
      console.error('Gemini response data:', error.response.data);
    }
    
    // Create a complete fallback plan
    const fallbackPlan = createFallbackFinancialPlan(userGoals, analyticsSummary, marketContext);
    console.log('[aiService] Created fallback plan due to API error');
    return fallbackPlan;
  }
}

// Helper function to create a complete fallback plan with all required fields
function createFallbackFinancialPlan(userGoals, analyticsSummary, marketContext) {
  const { planningRegion, riskTolerance, investmentHorizon } = userGoals;
  
  // Get detailed strategies using the enhanced strategy service
  const detailedStrategies = strategyService.generateDetailedStrategies(planningRegion, riskTolerance, userGoals);
  
  // Get detailed benchmark data
  let enhancedMarketContext = marketContext;
  
  // If market context is missing or incomplete, generate detailed benchmarks
  if (!marketContext?.benchmarks?.primary || !marketContext?.benchmarks?.secondary) {
    console.log('[aiService] Market context incomplete, generating detailed benchmarks');
    enhancedMarketContext = strategyService.generateDetailedBenchmarks(planningRegion);
  }
  
  // Get detailed ESOP strategy
  const detailedEsopStrategy = strategyService.generateDetailedEsopStrategy(planningRegion, riskTolerance, analyticsSummary, userGoals);
  
  // Calculate downside risk metrics
  const downsideMetrics = strategyService.calculateDownsideMetrics(planningRegion, riskTolerance, enhancedMarketContext);
  
  // Get risk-appropriate values for allocation and CAGR
  // Dynamically calculated from benchmark data (no hardcoded caps)
  let equityAllocation, bondAllocation, alternativesAllocation;
  let expectedCAGR;
  
  // Get base CAGR from market context or use conservative default
  const baseCagr = enhancedMarketContext?.benchmarks?.primary?.cagr || 11.0;
  
  if (riskTolerance === 'low') {
    equityAllocation = 40;
    bondAllocation = 50;
    alternativesAllocation = 10;
    expectedCAGR = baseCagr * 0.75;  // 75% of benchmark for conservative approach
  } else if (riskTolerance === 'medium') {
    equityAllocation = 60;
    bondAllocation = 30;
    alternativesAllocation = 10;
    expectedCAGR = baseCagr * 0.95;  // 95% of benchmark for balanced approach
  } else { // high
    equityAllocation = 75;
    bondAllocation = 15;
    alternativesAllocation = 10;
    expectedCAGR = baseCagr * 1.05;  // 105% of benchmark for aggressive approach
  }

  // Generate projections
  const inflation = (enhancedMarketContext?.inflationRate || (planningRegion === 'india' ? 6.0 : 3.5)) / 100;
  const startValue = 100000; // Default starting value
  const years = investmentHorizon || 10;
  
  const projections = Array.from({ length: years + 1 }, (_, i) => {
    const year = i;
    const value = Math.round(startValue * Math.pow(1 + (expectedCAGR / 100), year));
    const realValue = Math.round(value / Math.pow(1 + inflation, year));
    
    return { year, value, realValue };
  });
  
  // Create implementation steps based on the ESOP strategy's action steps
  const implementationSteps = detailedEsopStrategy.actionSteps.map(step => ({
    step: step.step,
    action: step.details,
    isCompleted: false,
    timeline: step.timeline
  }));
  
  // Add a general investment step if needed
  if (implementationSteps.length < 4) {
    implementationSteps.push({
      step: 'Review & Rebalance', 
      action: 'Review portfolio performance and rebalance to target allocation.', 
      isCompleted: false, 
      timeline: 'Every 6 months'
    });
  }
  
  // Format the strategies with detailed advice
  const formattedStrategies = detailedStrategies.map(strategy => ({
    title: strategy.title,
    description: strategy.description,
    examples: strategy.examples,
    allocation: strategy.allocation,
    detailedAdvice: strategy.detailedAdvice
  }));
  
  // Create the final plan with all enhancements
  return {
    title: `Your ${riskTolerance.charAt(0).toUpperCase() + riskTolerance.slice(1)}-Risk Financial Plan for ${planningRegion.toUpperCase()}`,
    description: `A personalized financial strategy for ${planningRegion.toUpperCase()} investors with ${riskTolerance} risk tolerance.`,
    summary: `This plan is designed for ${planningRegion === 'us' ? 'US' : 'Indian'} investors with a ${riskTolerance} risk profile and ${investmentHorizon}-year investment horizon. It focuses on ${riskTolerance === 'high' ? 'growth-oriented investments' : riskTolerance === 'medium' ? 'balanced growth and income' : 'capital preservation and steady income'}.`,
    allocation: [
      { name: 'Equities', value: equityAllocation },
      { name: 'Bonds', value: bondAllocation },
      { name: 'Alternatives', value: alternativesAllocation }
    ],
    strategies: formattedStrategies,
    esopStrategy: detailedEsopStrategy,
    projections: projections,
    implementationSteps: implementationSteps,
    marketContext: enhancedMarketContext,
    downsideAnalysis: downsideMetrics
  };
}

module.exports = {
  generateFinancialPlan,
};

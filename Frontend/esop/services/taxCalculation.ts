export interface TaxCalculationResult {
  bargainElement: number
  shortTermGain: number
  longTermGain: number
  totalTax: number
  netProceeds: number
}

export function calculateEsopTax(
  quantity: number,
  strikePrice: number,
  fmv: number,
  salePrice: number,
  region: 'india' | 'us'
): TaxCalculationResult {
  const bargainElement = (fmv - strikePrice) * quantity
  const totalGain = (salePrice - strikePrice) * quantity
  const shortTermGain = Math.max(0, (salePrice - fmv) * quantity)
  const longTermGain = Math.max(0, totalGain - bargainElement - shortTermGain)

  let totalTax = 0

  if (region === 'india') {
    // Simplified Indian tax calculation
    // Perquisite tax on bargain element (assuming 30% tax bracket)
    const perquisiteTax = bargainElement * 0.30
    
    // Short term capital gains (15%)
    const stcg = shortTermGain * 0.15
    
    // Long term capital gains (10% on gains above 1 lakh)
    const ltcgExemption = 100000
    const taxableLTCG = Math.max(0, longTermGain - ltcgExemption)
    const ltcg = taxableLTCG * 0.10

    totalTax = perquisiteTax + stcg + ltcg
  } else {
    // Simplified US tax calculation (assuming 24% ordinary income + 15% capital gains)
    const ordinaryIncomeTax = bargainElement * 0.24
    const capitalGainsTax = (shortTermGain * 0.24) + (longTermGain * 0.15)
    totalTax = ordinaryIncomeTax + capitalGainsTax
  }

  const netProceeds = (salePrice * quantity) - totalTax

  return {
    bargainElement,
    shortTermGain,
    longTermGain,
    totalTax,
    netProceeds,
  }
}

export function estimateAnnualTax(
  annualIncome: number,
  region: 'india' | 'us'
): number {
  if (region === 'india') {
    // Simplified Indian tax slabs
    if (annualIncome <= 250000) return 0
    if (annualIncome <= 500000) return (annualIncome - 250000) * 0.05
    if (annualIncome <= 1000000) return 12500 + (annualIncome - 500000) * 0.20
    return 112500 + (annualIncome - 1000000) * 0.30
  } else {
    // Simplified US tax (24% effective rate for middle income)
    return annualIncome * 0.24
  }
}

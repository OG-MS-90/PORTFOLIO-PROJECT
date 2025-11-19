import { StockData } from '@/types/esop'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function getStockQuote(ticker: string): Promise<StockData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/stock/${ticker}`, {
      credentials: 'include',
    })

    if (!response.ok) {
      console.error(`Failed to fetch stock data for ${ticker}`)
      return null
    }

    return response.json()
  } catch (error) {
    console.error(`Error fetching stock data for ${ticker}:`, error)
    return null
  }
}

export async function getRealTimeQuotes(tickers: string[]): Promise<Record<string, StockData>> {
  const results: Record<string, StockData> = {}

  await Promise.all(
    tickers.map(async (ticker) => {
      const data = await getStockQuote(ticker)
      if (data) {
        results[ticker] = data
      }
    })
  )

  return results
}

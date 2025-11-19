# ESOP Analytics Engine v2.0

## Overview

The ESOP Analytics Engine is a comprehensive backend-driven system that computes Unrealized P&L, Realized P&L, Post-Tax P&L, Inflation-adjusted P&L, CAGR, and generates structured chart data for analytics visualization.

**Key Principle: NO HARDCODED VALUES**

All tax rates, inflation rates, FX rates, and market prices are fetched dynamically from APIs and trusted data sources.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CSV Input / Database                      │
│  (ticker, company, grantDate, quantity, vested, prices...)   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Region Detection & Validation                   │
│  • Auto-detect India vs USA from ticker format              │
│  • Validate all tickers belong to same region                │
│  • Reject mixed-region datasets                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│           Dynamic Data Fetching (Parallel)                   │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │  Tax Rates   │  │  Inflation    │  │   FX Rates      │  │
│  │ (RBI/IRS)    │  │ (World Bank)  │  │ (Multi-source)  │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Live Market Prices (Yahoo Finance)           │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 Calculation Engine                           │
│  • Unrealized P&L  (Vested/Exercised)                       │
│  • Realized P&L    (Sold)                                    │
│  • Tax             (Region-specific)                         │
│  • Post-Tax P&L                                              │
│  • Inflation-adjusted P&L                                    │
│  • CAGR            (Individual & Portfolio)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Chart Data Generators                           │
│  • ESOPs per Year                                            │
│  • Realized P&L Timeline                                     │
│  • Multi-line P&L Chart                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  JSON Response                               │
│  {region, currency, fxRate, totals, perRow, charts, meta}   │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. Region Detection

**Auto-detect market from ticker format:**

- **India**: Tickers ending with `.NS` (NSE), `.BO` (BSE), or known Indian companies
- **USA**: Standard tickers (AAPL, MSFT, GOOGL, etc.) or NASDAQ/NYSE symbols

**Validation:**
- Ensures all tickers in CSV belong to the same region
- Rejects mixed-region uploads with clear error message
- No manual region selection required

### 2. Dynamic Data Providers

#### Tax Rate Provider (`taxRateProvider.js`)

Fetches real-time tax rates:

**India:**
- STCG: 15% + surcharge + cess
- LTCG: 12.5% on gains
- Holding period: 12 months
- Perquisite tax for bargain element
- STT (Securities Transaction Tax)

**USA:**
- Short-term: Federal rates (10-37%)
- Long-term: 0%, 15%, 20%
- NIIT: 3.8% on investment income
- State tax (configurable)
- AMT for ISO exercise

#### Inflation Provider (`inflationProvider.js`)

Fetches CPI data from:
- World Bank API
- Federal Reserve (FRED) for US
- RBI data for India
- Multiple fallback sources

#### FX Rate Provider (`fxRateProvider.js`)

Fetches USD-INR rates from:
1. ExchangeRate-API (primary)
2. FreeCurrencyAPI
3. CurrencyAPI.com
4. Yahoo Finance
5. XE.com (fallback)

5-minute cache for real-time accuracy.

### 3. Price Fetching

**Live market data with fallbacks:**

1. **Primary**: Yahoo Finance real-time quotes
2. **Fallback**: CSV-provided `currentPrice`
3. **Error**: Mark row inactive, exclude from P&L

### 4. Calculations

#### Unrealized P&L

For status = `Vested` OR `Exercised` (unsold):

```
vestedShares = vested
costBasis = exercisePrice × vestedShares
currentValue = livePrice × vestedShares
unrealizedPnL = currentValue - costBasis
```

**Can be negative** (underwater options allowed).

#### Realized P&L

For status = `Sold`:

```
realizedPnL = (salePrice × quantity) - (exercisePrice × quantity)
```

#### Taxation

**Dynamic calculation based on:**
- Region (India/USA)
- Holding period (STCG vs LTCG)
- Total income (for surcharge/brackets)

```
holdingPeriod = today - grantDate

India:
  if holdingPeriod < 12 months → STCG (15%)
  else → LTCG (12.5%)

USA:
  if holdingPeriod < 12 months → Short-term (ordinary income rates)
  else → Long-term (0%, 15%, 20%)

tax = PnL × effectiveRate
```

#### Post-Tax P&L

```
postTaxPnL = unrealizedPnL - tax
```

#### Inflation-Adjusted P&L

```
inflationAdjustedPnL = postTaxPnL / (1 + inflationRate)^years
```

#### CAGR

**Individual:**

```
startValue = exercisePrice
endValue = livePrice
yearsHeld = (today - vestingStartDate) / 365

CAGR = (endValue / startValue)^(1/yearsHeld) - 1
```

**Portfolio:**

```
portfolioCAGR = Σ(CAGR_i × invested_i) / Σ(totalInvested)
```

Only includes Vested/Exercised. Excludes Sold and Unvested.

### 5. Chart Data

#### ESOPs Per Year

```javascript
{
  year: 2021,
  quantity: 500
}
```

Grouped by `grantDate` year.

#### Realized P&L Timeline

```javascript
{
  month: "2024-03",
  realizedPnL: 15000
}
```

Grouped by `saleDate` (YYYY-MM).

#### Multi-line P&L Chart

```javascript
{
  year: 2021,
  rawUnrealizedPnL: 50000,
  postTaxPnL: 40000,
  inflationAdjustedPnL: 37500
}
```

Shows progression over years.

## API Endpoints

### POST `/api/analytics/compute`

Compute analytics from uploaded CSV.

**Request:**
```http
POST /api/analytics/compute
Content-Type: multipart/form-data

file: [CSV file]
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "region": "india",
    "baseCurrency": "INR",
    "fxRate": 83.25,
    "totals": {
      "totalUnrealizedPnL": 125000,
      "totalRealizedPnL": 50000,
      "totalPnL": 175000,
      "totalTax": 26250,
      "totalPostTaxPnL": 148750,
      "inflationAdjustedPnL": 140000,
      "portfolioCAGR": 15.5
    },
    "perRowCalculations": [...],
    "charts": {
      "esopsPerYear": [...],
      "realizedPnLTimeline": [...],
      "unrealizedVsPostTaxVsInflation": [...]
    },
    "meta": {
      "taxRatesUsed": {...},
      "inflationRate": 5.5,
      "priceFetchTimestamp": "2024-01-20T10:30:00Z",
      "fxTimestamp": "2024-01-20T10:25:00Z"
    }
  }
}
```

### GET `/api/analytics/from-db`

Compute analytics from user's stored ESOP data.

**Request:**
```http
GET /api/analytics/from-db
Cookie: session_token=...
```

**Response:** Same as `/compute`

### POST `/api/analytics/validate-csv`

Validate CSV schema and detect region without full computation.

**Request:**
```http
POST /api/analytics/validate-csv
Content-Type: multipart/form-data

file: [CSV file]
```

**Response:**
```json
{
  "status": "success",
  "validation": {
    "isValid": true,
    "rowCount": 7,
    "schema": {
      "headers": ["ticker", "company", ...],
      "missingColumns": [],
      "extraColumns": []
    },
    "region": {
      "region": "india",
      "isValid": true,
      "isMixed": false,
      "summary": {
        "totalTickers": 7,
        "indiaTickers": 7,
        "usaTickers": 0
      }
    }
  }
}
```

## CSV Schema

```csv
ticker,company,grantDate,vestingStartDate,vestingEndDate,quantity,vested,strikePrice,exercisePrice,currentPrice,status,type,salePrice,saleDate,notes
```

**Required Columns:**
- `ticker`: Stock symbol
- `company`: Company name
- `grantDate`: Grant date (YYYY-MM-DD)
- `vestingStartDate`: Vesting start (YYYY-MM-DD)
- `vestingEndDate`: Vesting end (YYYY-MM-DD)
- `quantity`: Total shares granted
- `vested`: Shares vested
- `strikePrice`: Strike price
- `exercisePrice`: Exercise/purchase price
- `status`: Unvested | Vested | Exercised | Sold
- `type`: Stock Option | RSU | ESPP | SAR

**Optional Columns:**
- `currentPrice`: Current market price (fallback if live fetch fails)
- `salePrice`: Sale price (required if status = Sold)
- `saleDate`: Sale date (required if status = Sold)
- `notes`: Additional notes

## Status Behavior

| Status | Unrealized P&L | Realized P&L | CAGR | Tax |
|--------|----------------|--------------|------|-----|
| **Unvested** | ✖ | ✖ | ✖ | ✖ |
| **Vested** | ✔ | ✖ | ✔ | ✔ |
| **Exercised** | ✔ | ✖ | ✔ | ✔ |
| **Sold** | ✖ | ✔ | ✖ | ✔ |

## Error Handling

### MarketMixingError

```json
{
  "status": "error",
  "message": "CSV contains tickers from multiple regions",
  "code": "MIXED_REGIONS",
  "details": {
    "indiaTickers": ["TCS.NS", "INFY.NS"],
    "usaTickers": ["AAPL", "MSFT"]
  }
}
```

### Invalid Schema

```json
{
  "status": "error",
  "message": "CSV missing required columns",
  "code": "INVALID_SCHEMA",
  "missingColumns": ["vestingStartDate", "exercisePrice"]
}
```

### No Price Data

Rows with no price data are marked `isActive: false` and excluded from totals.

## Environment Variables

Add to `.env`:

```bash
# FX Rate APIs (choose at least one)
EXCHANGERATE_API_KEY=your_key_here
FREECURRENCY_API_KEY=your_key_here
CURRENCYAPI_KEY=your_key_here

# Inflation Data
FRED_API_KEY=your_key_here  # Federal Reserve (US)
TRADING_ECONOMICS_API_KEY=your_key_here  # Fallback

# Market Data
FINANCIAL_MODELING_PREP_API_KEY=your_key_here  # Optional
```

## Integration

### Backend

```javascript
const { computeEsopAnalytics } = require('./services/esopAnalyticsEngine');

const csvData = [
  {
    ticker: 'AAPL',
    company: 'Apple Inc.',
    grantDate: '2021-03-15',
    // ... other fields
  }
];

const analytics = await computeEsopAnalytics(csvData);
```

### Frontend

```typescript
import { computeAnalyticsFromCsv, computeAnalyticsFromDb } from '@/services/analyticsEngine';

// From file upload
const analytics = await computeAnalyticsFromCsv(file);

// From stored data
const analytics = await computeAnalyticsFromDb();
```

## Testing

Test with provided templates:
- `public/templates/esop-template-india.csv`
- `public/templates/esop-template-usa.csv`

## Performance

- **Region detection**: < 1ms per ticker
- **Price fetching**: Parallel, ~2-3s for 10 tickers
- **Tax/inflation/FX**: Cached (1 hour TTL)
- **Total computation**: ~3-5s for typical portfolio

## Limitations

1. Only supports India and USA regions currently
2. State tax in USA uses median rate (should be user-configurable)
3. Inflation adjustment uses annual rate (monthly would be more accurate)
4. CAGR calculation assumes continuous compounding

## Future Enhancements

- [ ] Support for more regions (UK, Singapore, etc.)
- [ ] User-specific tax bracket configuration
- [ ] Historical price data for backdated calculations
- [ ] Monte Carlo simulations for projections
- [ ] Integration with brokerage APIs for auto-import

## License

MIT

## Support

For issues or questions, please contact the development team.


# ESOP Analytics Engine v2.0 - Integration Guide

## Overview

This guide provides complete instructions for integrating the ESOP Analytics Engine v2.0 into your application. The engine computes comprehensive ESOP analytics with **NO HARDCODED VALUES** - all tax rates, inflation rates, FX rates, and market prices are fetched dynamically.

## Table of Contents

1. [Architecture](#architecture)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [API Usage](#api-usage)
5. [CSV Schema](#csv-schema)
6. [Examples](#examples)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Analytics Page / Component                               │  │
│  │  • File upload or DB fetch                                │  │
│  │  • Display charts and metrics                             │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │  Analytics Service (analyticsEngine.ts)                   │  │
│  │  • computeAnalyticsFromCsv()                              │  │
│  │  • computeAnalyticsFromDb()                               │  │
│  │  • Helper functions                                       │  │
│  └────────────────┬─────────────────────────────────────────┘  │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    │ HTTP/REST
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│                      Backend (Node.js/Express)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes (/api/analytics/*)                            │  │
│  │  • POST /compute - from CSV upload                        │  │
│  │  • GET /from-db - from stored data                        │  │
│  │  • POST /validate-csv - validation only                   │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │  Analytics Engine (esopAnalyticsEngine.js)                │  │
│  │  • Region detection                                       │  │
│  │  • Dynamic data fetching                                  │  │
│  │  • Calculation engine                                     │  │
│  │  • Chart generation                                       │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │  Data Providers                                           │  │
│  │  • taxRateProvider.js - Dynamic tax rates                 │  │
│  │  • inflationProvider.js - CPI data                        │  │
│  │  • fxRateProvider.js - Exchange rates                     │  │
│  │  • regionDetector.js - Market detection                   │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │   External Data Sources    │
        │   • Yahoo Finance          │
        │   • World Bank API         │
        │   • Federal Reserve (FRED) │
        │   • ExchangeRate-API       │
        └───────────────────────────┘
```

## Backend Setup

### 1. Install Dependencies

The following dependencies are already included in `package.json`:

```json
{
  "dependencies": {
    "axios": "^1.3.0",
    "papaparse": "^5.4.1",
    "yahoo-finance2": "^3.10.1"
  }
}
```

### 2. Environment Variables

Create or update your `.env` file:

```bash
# Required: Yahoo Finance is used for market data (no key needed)

# Optional but recommended: FX Rate APIs (at least one)
EXCHANGERATE_API_KEY=your_exchangerate_api_key
FREECURRENCY_API_KEY=your_freecurrency_api_key
CURRENCYAPI_KEY=your_currencyapi_key

# Optional: Inflation data APIs
FRED_API_KEY=your_fred_api_key  # Federal Reserve Economic Data
TRADING_ECONOMICS_API_KEY=your_trading_economics_key  # Fallback

# Optional: Financial data (if not using Yahoo Finance)
FINANCIAL_MODELING_PREP_API_KEY=your_fmp_key
```

### 3. File Structure

Ensure the following files are in place:

```
backend/
├── services/
│   ├── esopAnalyticsEngine.js          # Main analytics engine
│   ├── marketDataService.js             # Market data (already exists)
│   └── dataProviders/
│       ├── taxRateProvider.js          # Dynamic tax rates
│       ├── inflationProvider.js        # CPI/inflation data
│       ├── fxRateProvider.js           # Exchange rates
│       └── regionDetector.js           # Region detection
├── routes/
│   ├── analyticsRoutes.js              # Analytics API routes
│   └── index.js                         # Updated with analytics routes
└── ANALYTICS-ENGINE-README.md          # Documentation
```

### 4. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend should be running on `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies

Already included in `package.json`:

```json
{
  "dependencies": {
    "recharts": "^2.x",  // For charts
    "react": "^18.x",
    "next": "^14.x"
  }
}
```

### 2. Environment Variables

Create or update `.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Optional: For development
NEXT_PUBLIC_DEBUG=true
```

### 3. File Structure

Ensure the following files are in place:

```
Frontend/esop/
├── types/
│   └── analytics.ts                     # TypeScript types
├── services/
│   └── analyticsEngine.ts               # API service
├── components/
│   └── AnalyticsEngineExample.tsx       # Example component
└── app/
    └── analytics/
        └── page.tsx                      # Analytics page
```

### 4. Start Frontend

```bash
cd Frontend/esop
npm install
npm run dev
```

Frontend should be running on `http://localhost:3000`

## API Usage

### 1. Compute Analytics from CSV Upload

**Endpoint:** `POST /api/analytics/compute`

**Request:**

```javascript
const formData = new FormData();
formData.append('file', csvFile);

const response = await fetch('http://localhost:5000/api/analytics/compute', {
  method: 'POST',
  body: formData,
  credentials: 'include'
});

const result = await response.json();
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

### 2. Compute Analytics from Database

**Endpoint:** `GET /api/analytics/from-db`

**Request:**

```javascript
const response = await fetch('http://localhost:5000/api/analytics/from-db', {
  method: 'GET',
  credentials: 'include',  // Required for authentication
  headers: {
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
```

**Response:** Same structure as `/compute`

### 3. Validate CSV

**Endpoint:** `POST /api/analytics/validate-csv`

**Request:**

```javascript
const formData = new FormData();
formData.append('file', csvFile);

const response = await fetch('http://localhost:5000/api/analytics/validate-csv', {
  method: 'POST',
  body: formData
});

const result = await response.json();
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

### Required Columns

```csv
ticker,company,grantDate,vestingStartDate,vestingEndDate,quantity,vested,strikePrice,exercisePrice,currentPrice,status,type,salePrice,saleDate,notes
```

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| ticker | string | ✔ | Stock ticker symbol (e.g., AAPL, TCS.NS) |
| company | string | ✔ | Company name |
| grantDate | date | ✔ | Date grant was awarded (YYYY-MM-DD) |
| vestingStartDate | date | ✔ | Vesting start date (YYYY-MM-DD) |
| vestingEndDate | date | ✔ | Vesting end date (YYYY-MM-DD) |
| quantity | number | ✔ | Total shares granted |
| vested | number | ✔ | Shares vested |
| strikePrice | number | ✔ | Strike/grant price |
| exercisePrice | number | ✔ | Exercise/purchase price |
| currentPrice | number | | Current market price (fallback if live fails) |
| status | enum | ✔ | Unvested \| Vested \| Exercised \| Sold |
| type | enum | ✔ | Stock Option \| RSU \| ESPP \| SAR |
| salePrice | number | | Sale price (required if status = Sold) |
| saleDate | date | | Sale date (required if status = Sold) |
| notes | string | | Additional notes |

### Example CSV (India)

```csv
ticker,company,grantDate,vestingStartDate,vestingEndDate,quantity,vested,strikePrice,exercisePrice,currentPrice,status,type,salePrice,saleDate,notes
TCS.NS,Tata Consultancy Services,2021-04-01,2021-04-01,2025-04-01,500,500,3200,3200,3850,Vested,Stock Option,,,Fully vested
INFY.NS,Infosys Limited,2020-01-15,2020-01-15,2024-01-15,1000,1000,1200,1200,1580,Exercised,Stock Option,,,Exercised but not sold
WIPRO.NS,Wipro Limited,2019-09-01,2019-09-01,2023-09-01,800,800,380,380,450,Sold,Stock Option,475,2024-03-15,Sold for profit
```

### Example CSV (USA)

```csv
ticker,company,grantDate,vestingStartDate,vestingEndDate,quantity,vested,strikePrice,exercisePrice,currentPrice,status,type,salePrice,saleDate,notes
AAPL,Apple Inc.,2021-03-15,2021-03-15,2025-03-15,500,500,150,150,228.50,Vested,RSU,,,Fully vested
MSFT,Microsoft Corporation,2020-06-01,2020-06-01,2024-06-01,300,300,220,220,415.75,Exercised,Stock Option,,,Exercised
AMZN,Amazon.com Inc.,2019-05-15,2019-05-15,2023-05-15,200,200,180,180,185.20,Sold,Stock Option,190,2024-01-20,Sold
```

Templates available in: `public/templates/`

## Examples

### Frontend: Using the Service

```typescript
import { computeAnalyticsFromCsv, formatCurrency } from '@/services/analyticsEngine';

// Upload CSV
const handleFileUpload = async (file: File) => {
  try {
    const analytics = await computeAnalyticsFromCsv(file);
    console.log('Total P&L:', formatCurrency(analytics.totals.totalPnL, analytics.baseCurrency));
    console.log('Portfolio CAGR:', analytics.totals.portfolioCAGR + '%');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// From database
import { computeAnalyticsFromDb } from '@/services/analyticsEngine';

const fetchAnalytics = async () => {
  try {
    const analytics = await computeAnalyticsFromDb();
    // Use analytics data
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

### Backend: Direct Usage

```javascript
const { computeEsopAnalytics } = require('./services/esopAnalyticsEngine');

const csvData = [
  {
    ticker: 'AAPL',
    company: 'Apple Inc.',
    grantDate: '2021-03-15',
    vestingStartDate: '2021-03-15',
    vestingEndDate: '2025-03-15',
    quantity: 500,
    vested: 500,
    strikePrice: 150,
    exercisePrice: 150,
    status: 'Vested',
    type: 'RSU'
  }
];

const analytics = await computeEsopAnalytics(csvData);
console.log('Region:', analytics.region);
console.log('Total P&L:', analytics.totals.totalPnL);
```

### Example Component

See `Frontend/esop/components/AnalyticsEngineExample.tsx` for a complete example React component.

## Testing

### 1. Test CSV Templates

Use the provided templates:

```bash
# India template
curl -X POST http://localhost:5000/api/analytics/compute \
  -F "file=@public/templates/esop-template-india.csv"

# USA template
curl -X POST http://localhost:5000/api/analytics/compute \
  -F "file=@public/templates/esop-template-usa.csv"
```

### 2. Test Region Detection

```bash
curl -X POST http://localhost:5000/api/analytics/validate-csv \
  -F "file=@public/templates/esop-template-india.csv"
```

Expected: `"region": "india", "isValid": true`

### 3. Test Mixed Region Error

Create a CSV with mixed tickers (e.g., AAPL and TCS.NS) and upload:

Expected: `"code": "MIXED_REGIONS"` error

### 4. Frontend Testing

```bash
cd Frontend/esop
npm run dev
```

Navigate to: `http://localhost:3000/analytics`

## Troubleshooting

### Issue: "Unable to fetch tax rates"

**Solution:** Tax rates are computed dynamically. Check:
1. Tax rate provider is fetching from configured sources
2. Fallback rates are being used if APIs are unavailable
3. Check console logs for specific API errors

### Issue: "Unable to fetch FX rates"

**Solution:** FX rates require at least one working API source:
1. Add `EXCHANGERATE_API_KEY` to `.env`
2. Or use Yahoo Finance fallback (no key needed)
3. Check console for which source is being used

### Issue: "No price data available"

**Solution:**
1. Check ticker format (e.g., use `TCS.NS` not `TCS` for Indian stocks)
2. Verify Yahoo Finance can fetch the ticker
3. Provide `currentPrice` in CSV as fallback

### Issue: "Mixed regions error"

**Solution:**
1. Ensure all tickers in CSV are from same region
2. Use `.NS` suffix for Indian stocks
3. Check `detectionResult` in error for details

### Issue: "CSV parsing failed"

**Solution:**
1. Verify CSV has all required columns
2. Check date format is YYYY-MM-DD
3. Ensure numeric fields contain valid numbers
4. Remove any special characters or extra quotes

### Issue: "Authentication required"

**Solution:**
1. Ensure user is logged in when using `/from-db` endpoint
2. Check `credentials: 'include'` is set in fetch
3. Verify session/auth middleware is working

## Additional Resources

- **Backend Documentation:** `backend/ANALYTICS-ENGINE-README.md`
- **API Reference:** See inline JSDoc comments in code
- **TypeScript Types:** `Frontend/esop/types/analytics.ts`
- **Example Component:** `Frontend/esop/components/AnalyticsEngineExample.tsx`

## Support

For issues or questions:
1. Check console logs (both frontend and backend)
2. Review error messages - they contain specific details
3. Verify environment variables are set correctly
4. Test with provided CSV templates first

## Next Steps

1. **Customize Tax Calculation:** Add user-specific income brackets
2. **Add More Regions:** Extend region detector for UK, Singapore, etc.
3. **Historical Analysis:** Add time-series analysis features
4. **Export Features:** Add PDF report generation
5. **Alerts:** Set up notifications for vesting events

---

**Version:** 2.0  
**Last Updated:** 2024-01-20  
**License:** MIT


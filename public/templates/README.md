# ESOP CSV Templates

This folder contains pre-formatted CSV templates for uploading ESOP data to the Financial Planning Dashboard.

---

## 📋 Available Templates

### 1. **Indian Market Template** (`esop-template-india.csv`)

**Use this template if:**
- Your ESOPs are granted by Indian companies
- Stock tickers are from NSE/BSE (e.g., TCS.NS, INFY.NS)
- Prices are in Indian Rupees (₹)

**Tax Rate:** 10% LTCG (Long-Term Capital Gains)

**Sample Stocks Included:**
- TCS.NS - Tata Consultancy Services
- INFY.NS - Infosys Limited
- HDFCBANK.NS - HDFC Bank Limited
- RELIANCE.NS - Reliance Industries
- WIPRO.NS - Wipro Limited
- ITC.NS - ITC Limited

---

### 2. **US Market Template** (`esop-template-usa.csv`)

**Use this template if:**
- Your ESOPs are granted by US companies
- Stock tickers are from NASDAQ/NYSE (e.g., AAPL, MSFT)
- Prices are in US Dollars ($)

**Tax Rate:** 22% Short-Term Capital Gains (default)

**Sample Stocks Included:**
- AAPL - Apple Inc.
- MSFT - Microsoft Corporation
- GOOGL - Alphabet Inc.
- AMZN - Amazon.com Inc.
- TSLA - Tesla Inc.
- META - Meta Platforms Inc.
- NVDA - NVIDIA Corporation

---

## 🔧 How to Use

1. **Download** the appropriate template for your market
2. **Open** the CSV file in Excel, Google Sheets, or any CSV editor
3. **Replace** the sample data with your actual ESOP records
4. **Keep** the header row (first row) exactly as is
5. **Save** the file as CSV format
6. **Upload** to the ESOP dashboard

---

## 📊 Field Descriptions

### Required Fields (Must be filled)

| Field | Description | Example |
|-------|-------------|---------|
| `ticker` | Stock symbol with market suffix | `AAPL` (US), `TCS.NS` (India) |
| `company` | Full company name | `Apple Inc.`, `Tata Consultancy Services` |
| `grantDate` | Date when options were granted | `2021-03-15` |
| `quantity` | Total number of shares granted | `1000` |
| `vested` | Number of shares currently vested | `500` (must be ≤ quantity) |
| `status` | Current status of the grant | `Vested`, `Unvested`, `Exercised`, `Sold` |

### Price Fields

| Field | Required? | Description | Example |
|-------|-----------|-------------|---------|
| `strikePrice` | Optional | Original strike/grant price | `150.00` |
| `exercisePrice` | **Required*** | Price you pay/paid to exercise | `150.00` |
| `currentPrice` | Optional** | Current market price | `228.50` |
| `salePrice` | If Sold | Price at which you sold shares | `250.00` |
| `saleDate` | If Sold | Date when shares were sold | `2024-01-20` |

**Notes:**
- **Required for Exercised/Sold shares*
- **If not provided, system will fetch live prices via API*

### Other Fields

| Field | Required? | Description |
|-------|-----------|-------------|
| `vestingStartDate` | Optional | When vesting begins |
| `vestingEndDate` | Optional | When vesting completes |
| `type` | Optional | Grant type (Stock Option, RSU, etc.) |
| `notes` | Optional | Any additional notes |

---

## ✅ Validation Rules

Your CSV must follow these rules to import successfully:

### 1. **Field Presence**
- ✅ All required fields must have values
- ✅ `exercisePrice` required for Exercised/Sold shares
- ✅ `salePrice` required for Sold shares

### 2. **Data Types**
- ✅ All price fields must be valid numbers
- ✅ `quantity` and `vested` must be positive integers
- ✅ Dates must be in `YYYY-MM-DD` format

### 3. **Business Rules**
- ✅ `vested` cannot exceed `quantity`
- ✅ Unvested status should have `vested = 0`
- ✅ Valid status values: `Vested`, `Unvested`, `Exercised`, `Sold`, `Expired`, `Lapsed`

### 4. **Market-Specific**
- ✅ Indian stocks: Use `.NS` (NSE) or `.BO` (BSE) suffix
- ✅ US stocks: Use standard ticker symbols (no suffix)

---

## 🎯 Status Guide

### **Unvested**
- Shares granted but not yet vested
- `vested = 0`
- No PnL impact yet

**Example:**
```csv
AAPL,Apple Inc.,2023-01-01,...,1000,0,150,150,,Unvested
```

### **Vested**
- Shares vested but not yet exercised
- `0 < vested ≤ quantity`
- Shows unrealized PnL

**Example:**
```csv
MSFT,Microsoft Corp.,2021-01-01,...,500,500,220,220,415.75,Vested
```

### **Exercised**
- Shares exercised but not sold
- `vested = quantity` (typically)
- Shows unrealized PnL based on current price

**Example:**
```csv
GOOGL,Alphabet Inc.,2020-01-01,...,300,300,120,120,142.30,Exercised
```

### **Sold**
- Shares exercised and sold
- Must include `salePrice` and `saleDate`
- Shows realized PnL

**Example:**
```csv
AMZN,Amazon.com Inc.,2019-01-01,...,200,200,180,180,,Sold,Stock Option,190,2024-01-20
```

---

## 💡 Common Scenarios

### Scenario 1: New Grant (Not Vested Yet)
```csv
ticker,company,grantDate,vestingStartDate,vestingEndDate,quantity,vested,strikePrice,exercisePrice,currentPrice,status
TSLA,Tesla Inc.,2024-01-01,2024-01-01,2028-01-01,500,0,250,250,,Unvested
```

### Scenario 2: Partially Vested
```csv
ticker,company,grantDate,vestingStartDate,vestingEndDate,quantity,vested,strikePrice,exercisePrice,currentPrice,status
AAPL,Apple Inc.,2022-01-01,2022-01-01,2026-01-01,1000,250,150,150,228.50,Vested
```
*Note: 250/1000 shares vested (25%)*

### Scenario 3: Fully Vested, In the Money
```csv
ticker,company,grantDate,vestingStartDate,vestingEndDate,quantity,vested,strikePrice,exercisePrice,currentPrice,status
MSFT,Microsoft Corp.,2020-01-01,2020-01-01,2024-01-01,500,500,220,220,415.75,Vested
```
*Note: Unrealized PnL = (415.75 - 220) × 500 = $97,875*

### Scenario 4: Exercised, Underwater
```csv
ticker,company,grantDate,vestingStartDate,vestingEndDate,quantity,vested,strikePrice,exercisePrice,currentPrice,status
AMZN,Amazon.com Inc.,2020-01-01,2020-01-01,2024-01-01,300,300,2100,2100,185.20,Exercised
```
*Note: Unrealized PnL = (185.20 - 2100) × 300 = -$574,440 (loss)*

### Scenario 5: Sold for Profit
```csv
ticker,company,grantDate,vestingStartDate,vestingEndDate,quantity,vested,strikePrice,exercisePrice,currentPrice,status,type,salePrice,saleDate
NVDA,NVIDIA Corp.,2020-01-01,2020-01-01,2024-01-01,250,250,95,95,,Sold,Stock Option,145,2024-06-15
```
*Note: Realized PnL = (145 - 95) × 250 = $12,500*

---

## 🚨 Common Mistakes to Avoid

### ❌ Wrong: Unvested but vested > 0
```csv
AAPL,Apple Inc.,2024-01-01,...,1000,500,150,150,,Unvested
```
**Issue:** Status says Unvested but vested = 500  
**Fix:** Either change status to `Vested` or set vested to `0`

### ❌ Wrong: Vested exceeds quantity
```csv
MSFT,Microsoft Corp.,2021-01-01,...,500,1000,220,220,,Vested
```
**Issue:** vested (1000) > quantity (500)  
**Fix:** Ensure vested ≤ quantity

### ❌ Wrong: Sold without sale price
```csv
GOOGL,Alphabet Inc.,2020-01-01,...,300,300,120,120,,Sold
```
**Issue:** Status is Sold but no salePrice  
**Fix:** Add salePrice and saleDate columns

### ❌ Wrong: Missing exercisePrice for Exercised shares
```csv
AMZN,Amazon.com Inc.,2020-01-01,...,200,200,180,,,Exercised
```
**Issue:** Exercised shares must have exercisePrice  
**Fix:** Fill in the exercisePrice field

---

## 🔍 Differences Between Indian & US Templates

| Aspect | Indian Template | US Template |
|--------|-----------------|-------------|
| **Ticker Format** | Suffix required (e.g., `.NS`, `.BO`) | No suffix (e.g., `AAPL`) |
| **Currency** | Indian Rupees (₹) | US Dollars ($) |
| **Price Range** | Typically ₹100 - ₹5,000 | Typically $10 - $500 |
| **Tax Rate** | 10% LTCG | 22% Short-term (default) |
| **Market Hours** | IST (9:15 AM - 3:30 PM) | EST (9:30 AM - 4:00 PM) |
| **Date Format** | Both use ISO: YYYY-MM-DD | Both use ISO: YYYY-MM-DD |

---

## 📞 Support

### If import fails:

1. **Check validation errors** - System will tell you which rows/fields are invalid
2. **Verify required fields** - Ensure all mandatory fields are filled
3. **Check data types** - Ensure numbers are numbers, not text
4. **Validate status values** - Must match exactly: Vested, Unvested, Exercised, Sold
5. **Review business rules** - vested ≤ quantity, dates in correct format

### Still having issues?

- Review the expected-calculations.md file in test-data folder
- Check that CSV encoding is UTF-8
- Ensure no extra commas or quotes in data
- Verify ticker symbols are valid (check Yahoo Finance)

---

## 📈 What Happens After Upload

Once your CSV is successfully imported:

1. **Validation** - System checks all required fields and business rules
2. **Normalization** - Data is cleaned and standardized
3. **Price Fetch** - If currentPrice missing, live prices are fetched via API
4. **PnL Calculation** - Realized and unrealized PnL computed using unified model
5. **Analytics** - Dashboard displays portfolio value, CAGR, tax estimates
6. **Charts** - Yearly performance and cost charts are generated

---

## ✨ Tips for Best Results

1. **Download fresh templates** - Don't reuse old templates (field requirements may change)
2. **Fill all required fields** - Even if values are estimated
3. **Use consistent date format** - Always YYYY-MM-DD
4. **Double-check ticker symbols** - Invalid tickers will cause API fetch failures
5. **Keep sale records** - If sold shares, always include salePrice and saleDate
6. **Review before upload** - Check for typos, missing values, formatting issues

---

## 🎓 Learning Resources

- **PnL Model Documentation** - See IMPLEMENTATION-SUMMARY.md
- **Validator Rules** - See backend/middleware/csvValidator.js
- **Expected Calculations** - See test-data/expected-calculations.md
- **Integration Guide** - See backend/INTEGRATION-GUIDE.md

---

**Last Updated:** November 17, 2025  
**Template Version:** 2.0 (Unified Investment Model)

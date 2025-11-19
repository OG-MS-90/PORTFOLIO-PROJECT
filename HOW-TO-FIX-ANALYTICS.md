# 🔴 HOW TO FIX THE ANALYTICS SHOWING LOSSES

## Problem

Your analytics page shows **₹17 million loss** because you're using an **incomplete CSV** that's missing required fields.

---

## ✅ Solution (5 Minutes)

### **Step 1: Download Correct Template**

1. Go to: **http://localhost:3000/esop-upload**
2. Click the **"Download Template"** button for your market:
   - **Indian Market** (NSE/BSE stocks in ₹)
   - **US Market** (NASDAQ/NYSE stocks in $)
3. Save the file

---

### **Step 2: Fill Out the Template**

Open the downloaded CSV in Excel or Google Sheets.

**KEEP THE HEADER ROW EXACTLY AS IS:**
```
ticker,company,grantDate,vestingStartDate,vestingEndDate,quantity,vested,strikePrice,exercisePrice,currentPrice,status,type,salePrice,saleDate,notes
```

**Replace the sample data rows with YOUR ESOP data.**

---

### **Step 3: Critical Fields to Fill**

| Field | Required? | What to Put | Example |
|-------|-----------|-------------|---------|
| `ticker` | ✅ YES | Stock symbol | `AAPL` or `TCS.NS` |
| `company` | ✅ YES | Company name | `Apple Inc.` |
| `grantDate` | ✅ YES | Date granted (YYYY-MM-DD) | `2021-03-15` |
| `quantity` | ✅ YES | Total shares granted | `1000` |
| **`vested`** | ✅ **YES** | **Shares currently vested** | `500` or `0` |
| `status` | ✅ YES | Share status | `Vested`, `Unvested`, `Exercised`, `Sold` |
| **`exercisePrice`** | ✅ **YES** | **Your cost price** | `150.00` |
| `strikePrice` | Optional | Original strike price | `150.00` |
| `currentPrice` | Optional* | Current market price | `228.50` (or leave blank) |
| `salePrice` | If sold | Sale price | `250.00` |

**\*If you leave `currentPrice` blank, the system will fetch live prices automatically.**

---

### **Step 4: Important Rules**

#### **A. For `vested` Field:**

```
If status = "Unvested" → vested = 0
If status = "Vested" → vested = (some number ≤ quantity)
If status = "Exercised" → vested = quantity
If status = "Sold" → vested = quantity
```

**Example:**
```csv
AAPL,Apple Inc.,2023-01-01,2023-01-01,2027-01-01,1000,0,150,150,,Unvested
     Granted 1000, but ZERO vested yet ↑
```

#### **B. For `status` Field:**

Valid values (case-sensitive):
- `Vested` - Shares vested but not exercised
- `Unvested` - Shares not vested yet
- `Exercised` - You exercised but didn't sell
- `Sold` - You sold the shares
- `Expired` - Options expired
- `Lapsed` - Options lapsed

---

### **Step 5: Upload the Fixed CSV**

1. Save your file as CSV (not Excel .xlsx!)
2. Go back to: **http://localhost:3000/esop-upload**
3. Click **"Choose File"** or drag & drop
4. Wait for "Success!" message
5. You'll be redirected to analytics

---

## 📊 What You Should See After Upload

### **If Your Portfolio is Profitable:**
```
Total Gain/Loss: +₹X,XXX,XXX (GREEN)
├─ Realized (Sold): ₹XXX
└─ Unrealized (Holdings): ₹XXX

CAGR: +X.XX% (GREEN)
```

### **If Your Portfolio Has Losses:**
```
Total Gain/Loss: -₹X,XXX,XXX (RED)
├─ Realized (Sold): -₹XXX or ₹0
└─ Unrealized (Holdings): -₹XXX (underwater options)

This is CORRECT if your exercise price > current price
```

---

## 🔍 Quick Validation Checklist

Before uploading, check your CSV:

- [ ] Header row is complete and unchanged
- [ ] Every row has a value for `vested`
- [ ] `vested ≤ quantity` for all rows
- [ ] Unvested shares have `vested = 0`
- [ ] All dates are in `YYYY-MM-DD` format
- [ ] All numbers are actual numbers (not text)
- [ ] Status values match exactly (case-sensitive)

---

## 🐛 Common Mistakes

### ❌ **Mistake 1: Missing `vested` Column**
```csv
ticker,company,grantDate,quantity,status
AAPL,Apple,2023-01-01,1000,Unvested
```
**Problem:** No `vested` field → System treats all 1000 as vested  
**Fix:** Add `vested` column with correct values

### ❌ **Mistake 2: Wrong `vested` Value**
```csv
ticker,company,grantDate,quantity,vested,status
AAPL,Apple,2023-01-01,1000,1000,Unvested
```
**Problem:** Status says Unvested but vested=1000  
**Fix:** If Unvested, set `vested=0`

### ❌ **Mistake 3: No `exercisePrice`**
```csv
ticker,company,grantDate,quantity,vested,strikePrice,status
AAPL,Apple,2023-01-01,1000,500,150,Vested
```
**Problem:** Missing `exercisePrice` column  
**Fix:** Add `exercisePrice` (usually same as strikePrice)

---

## 🎯 Example: Correct CSV

```csv
ticker,company,grantDate,vestingStartDate,vestingEndDate,quantity,vested,strikePrice,exercisePrice,currentPrice,status,type,salePrice,saleDate,notes
AAPL,Apple Inc.,2021-03-15,2021-03-15,2025-03-15,1000,1000,150,150,228.50,Vested,RSU,,,Fully vested
MSFT,Microsoft Corp.,2022-01-10,2022-01-10,2026-01-10,500,250,220,220,415.75,Vested,Stock Option,,,50% vested
GOOGL,Alphabet Inc.,2023-06-01,2023-06-01,2027-06-01,200,0,120,120,142.30,Unvested,RSU,,,Not vested yet
TSLA,Tesla Inc.,2020-05-15,2020-05-15,2024-05-15,300,300,180,180,248.50,Exercised,Stock Option,,,Exercised but not sold
AMZN,Amazon.com Inc.,2019-03-01,2019-03-01,2023-03-01,150,150,185,185,,Sold,Stock Option,195,2024-01-15,Sold for profit
```

**This will show:**
- AAPL: Unrealized profit (228.50 - 150) × 1000 = **+$78,500**
- MSFT: Unrealized profit (415.75 - 220) × 250 = **+$48,937**
- GOOGL: No PnL (not vested yet)
- TSLA: Unrealized profit (248.50 - 180) × 300 = **+$20,550**
- AMZN: Realized profit (195 - 185) × 150 = **+$1,500**

**Total: ~$149,487 profit** ✅

---

## 🆘 Still Showing Losses?

If you uploaded the correct CSV and still see losses, it means:

1. **Your options are actually underwater** (current price < exercise price)
   - This is CORRECT behavior
   - Example: Exercise price ₹2100, Current price ₹185 = Loss

2. **You have many exercised shares that are now underwater**
   - This is REAL loss
   - System is showing the truth

3. **Data entry errors**
   - Double-check exercise prices
   - Verify current prices
   - Make sure quantities are correct

---

## 📞 Quick Test

Want to test if it's working?

1. Download the template
2. **DON'T change the sample data**
3. Upload it as-is
4. You should see **profits** for most stocks

If the samples show profits → Your system works!  
If the samples show losses → Something's wrong, contact support

---

**Last Updated:** November 17, 2025  
**Template Version:** 2.0 (Unified Investment Model)

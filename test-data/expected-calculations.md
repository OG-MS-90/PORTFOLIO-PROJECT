# EXPECTED CALCULATIONS FOR CORRECTED TEST CSV
## PRD Version 2.0 - Unified Investment Model

Based on the corrected CSV with current prices as of Nov 17, 2025.

---

## 📊 INPUT DATA SUMMARY

| Ticker | Quantity | Vested | Status | Strike | Exercise | Current | Notes |
|--------|----------|--------|--------|--------|----------|---------|-------|
| AAPL | 1000 | 0 | Unvested | $150 | $150 | $228.50 | Not vested yet |
| MSFT | 500 | 500 | Vested | $220 | $220 | $415.75 | Fully vested, profitable |
| GOOG | 200 | 0 | Unvested | $1800 | $1800 | $142.30 | Underwater (unvested) |
| AMZN | 300 | 300 | Exercised | $2100 | $2100 | $185.20 | Exercised, not sold |

---

## 🧮 DETAILED CALCULATIONS

### **1. AAPL (Apple) - Unvested**

```
Status: Unvested
Quantity: 1000
Vested: 0
Exercise Price: $150
Current Price: $228.50

Calculations:
- Cost: $150 × 0 = $0
- Current Value: $228.50 × 0 = $0
- Unrealized PnL: ($228.50 - $150) × 0 = $0
- Realized PnL: $0 (not sold)

Contribution to Portfolio:
- Total Cost: $0
- Total Value: $0
- Total PnL: $0
```

**Why:** Unvested shares don't contribute to any PnL yet.

---

### **2. MSFT (Microsoft) - Vested, In The Money**

```
Status: Vested
Quantity: 500
Vested: 500
Exercise Price: $220
Current Price: $415.75

Calculations:
- Cost: $220 × 500 = $110,000
- Current Value: $415.75 × 500 = $207,875
- Unrealized PnL: ($415.75 - $220) × 500 = $97,875
- Realized PnL: $0 (not sold)

Contribution to Portfolio:
- Total Cost: $110,000
- Total Value: $207,875
- Total Unrealized PnL: $97,875
```

**Why:** Vested but unexercised options have unrealized profit.

---

### **3. GOOG (Alphabet) - Unvested, Underwater**

```
Status: Unvested
Quantity: 200
Vested: 0
Exercise Price: $1800
Current Price: $142.30

Calculations:
- Cost: $1800 × 0 = $0
- Current Value: $142.30 × 0 = $0
- Unrealized PnL: ($142.30 - $1800) × 0 = $0
- Realized PnL: $0 (not sold)

Contribution to Portfolio:
- Total Cost: $0
- Total Value: $0
- Total PnL: $0
```

**Why:** Even though underwater, unvested shares don't contribute.

**Note:** If this were vested, it would show:
- Unrealized PnL = ($142.30 - $1800) × 200 = **-$331,540** (negative!)

---

### **4. AMZN (Amazon) - Exercised, Not Sold, Underwater**

```
Status: Exercised
Quantity: 300
Vested: 300 (all exercised)
Exercise Price: $2100
Current Price: $185.20

Calculations:
- Cost: $2100 × 300 = $630,000
- Current Value: $185.20 × 300 = $55,560
- Unrealized PnL: ($185.20 - $2100) × 300 = -$574,440
- Realized PnL: $0 (not sold yet)

Contribution to Portfolio:
- Total Cost: $630,000
- Total Value: $55,560
- Total Unrealized PnL: -$574,440
```

**Why:** Exercised but unsold shares are treated as unrealized.  
User paid $630k but current value is only $55k → **massive unrealized loss**.

---

## 📋 PORTFOLIO TOTALS

### **Cost Basis:**
```
AAPL:  $0
MSFT:  $110,000
GOOG:  $0
AMZN:  $630,000
─────────────────
TOTAL: $740,000
```

### **Current Value:**
```
AAPL:  $0
MSFT:  $207,875
GOOG:  $0
AMZN:  $55,560
─────────────────
TOTAL: $263,435
```

### **Unrealized PnL:**
```
AAPL:  $0
MSFT:  +$97,875
GOOG:  $0
AMZN:  -$574,440
─────────────────
TOTAL: -$476,565
```

### **Realized PnL:**
```
All shares: $0 (nothing sold)
```

### **Total PnL:**
```
Realized + Unrealized = $0 + (-$476,565) = -$476,565
```

---

## 🎯 EXPECTED UI VALUES

### **Top PnL Card:**
```
Total Gain/Loss: -$476,565 (RED)
├─ Realized (Sold): $0
└─ Unrealized (Holdings): -$476,565 (RED)
```

### **Tax Card:**
```
Estimated Tax: $0
Region: India · Rate: 10%
Tax on realized gains only · Net: -$476,565
```

**Why tax = $0:** No realized PnL, and unrealized is negative.

### **Avg Growth Rate (CAGR):**

```
Total Exercise Cost: $740,000
Total Current Value: $263,435
Earliest Grant: AMZN (2020-05-15)
Growth Years: ~4.5 years

CAGR = ((263,435 / 740,000)^(1/4.5)) - 1
     = (0.3559^0.2222) - 1
     = 0.7739 - 1
     = -0.2261
     = -22.61%

Display: -22.61% (RED)
```

**Why negative:** Portfolio lost 77% of value → negative compound growth.

### **Unrealized PnL Card (Bottom):**
```
Unrealized PnL: -$476,565 (RED)
Loss on vested unexercised + exercised unsold options
= (current price - exercise price) × vested shares
```

**This MUST match top card unrealized value.**

### **Exercise Cost Card:**
```
Exercise Cost: $740,000
Cost basis for vested + exercised options
= exercise price × (vested + exercised) shares
⚠ Options underwater - consider waiting
```

---

## ✅ VALIDATION CHECKLIST

### **A. Data Integrity:**
- [ ] All required fields present (ticker, vested, exercisePrice, currentPrice, status)
- [ ] vested ≤ quantity for all rows
- [ ] Unvested shares have vested = 0
- [ ] Status values are valid

### **B. PnL Calculations:**
- [ ] Unvested shares contribute $0 to PnL ✅
- [ ] MSFT shows +$97,875 unrealized (in the money) ✅
- [ ] AMZN shows -$574,440 unrealized (underwater) ✅
- [ ] Total unrealized = -$476,565 ✅
- [ ] Total realized = $0 ✅

### **C. Cost & Value:**
- [ ] Total cost = $740,000 ✅
- [ ] Total value = $263,435 ✅
- [ ] PnL % = -64.40% ✅

### **D. CAGR:**
- [ ] CAGR = -22.61% (negative growth) ✅
- [ ] Uses exercise cost as denominator ✅
- [ ] Excludes expired/lapsed shares ✅

### **E. UI Consistency:**
- [ ] Top card unrealized = Bottom card unrealized ✅
- [ ] Tax = $0 (no realized gains) ✅
- [ ] All charts use same PnL values ✅

---

## 🧪 SCENARIO VARIATIONS (for additional testing)

### **Scenario 1: Add a Sold Share**

Add this row to CSV:
```csv
TSLA,Tesla Inc.,2019-01-15,2019-01-15,2023-01-15,100,100,180,180,250,Sold,Stock Option,250
```

Where last field is `salePrice = 250`.

**Expected:**
```
Realized PnL = (250 - 180) × 100 = $7,000
Tax (India 10%) = $7,000 × 0.10 = $700
Total PnL = $7,000 + (-$476,565) = -$469,565
```

### **Scenario 2: Vest GOOG Shares**

Change GOOG row:
```csv
GOOG,Alphabet Inc.,2023-01-10,...,200,200,1800,1800,142.30,Vested,...
```

**Expected:**
```
GOOG Unrealized = (142.30 - 1800) × 200 = -$331,540
Total Unrealized = $97,875 + (-$574,440) + (-$331,540) = -$808,105
```

### **Scenario 3: All Underwater**

Set all current prices below exercise:
```
AAPL: current = 140 (below 150)
MSFT: current = 200 (below 220)
GOOG: current = 140 (below 1800)
AMZN: current = 185 (below 2100)
```

**Expected:** All unrealized PnL negative, total PnL deeply negative.

---

## 🔥 COMMON FAILURE MODES TO TEST

### **Failure 1: Missing vested field**
```
Old behavior: vested = quantity (WRONG)
AAPL would show: unrealized = $78,500 (WRONG)
Should show: unrealized = $0
```

### **Failure 2: Using strike instead of exercise**
```
If exercisePrice missing and fallback to strike:
AMZN could use wrong price if repriced
```

### **Failure 3: Intrinsic value instead of PnL**
```
Old behavior: AMZN unrealized = max(0, 185 - 2100) × 300 = $0
New behavior: AMZN unrealized = (185 - 2100) × 300 = -$574,440
```

---

## 📊 YEARLY AGGREGATION

### **2020:**
```
AMZN: cost=$630k, value=$55k, unrealizedPnL=-$574k
```

### **2021:**
```
MSFT: cost=$110k, value=$208k, unrealizedPnL=+$98k
```

### **2022:**
```
AAPL: cost=$0, value=$0, unrealizedPnL=$0
```

### **2023:**
```
GOOG: cost=$0, value=$0, unrealizedPnL=$0
```

**Chart should show:**
- 2020: huge negative PnL
- 2021: positive PnL
- 2022-2023: zero (unvested)

---

## ✨ SUCCESS CRITERIA

When you upload this corrected CSV:

1. ✅ **No validation errors**
2. ✅ **Top card unrealized = -$476,565**
3. ✅ **Bottom card unrealized = -$476,565** (MATCH!)
4. ✅ **CAGR = -22.61%**
5. ✅ **Exercise cost = $740,000**
6. ✅ **Tax = $0**
7. ✅ **Total PnL % = -64.40%**

If all 7 match → **Unified Model A is working perfectly** ✨

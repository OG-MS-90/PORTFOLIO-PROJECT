# CSV VALIDATOR INTEGRATION GUIDE
## How to integrate csvValidator.js into your ESOP upload flow

---

## 📦 **Step 1: Install the Validator**

The validator is now at:
```
backend/middleware/csvValidator.js
```

---

## 🔌 **Step 2: Update Upload Route**

### **Before (without validation):**
```javascript
// routes/esop.js
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const records = req.body.records;
    // Save directly to DB (RISKY!)
    await Esop.insertMany(records);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
```

### **After (with validation):**
```javascript
// routes/esop.js
const { csvValidationMiddleware, normalizeCSV } = require('../middleware/csvValidator');

router.post(
  '/upload',
  authMiddleware,
  csvValidationMiddleware,  // ← Add this
  async (req, res) => {
    try {
      const records = req.body.records;
      
      // Normalize records (clean up data types, apply defaults)
      const normalizedRecords = normalizeCSV(records);
      
      // Add userId to each record
      const recordsWithUser = normalizedRecords.map(r => ({
        ...r,
        userId: req.user.id,
      }));
      
      // Save to database
      await Esop.insertMany(recordsWithUser);
      
      // Return validation warnings if any
      res.json({
        status: 'success',
        message: `${records.length} records imported successfully`,
        warnings: req.csvValidation.warnings,
        summary: req.csvValidation.summary,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);
```

---

## 🎨 **Step 3: Frontend Error Handling**

### **Handle validation errors in upload UI:**

```typescript
// Frontend: services/esopUpload.ts
export async function uploadCSV(records: any[]) {
  const response = await fetch('/api/esop/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  });
  
  const data = await response.json();
  
  if (response.status === 400) {
    // Validation failed
    return {
      success: false,
      errors: data.errors,
      warnings: data.warnings,
      summary: data.summary,
    };
  }
  
  if (data.status === 'success') {
    return {
      success: true,
      warnings: data.warnings,
      summary: data.summary,
    };
  }
  
  throw new Error(data.message);
}
```

---

## 🖼️ **Step 4: Display Validation Results**

### **UI Component for errors:**

```tsx
// components/CSVValidationResults.tsx
export function CSVValidationResults({ errors, warnings, summary }) {
  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded p-4">
        <h3 className="text-green-800 font-semibold">✅ Validation Passed</h3>
        <p className="text-green-700 mt-2">
          {summary.validRecords} / {summary.totalRecords} records are valid
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h3 className="text-red-800 font-semibold">❌ Validation Errors</h3>
          <p className="text-red-700 text-sm mt-2">
            {errors.length} errors found. Please fix them before importing.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-red-600 list-disc list-inside">
            {errors.slice(0, 10).map((error, i) => (
              <li key={i}>{error}</li>
            ))}
            {errors.length > 10 && (
              <li className="font-semibold">...and {errors.length - 10} more</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4">
          <h3 className="text-amber-800 font-semibold">⚠️ Warnings</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-700 list-disc list-inside">
            {warnings.slice(0, 5).map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
            {warnings.length > 5 && (
              <li className="font-semibold">...and {warnings.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <h3 className="text-gray-800 font-semibold">📊 Summary</h3>
        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
          <div>
            <span className="text-gray-600">Total Records:</span>
            <span className="ml-2 font-semibold">{summary.totalRecords}</span>
          </div>
          <div>
            <span className="text-gray-600">Valid Records:</span>
            <span className="ml-2 font-semibold text-green-600">{summary.validRecords}</span>
          </div>
          <div>
            <span className="text-gray-600">Invalid Records:</span>
            <span className="ml-2 font-semibold text-red-600">{summary.invalidRecords}</span>
          </div>
        </div>
        
        {/* Status distribution */}
        {Object.keys(summary.statusDistribution).length > 0 && (
          <div className="mt-4">
            <h4 className="text-gray-700 font-medium text-sm">Status Distribution:</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(summary.statusDistribution).map(([status, count]) => (
                <span
                  key={status}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                >
                  {status}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🧪 **Step 5: Test with Corrected CSV**

Use the provided test CSV:
```
test-data/corrected-test.csv
```

### **Expected behavior:**

#### **✅ PASS - All validation checks:**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    "Row 1: No currentPrice or fmv provided. Will attempt live API fetch for 'AAPL'.",
    "Row 2: No currentPrice or fmv provided. Will attempt live API fetch for 'MSFT'."
  ],
  "summary": {
    "totalRecords": 4,
    "validRecords": 4,
    "invalidRecords": 0,
    "statusDistribution": {
      "Unvested": 2,
      "Vested": 1,
      "Exercised": 1
    }
  }
}
```

---

## 🚨 **Step 6: Test with Bad CSV (Original)**

Use the original test CSV (missing vested, exercisePrice, currentPrice):

### **Expected behavior:**

#### **❌ FAIL - Validation errors:**
```json
{
  "isValid": false,
  "errors": [
    "Row 1: Missing required field 'vested'",
    "Row 2: Missing required field 'vested'",
    "Row 3: Missing required field 'vested'",
    "Row 4: Missing required field 'vested'",
    "Row 4: exercisePrice is REQUIRED for Exercised/Sold shares"
  ],
  "warnings": [
    "Row 1: No currentPrice or fmv provided. Will attempt live API fetch for 'AAPL'.",
    "Row 1: No exercisePrice provided. Using strikePrice=150 as fallback.",
    ...
  ],
  "summary": {
    "totalRecords": 4,
    "validRecords": 0,
    "invalidRecords": 4,
    "missingFields": {
      "vested": 4
    }
  }
}
```

**Frontend should BLOCK import and show error list.**

---

## 📝 **Step 7: Update Frontend Upload Flow**

### **Complete upload sequence:**

```tsx
// app/esop-upload/page.tsx
const handleUpload = async (csvData) => {
  setLoading(true);
  setValidationResults(null);
  
  try {
    const result = await uploadCSV(csvData);
    
    if (!result.success) {
      // Show validation errors
      setValidationResults({
        errors: result.errors,
        warnings: result.warnings,
        summary: result.summary,
      });
      return;
    }
    
    // Success - show warnings if any
    if (result.warnings.length > 0) {
      toast.warning(`Import successful with ${result.warnings.length} warnings`);
    } else {
      toast.success(`${csvData.length} records imported successfully`);
    }
    
    // Redirect to analytics
    router.push('/analytics');
    
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## ✅ **Validation Rules Reference**

### **Required Fields:**
- `ticker` - Stock symbol
- `company` - Company name
- `grantDate` - Grant date
- `quantity` - Total shares granted
- `vested` - Currently vested shares
- `status` - One of: Vested, Unvested, Exercised, Sold, Expired, Lapsed

### **Conditionally Required:**
- `exercisePrice` - Required for Exercised/Sold status
- `salePrice` - Required for Sold status

### **Business Rules:**
- `vested <= quantity`
- Unvested status → vested should be 0
- Vested/Exercised/Sold → vested should be > 0
- All numeric fields >= 0

---

## 🎯 **Success Criteria**

After integration:

1. ✅ Bad CSVs are rejected with clear error messages
2. ✅ Users see what's wrong and how to fix it
3. ✅ Good CSVs import smoothly with optional warnings
4. ✅ No more fallback logic producing wrong PnL values
5. ✅ Analytics page shows correct values matching expected calculations

---

## 🔧 **Troubleshooting**

### **Issue: "All records invalid"**
- Check that CSV has `vested` column
- Verify `exercisePrice` for Exercised/Sold rows
- Ensure status values match exactly (case-sensitive)

### **Issue: "Too many warnings"**
- Warnings are OK - they indicate fallbacks or assumptions
- Add `currentPrice` column to reduce warnings
- Add `exercisePrice` column to reduce warnings

### **Issue: "Import succeeds but PnL still wrong"**
- Check that backend is using unified Model A
- Verify `calculatePortfolioPerformance` uses new logic
- Check frontend is consuming backend values (not recalculating)

---

**Next:** Upload the corrected CSV and verify all 7 success criteria from `expected-calculations.md`.

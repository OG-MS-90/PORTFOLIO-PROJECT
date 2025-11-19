# CSV Template Download Integration Guide

## How to add CSV template download to your ESOP upload page

---

## 📦 Step 1: Component is Ready

The `CSVTemplateDownload` component is already created at:
```
Frontend/esop/components/CSVTemplateDownload.tsx
```

---

## 🔌 Step 2: Add to Upload Page

### **Option A: Full Page with Template Download**

```tsx
// app/esop-upload/page.tsx
"use client"

import { useState } from 'react'
import { CSVTemplateDownload } from '@/components/CSVTemplateDownload'
import { Upload, FileUp } from 'lucide-react'

export default function EsopUploadPage() {
  const [showTemplates, setShowTemplates] = useState(true)
  const [csvData, setCsvData] = useState(null)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <FileUp className="h-8 w-8 text-blue-600" />
          Upload ESOP Data
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Import your ESOP records from a CSV file
        </p>
      </div>

      {/* Toggle between templates and upload */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setShowTemplates(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showTemplates
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📋 Download Templates
        </button>
        <button
          onClick={() => setShowTemplates(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !showTemplates
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📤 Upload CSV
        </button>
      </div>

      {/* Show templates or upload form */}
      {showTemplates ? (
        <CSVTemplateDownload />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-8">
          {/* Your existing upload form here */}
          <input type="file" accept=".csv" />
          {/* ... rest of upload logic */}
        </div>
      )}
    </div>
  )
}
```

---

### **Option B: Tabs Layout**

```tsx
// app/esop-upload/page.tsx
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CSVTemplateDownload } from '@/components/CSVTemplateDownload'
import { Upload, Download } from 'lucide-react'

export default function EsopUploadPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Templates
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload CSV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <CSVTemplateDownload />
        </TabsContent>

        <TabsContent value="upload">
          {/* Your existing upload form */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

### **Option C: Modal/Dialog**

```tsx
// app/esop-upload/page.tsx
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CSVTemplateDownload } from '@/components/CSVTemplateDownload'
import { Download } from 'lucide-react'

export default function EsopUploadPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Existing upload form */}
      <div className="mb-4 flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="h-4 w-4" />
              Download CSV Templates
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>CSV Templates</DialogTitle>
            </DialogHeader>
            <CSVTemplateDownload />
          </DialogContent>
        </Dialog>
      </div>

      {/* Rest of your upload form */}
    </div>
  )
}
```

---

### **Option D: Inline in Upload Form (Recommended)**

```tsx
// app/esop-upload/page.tsx
"use client"

import { CSVTemplateDownload } from '@/components/CSVTemplateDownload'

export default function EsopUploadPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upload ESOP Data</h1>
        <p className="text-gray-600 mt-2">Import your ESOP records from a CSV file</p>
      </div>

      {/* Step 1: Download Template */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Step 1: Download Template</h2>
        <CSVTemplateDownload />
      </section>

      {/* Step 2: Upload Your CSV */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Step 2: Upload Your CSV</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-8">
          {/* Your existing upload form */}
        </div>
      </section>
    </div>
  )
}
```

---

## 🎨 Step 3: Customize (Optional)

### **Change Button Colors:**

```tsx
// In CSVTemplateDownload.tsx
// Indian template button (change from orange to your brand color)
className="w-full ... bg-orange-600 hover:bg-orange-700 ..."
// Change to:
className="w-full ... bg-indigo-600 hover:bg-indigo-700 ..."
```

### **Add Analytics Tracking:**

```tsx
const downloadTemplate = (market: 'india' | 'usa') => {
  // Track download event
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'template_download', {
      event_category: 'ESOP',
      event_label: market,
    });
  }
  
  // Existing download logic...
}
```

### **Add Success Toast:**

```tsx
import { toast } from 'sonner' // or your toast library

const downloadTemplate = (market: 'india' | 'usa') => {
  // Download logic...
  
  toast.success(`${market === 'india' ? 'Indian' : 'US'} template downloaded successfully!`, {
    description: 'Open the file and replace sample data with your ESOP records',
  });
}
```

---

## 📋 Step 4: Verify Template Files

Ensure these files exist in the correct location:

```
Frontend/esop/
├── public/
│   └── templates/
│       ├── esop-template-india.csv   ✅
│       ├── esop-template-usa.csv     ✅
│       └── README.md                 ✅
└── components/
    └── CSVTemplateDownload.tsx       ✅
```

If templates are in a different location, update the download path:

```tsx
// In CSVTemplateDownload.tsx
const downloadTemplate = (market: 'india' | 'usa') => {
  const filename = market === 'india' ? 'esop-template-india.csv' : 'esop-template-usa.csv';
  
  // Update this path to match your public folder structure
  link.href = `/templates/${filename}`;  // Default
  // OR
  link.href = `/static/templates/${filename}`;  // If in static folder
  // OR
  link.href = `/assets/csv/${filename}`;  // If in assets folder
}
```

---

## 🧪 Step 5: Test

### **Test Template Downloads:**

1. Visit upload page
2. Click "Download Indian Template"
3. Verify file downloads as `esop-template-india.csv`
4. Open file in Excel/Google Sheets
5. Confirm sample data is present
6. Repeat for US template

### **Test Upload Flow:**

1. Download Indian template
2. Edit 1-2 rows with real data
3. Save as CSV
4. Upload to system
5. Verify no validation errors
6. Check analytics page shows correct data

---

## 🎯 Expected User Flow

```
User visits upload page
    ↓
Sees template download section
    ↓
Downloads appropriate template (India/US)
    ↓
Opens template in Excel/Google Sheets
    ↓
Replaces sample data with actual ESOP records
    ↓
Saves as CSV
    ↓
Returns to upload page
    ↓
Uploads modified CSV
    ↓
System validates data
    ↓
If valid → imports and shows success
If invalid → shows errors with specific row/field info
    ↓
User fixes errors and re-uploads
    ↓
Success → redirected to analytics page
```

---

## ⚡ Quick Start Example

If you want to add this NOW with minimal changes:

```tsx
// Add this single line to your upload page
import { CSVTemplateDownload } from '@/components/CSVTemplateDownload'

// Then add anywhere in your JSX:
<CSVTemplateDownload />
```

That's it! The component is self-contained and styled.

---

## 🎨 Styling Customization

The component uses Tailwind CSS. To match your design system:

### **Dark Mode:**
Already included - uses `dark:` variants

### **Custom Colors:**
Search and replace in `CSVTemplateDownload.tsx`:
- `orange-` → your primary color for Indian template
- `blue-` → your primary color for US template
- `green-` → your success color

### **Custom Fonts:**
Add to your global CSS:
```css
.csv-template-download {
  font-family: 'Your Custom Font', sans-serif;
}
```

---

## 🔧 Troubleshooting

### **Templates not downloading:**

**Issue:** Files not found (404)  
**Fix:** Verify files are in `public/templates/` folder

**Issue:** Download triggers but file is empty  
**Fix:** Check file encoding is UTF-8

### **Template has wrong data:**

**Issue:** Sample data doesn't match your needs  
**Fix:** Edit the CSV files in `public/templates/` directly

### **Styling looks broken:**

**Issue:** Tailwind classes not working  
**Fix:** Ensure Tailwind is configured in your project

---

## 📦 Component Dependencies

Required UI components (if using shadcn/ui):
```bash
npx shadcn-ui@latest add card
```

Required icons (Lucide React):
```bash
npm install lucide-react
```

If you're not using shadcn/ui, replace Card components with your own:
```tsx
// Replace:
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// With your own:
<div className="rounded-lg border bg-card p-6">
  <h3 className="font-semibold mb-4">{/* title */}</h3>
  {/* content */}
</div>
```

---

## ✅ Final Checklist

- [ ] CSVTemplateDownload.tsx is in components folder
- [ ] Template CSV files are in public/templates folder
- [ ] Component is imported in upload page
- [ ] Download buttons work and trigger file downloads
- [ ] Templates open correctly in Excel/Google Sheets
- [ ] Sample data is visible and realistic
- [ ] Field names match validator requirements
- [ ] Tested upload with modified template
- [ ] Validation works correctly
- [ ] Analytics page shows correct values

---

**You're all set!** Users can now download properly formatted CSV templates. 🎉

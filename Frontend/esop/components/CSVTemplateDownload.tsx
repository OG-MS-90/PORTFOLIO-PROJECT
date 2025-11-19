"use client"

import { Download, FileSpreadsheet, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * CSV Template Download Component
 * Provides downloadable ESOP CSV templates for Indian and US markets
 */
export function CSVTemplateDownload() {
  const downloadTemplate = (market: 'india' | 'usa') => {
    const filename = market === 'india' 
      ? 'esop-template-india.csv' 
      : 'esop-template-usa.csv';
    
    const link = document.createElement('a');
    link.href = `/templates/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">

      <div className="grid md:grid-cols-2 gap-4">
        {/* Indian Market */}
        <Card className="bg-[#0f0f17] border-orange-500/30 hover:border-orange-500/60 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Indian Market</h3>
              <p className="text-sm text-gray-400">NSE/BSE stocks in INR (₹)</p>
            </div>

            <div className="bg-[#0a0a12] rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-2">Includes sample data for:</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded">TCS</span>
                <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded">Infosys</span>
                <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded">HDFC</span>
                <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded">+3 more</span>
              </div>
            </div>

            <button
              onClick={() => downloadTemplate('india')}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
          </CardContent>
        </Card>

        {/* US Market */}
        <Card className="bg-[#0f0f17] border-blue-500/30 hover:border-blue-500/60 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">US Market</h3>
              <p className="text-sm text-gray-400">NASDAQ/NYSE stocks in USD ($)</p>
            </div>

            <div className="bg-[#0a0a12] rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-2">Includes sample data for:</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">AAPL</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">MSFT</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">GOOGL</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">+4 more</span>
              </div>
            </div>

            <button
              onClick={() => downloadTemplate('usa')}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips - Collapsed */}
      <details className="bg-[#0f0f17] border border-[#252532]/40 rounded-lg">
        <summary className="p-4 cursor-pointer text-sm font-medium text-gray-300 hover:text-white flex items-center gap-2">
          <Info className="h-4 w-4 text-amber-500" />
          Need help? Click for quick tips
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-3 text-sm text-gray-400 border-t border-[#252532]/40">
          <p>✓ Download the template for your market</p>
          <p>✓ Replace sample data with your ESOP records</p>
          <p>✓ Keep the header row unchanged</p>
          <p>✓ Save as CSV and upload above</p>
        </div>
      </details>
    </div>
  );
}

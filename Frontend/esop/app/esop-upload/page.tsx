"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEsopData } from '@/contexts/EsopDataContext'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { CSVTemplateDownload } from '@/components/CSVTemplateDownload'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function EsopUploadPage() {
  const router = useRouter()
  const { refetch } = useEsopData()
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/csv/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      setSuccess(true)
      await refetch(true)
      
      // Redirect after short delay to show success message
      setTimeout(() => {
        router.push('/analytics')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0e] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Upload ESOP Data
          </h1>
          <p className="text-gray-400">
            Download a template, fill it out, and upload to get started
          </p>
        </div>

        {/* Step 1: Download Template */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">1</span>
            Choose Your Market Template
          </h2>
          <CSVTemplateDownload />
        </section>

        {/* Step 2: Upload CSV */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">2</span>
            Upload Your File
          </h2>

          <Card className="bg-[#0f0f17] border-[#252532]/30">
            <CardContent className="p-6">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  uploading 
                    ? 'border-amber-500/50 bg-amber-500/5' 
                    : success
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-[#252532]/50 hover:border-amber-500/50 bg-[#090a10]/50'
                }`}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const event = { target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>
                    handleFileUpload(event)
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                {success ? (
                  <>
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-green-500">Success!</h3>
                    <p className="text-sm text-gray-400">
                      Redirecting to analytics...
                    </p>
                  </>
                ) : uploading ? (
                  <>
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="animate-spin h-8 w-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full"></div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Uploading...</h3>
                    <p className="text-sm text-gray-400">
                      Processing your file
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1 text-white">Drop file here or click to browse</h3>
                    <p className="text-xs text-gray-500 mb-6">
                      Accepts .csv files only
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      disabled={uploading || success}
                      className="hidden"
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload" 
                      className="cursor-pointer inline-block"
                    >
                      <div className="bg-amber-500 hover:bg-amber-600 text-black font-medium px-6 py-2.5 rounded-lg inline-flex items-center gap-2 transition-colors">
                        <FileUp className="h-4 w-4" />
                        Choose File
                      </div>
                    </label>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-gray-300">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

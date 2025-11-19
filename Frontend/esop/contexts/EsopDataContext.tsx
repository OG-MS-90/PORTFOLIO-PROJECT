"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { EsopRecord } from '@/types/esop'
import { authorizedFetch } from '@/lib/authClient'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface EsopDataContextType {
  data: EsopRecord[]
  isLoading: boolean
  error: string | null
  refetch: (bypassCache?: boolean) => Promise<void>
  lastUpdated: Date | null
  updateEsopStatus: (id: string, status: string, setSoldDate?: boolean) => void
  updateEsopSoldDate: (id: string, soldDate: string | null) => void
}

const EsopDataContext = createContext<EsopDataContextType | undefined>(undefined)

export function EsopDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EsopRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [forceRefresh, setForceRefresh] = useState<number>(0)
  
  const fetchData = useCallback(async (bypassCache = false) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const cacheBuster = bypassCache ? `?_t=${Date.now()}` : ''
      const response = await authorizedFetch(`${API_BASE_URL}/csv/data${cacheBuster}`, { 
        headers: {
          'Accept': 'application/json',
          'Cache-Control': bypassCache ? 'no-cache, no-store' : ''
        }
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result || !result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid data format received from server')
      }
      
      // Load status updates from localStorage
      const updatesRaw = localStorage.getItem('esopStatusUpdates')
      let updates: { id: string; status: string; updatedAt: string }[] = []
      try {
        updates = updatesRaw ? JSON.parse(updatesRaw) : []
      } catch {}
      
      // Load sold date updates from localStorage
      const soldDatesRaw = localStorage.getItem('esopSoldDates')
      let soldDates: Record<string, string | null> = {}
      try {
        soldDates = soldDatesRaw ? JSON.parse(soldDatesRaw) : {}
      } catch {}
      
      // Merge all updates into the data
      const merged = (result.data as EsopRecord[]).map((r) => {
        const u = updates.find((x) => x.id === r._id)
        const soldDate = soldDates[r._id] || null
        
        return {
          ...r,
          status: u ? u.status : r.status,
          soldDate: soldDate || r.soldDate
        }
      })
      setData(merged)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching ESOP data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchData(true)
  }, [fetchData, forceRefresh])
  
  const refetch = useCallback(async (bypassCache = true) => {
    await fetchData(bypassCache)
    setForceRefresh(prev => prev + 1)
  }, [fetchData])

  const updateEsopStatus = useCallback((id: string, status: string, setSoldDate: boolean = false) => {
    setData(prev => prev.map(r => {
      if (r._id === id) {
        if (status === 'Sold' && setSoldDate) {
          return { ...r, status, soldDate: new Date().toISOString() }
        }
        return { ...r, status }
      }
      return r
    }))
    
    const updatesRaw = localStorage.getItem('esopStatusUpdates')
    let currentUpdates: { id: string; status: string; updatedAt: string }[] = []
    try {
      currentUpdates = updatesRaw ? JSON.parse(updatesRaw) : []
    } catch {}
    
    const next = [...currentUpdates.filter(u => u.id !== id), { id, status, updatedAt: new Date().toISOString() }]
    localStorage.setItem('esopStatusUpdates', JSON.stringify(next))
    setLastUpdated(new Date())
  }, [])

  const updateEsopSoldDate = useCallback((id: string, soldDate: string | null) => {
    setData(prev => prev.map(r => {
      if (r._id === id) {
        if (soldDate && r.status !== 'Sold') {
          return { ...r, soldDate, status: 'Sold' }
        }
        return { ...r, soldDate }
      }
      return r
    }))
    
    const storageKey = 'esopSoldDates'
    const storedDates = JSON.parse(localStorage.getItem(storageKey) || '{}')
    storedDates[id] = soldDate
    localStorage.setItem(storageKey, JSON.stringify(storedDates))
    
    setLastUpdated(new Date())
  }, [])
  
  return (
    <EsopDataContext.Provider value={{
      data,
      isLoading,
      error,
      refetch,
      lastUpdated,
      updateEsopStatus,
      updateEsopSoldDate
    }}>
      {children}
    </EsopDataContext.Provider>
  )
}

export function useEsopData() {
  const context = useContext(EsopDataContext)
  
  if (context === undefined) {
    throw new Error('useEsopData must be used within an EsopDataProvider')
  }
  
  return context
}

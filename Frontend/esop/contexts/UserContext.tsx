"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { authorizedFetch, clearAuthToken } from '@/lib/authClient'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface User {
  id: number
  name: string
  email: string
  profilePic: string
  hasSeenWelcome?: boolean
}

interface UserContextType {
  user: User | null
  loading: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setHasSeenWelcome: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authorizedFetch(`${API_BASE_URL}/auth/user`)
        if (response.ok) {
          const userData = await response.json()
          login(userData)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const login = (userData: User) => {
    setUser({
      ...userData,
      hasSeenWelcome: userData.hasSeenWelcome || false
    })
  }

  const logout = () => {
    clearAuthToken()
    setUser(null)
  }

  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedData })
    }
  }

  const setHasSeenWelcome = () => {
    if (user) {
      setUser({
        ...user,
        hasSeenWelcome: true
      })
      localStorage.setItem('hasSeenWelcome', 'true')
    }
  }

  useEffect(() => {
    if (user && !user.hasSeenWelcome && localStorage.getItem('hasSeenWelcome') === 'true') {
      setUser({
        ...user,
        hasSeenWelcome: true
      })
    }
  }, [user?.id])

  return (
    <UserContext.Provider value={{ user, loading, login, logout, updateUser, setHasSeenWelcome }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

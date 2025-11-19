"use client"

import { usePathname } from 'next/navigation'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import { useUser } from '@/contexts/UserContext'

// Routes where sidebar should never appear
const routesWithoutSidebar = ['/', '/login', '/signup', '/auth/callback']

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()
  
  // Show sidebar only on protected routes (user logged in + not in excluded routes)
  const shouldShowSidebar = user && !routesWithoutSidebar.includes(pathname)
  
  return (
    <>
      {shouldShowSidebar && <SidebarNav />}
      <div className={shouldShowSidebar ? 'ml-64' : ''}>
        {children}
      </div>
    </>
  )
}

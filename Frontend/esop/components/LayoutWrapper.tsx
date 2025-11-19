"use client"

import { usePathname } from 'next/navigation'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import { useUser } from '@/contexts/UserContext'

const publicRoutes = ['/', '/login', '/signup']

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useUser()
  
  // Don't show sidebar on public routes if user is not logged in
  const showSidebar = user && !publicRoutes.includes(pathname)
  
  // Also show sidebar on home page if user is logged in
  const showSidebarOnHome = user && pathname === '/'
  
  const shouldShowSidebar = showSidebar || showSidebarOnHome
  
  return (
    <>
      {shouldShowSidebar && <SidebarNav />}
      <div className={shouldShowSidebar ? 'ml-64' : ''}>
        {children}
      </div>
    </>
  )
}

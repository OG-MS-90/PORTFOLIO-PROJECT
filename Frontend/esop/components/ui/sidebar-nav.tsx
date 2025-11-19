"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Upload, 
  BarChart3, 
  TrendingUp,
  Home,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  ChevronDown,
  Settings
} from 'lucide-react'
import { useState } from 'react'
import { Button } from './button'
import { useUser } from '@/contexts/UserContext'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload ESOP', href: '/esop-upload', icon: Upload },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Financial Planning', href: '/financial-planning', icon: TrendingUp },
]

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useUser()
  const [collapsed, setCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  const handleSignOut = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <>
      <div 
        className={cn(
          "fixed left-0 top-0 z-40 min-h-screen h-full border-r border-neutral-800 bg-[#020308] transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-800 px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/10 ring-1 ring-yellow-400/20">
                <TrendingUp className="h-5 w-5 text-yellow-400" />
              </div>
              <span className="text-lg font-bold text-yellow-400">
                ESOP Pro
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-gray-400 hover:bg-yellow-400/10 hover:text-yellow-400"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#2b2412] text-yellow-400"
                    : "text-gray-400 hover:bg-neutral-800/50 hover:text-gray-200"
                )}
              >
                <Icon 
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-yellow-400" : "text-gray-500 group-hover:text-gray-300"
                  )} 
                />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile Section */}
        <div className={cn(
          "flex-shrink-0 border-t border-neutral-800 bg-[#020308]",
          collapsed ? "p-2" : "p-4"
        )}>
          {collapsed ? (
            <button
              className="w-full flex justify-center p-2 hover:bg-neutral-800/30 rounded-full"
              onClick={() => setCollapsed(false)}
            >
              <User className="h-5 w-5 text-gray-400" />
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/30 transition-colors"
              >
                <div className="flex-shrink-0 h-9 w-9 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center text-black font-semibold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-white truncate">{user?.name || 'User'}</div>
                  <div className="text-xs text-gray-400 truncate">{user?.email || 'user@example.com'}</div>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-400 transition-transform",
                  userMenuOpen ? "transform rotate-180" : ""
                )} />
              </button>
              
              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0f0f17] border border-neutral-800 rounded-lg overflow-hidden shadow-xl">
                  <button 
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-neutral-800/50 transition-colors"
                    onClick={() => router.push('/settings')}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <div className="border-t border-neutral-800/60"></div>
                  <button 
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-neutral-800/50 transition-colors"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

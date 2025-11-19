"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { CardCanvas, Card } from "@/components/ui/animated-glow-card"
import { GlowingEffect } from "@/components/ui/glowing-effect"

function NavItem({
  label,
  hasDropdown,
}: {
  label: string
  hasDropdown?: boolean
}) {
  return (
    <div className="flex items-center text-sm text-gray-300 hover:text-white">
      <span>{label}</span>
      {hasDropdown && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      )}
    </div>
  )
}

function MobileNavItem({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white">
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-gray-400" />
    </div>
  )
}

export function Hero2() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Gradient background */}
      <div className="pointer-events-none absolute -right-60 -top-10 z-0 flex flex-col items-end blur-xl">
        <div className="h-[10rem] w-[60rem] rounded-full bg-gradient-to-b from-yellow-500 to-amber-500 blur-[6rem]" />
        <div className="h-[10rem] w-[90rem] rounded-full bg-gradient-to-b from-amber-600 to-yellow-300 blur-[6rem]" />
        <div className="h-[10rem] w-[60rem] rounded-full bg-gradient-to-b from-yellow-500 to-amber-400 blur-[6rem]" />
      </div>
      <div className="absolute inset-0 z-0 bg-noise opacity-30" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto mt-6 flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black">
              <span className="text-xs font-bold tracking-tight">EMS</span>
            </div>
            <span className="hidden text-sm font-bold tracking-tight text-white sm:inline-block">
              ESOP MANAGEMENT SYSTEM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <a 
              href="#product" 
              className="text-sm text-gray-300 transition-colors hover:text-white cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#product')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Product
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm text-gray-300 transition-colors hover:text-white cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              How it works
            </a>
            <a 
              href="#testimonials" 
              className="text-sm text-gray-300 transition-colors hover:text-white cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#testimonials')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Testimonials
            </a>
            <Link
              href="/login"
              className="flex h-10 items-center rounded-full bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90"
            >
              Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 md:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                    <span className="text-xs font-bold tracking-tight">EMS</span>
                  </div>
                  <span className="ml-2 text-sm font-bold uppercase tracking-tight text-white">
                    ESOP MANAGEMENT SYSTEM
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="mt-8 flex flex-col space-y-6">
                <MobileNavItem label="Product" />
                <MobileNavItem label="How it works" />
                <MobileNavItem label="Testimonials" />
                <MobileNavItem label="Pricing" />
                <div className="pt-4">
                  <Link
                    href="/login"
                    className="flex h-11 w-full items-center justify-center rounded-full border border-gray-700 text-sm font-medium text-white"
                  >
                    Log in
                  </Link>
                </div>
                <Link
                  href="/signup"
                  className="flex h-11 items-center justify-center rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90"
                >
                  Get started for free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        <a
          href="#product"
          onClick={(e) => {
            e.preventDefault()
            document.querySelector('#product')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="mx-auto mt-8 flex max-w-fit cursor-pointer items-center justify-center space-x-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105"
        >
          <span className="text-sm font-medium text-white">
            ESOP management, analytics & financial planning in one place
          </span>
          <ArrowRight className="h-4 w-4 text-white" />
        </a>

        {/* Hero content */}
        <div className="container mx-auto mt-12 px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mx-auto max-w-5xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white md:whitespace-nowrap"
          >
            Turn your ESOPs into a{' '}
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/80 align-middle">
              <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                REAL WEALTH PLAN.
              </span>
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg"
          >
            Upload your grants, understand vesting and taxes, and generate
            AI-powered investment plans after your ESOPs vest. Built for startup
            employees and founders.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            <Link
              href="/login"
              className="flex h-12 items-center rounded-full bg-white px-8 text-base font-medium text-black transition-all hover:scale-105 hover:bg-white/90"
            >
              Get started in 2 minutes
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex h-12 items-center rounded-full border border-gray-600 px-8 text-base font-medium text-white transition-all hover:scale-105 hover:bg-white/10"
            >
              Learn how it works
            </a>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            className="mx-auto mt-12 grid max-w-3xl gap-6 text-sm text-gray-300 sm:grid-cols-3"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Built for ESOPs
              </p>
              <p className="mt-1 text-base font-medium text-white">
                Vesting, FMV, taxes & exits
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                AI financial plans
              </p>
              <p className="mt-1 text-base font-medium text-white">
                Scenario planning for US & India
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Privacy-first
              </p>
              <p className="mt-1 text-base font-medium text-white">
                Your data stays with your account
              </p>
            </div>
          </motion.div>

          {/* ESOP Portfolio Snapshot Card with Animated Glow */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
            className="relative mx-auto my-16 w-full max-w-3xl"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-yellow-400/30 via-amber-400/30 to-yellow-500/30 blur-2xl" />
            <div className="relative rounded-xl p-1">
              <GlowingEffect
                spread={50}
                glow={true}
                disabled={false}
                proximity={100}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <CardCanvas>
                <Card>
                  <div className="relative rounded-xl border border-gray-800 bg-gradient-to-b from-gray-900/90 to-black/90 p-6 shadow-2xl backdrop-blur-sm">
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Snapshot
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      Your ESOP portfolio
                    </h3>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Total value</p>
                        <p className="mt-1 text-xl font-semibold text-white">
                          $480k
                        </p>
                        <p className="text-[11px] text-emerald-400">
                          ▲ 12.4% vs last year
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Vested</p>
                        <p className="mt-1 text-xl font-semibold text-white">
                          12,400
                        </p>
                        <p className="text-[11px] text-gray-400">shares</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Unvested</p>
                        <p className="mt-1 text-xl font-semibold text-white">
                          8,900
                        </p>
                        <p className="text-[11px] text-gray-400">shares</p>
                      </div>
                    </div>
                    <div className="mt-2 rounded-lg bg-white/5 p-3">
                      <p className="text-xs text-gray-400">Next milestone</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        2,400 shares vest in the next 6 months.
                      </p>
                    </div>
                  </div>
                  </div>
                </Card>
              </CardCanvas>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TestimonialsSection as MarqueeTestimonialsSection } from '@/components/ui/testimonials-with-marquee'
import { Hero2 } from '@/components/ui/hero-2-1'
import { GlowingEffect } from '@/components/ui/glowing-effect'
import { ArrowRight, TrendingUp, Upload, BarChart3, Github, Twitter, Linkedin, Mail } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

export default function HomePage() {
  const { user, loading } = useUser()
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-background">
      {/* Bottom left gradient glow */}
      <div className="pointer-events-none fixed bottom-0 left-0 z-0">
        <div className="h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-amber-600/12 via-yellow-700/8 to-transparent blur-[8rem]" />
      </div>
      
      <Hero2 />
      <main className="relative z-10 container mx-auto space-y-10 px-4 py-10">
        {/* Features Grid */}
        <section id="product" className="relative space-y-6">
          <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 text-left sm:text-center">
            <h2 className="bg-gradient-to-br from-white via-gray-100 to-gray-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">Everything you need for ESOP clarity</h2>
            <p className="text-base leading-relaxed text-gray-400 sm:text-lg">
              From upload to analytics to financial planning, ESOP Master is your single pane of glass for equity.
            </p>
          </div>

          <div className="relative z-10 grid gap-6 md:grid-cols-3">
            <div className="relative">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <Card className="group relative overflow-hidden border border-gray-800/60 bg-gradient-to-br from-gray-900/40 via-gray-950/60 to-gray-900/40 shadow-2xl shadow-black/50 backdrop-blur-sm transition-all duration-500 hover:border-amber-900/40 hover:shadow-amber-950/20 hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <CardHeader className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-900/20 via-amber-950/10 to-transparent ring-1 ring-amber-900/20 transition-all duration-300 group-hover:ring-amber-700/30">
                    <Upload className="h-6 w-6 text-amber-500/90 transition-all duration-300 group-hover:text-amber-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold tracking-tight text-gray-100">One-click ESOP upload</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-relaxed text-gray-500">
                    Import grants from CSV in seconds. We handle tickers, strike prices, vesting dates, and FMV.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href={user ? "/esop-upload" : "/login"}>
                    <Button variant="ghost" className="group/btn w-full justify-between text-sm font-medium text-gray-400 transition-all hover:bg-amber-950/10 hover:text-amber-500">
                      {user ? "Go to Upload" : "Sign in to upload"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="relative">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <Card className="group relative overflow-hidden border border-gray-800/60 bg-gradient-to-br from-gray-900/40 via-gray-950/60 to-gray-900/40 shadow-2xl shadow-black/50 backdrop-blur-sm transition-all duration-500 hover:border-amber-900/40 hover:shadow-amber-950/20 hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <CardHeader className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-900/20 via-amber-950/10 to-transparent ring-1 ring-amber-900/20 transition-all duration-300 group-hover:ring-amber-700/30">
                    <BarChart3 className="h-6 w-6 text-amber-500/90 transition-all duration-300 group-hover:text-amber-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold tracking-tight text-gray-100">Real-time ESOP analytics</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-relaxed text-gray-500">
                    See total value, vested vs unvested, and company-wise breakdown in a single dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href={user ? "/analytics" : "/login"}>
                    <Button variant="ghost" className="group/btn w-full justify-between text-sm font-medium text-gray-400 transition-all hover:bg-amber-950/10 hover:text-amber-500">
                      {user ? "Go to Analytics" : "Sign in to view analytics"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="relative">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <Card className="group relative overflow-hidden border border-gray-800/60 bg-gradient-to-br from-gray-900/40 via-gray-950/60 to-gray-900/40 shadow-2xl shadow-black/50 backdrop-blur-sm transition-all duration-500 hover:border-amber-900/40 hover:shadow-amber-950/20 hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <CardHeader className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-900/20 via-amber-950/10 to-transparent ring-1 ring-amber-900/20 transition-all duration-300 group-hover:ring-amber-700/30">
                    <TrendingUp className="h-6 w-6 text-amber-500/90 transition-all duration-300 group-hover:text-amber-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold tracking-tight text-gray-100">AI financial planning</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-relaxed text-gray-500">
                    Turn your equity into a plan: simulate exits, plan exercises, and allocate proceeds across assets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href={user ? "/financial-planning" : "/login"}>
                    <Button variant="ghost" className="group/btn w-full justify-between text-sm font-medium text-gray-400 transition-all hover:bg-amber-950/10 hover:text-amber-500">
                      {user ? "Go to Planning" : "Sign in to start planning"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="relative">
          <div className="pointer-events-none absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
          <MarqueeTestimonialsSection
            title="Trusted by developers worldwide"
            description="Join thousands of builders who are turning their ESOPs into clear, actionable wealth plans."
            testimonials={[
              {
                author: {
                  name: 'Emma Thompson',
                  handle: '@emmaai',
                  avatar:
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
                },
                text:
                  'Using this platform has transformed how we reason about equity. The speed and clarity are on another level.',
                href: 'https://twitter.com/emmaai',
              },
              {
                author: {
                  name: 'David Park',
                  handle: '@davidtech',
                  avatar:
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                },
                text:
                  'We plugged ESOP Master into our workflow and cut hours of spreadsheet work every month.',
                href: 'https://twitter.com/davidtech',
              },
              {
                author: {
                  name: 'Sofia Rodriguez',
                  handle: '@sofiaml',
                  avatar:
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
                },
                text:
                  'Finally, an ESOP tool that actually explains vesting, taxes, and exits in a way my whole team understands.',
              },
            ]}
          />
        </section>

        <section id="how-it-works" className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/30 via-gray-950/50 to-gray-900/30 p-8 shadow-2xl shadow-black/50 backdrop-blur-sm md:p-12">
          <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-amber-950/8 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-amber-950/5 to-transparent blur-3xl" />
          <div className="relative z-10 grid gap-12 md:grid-cols-[300px_1fr]">
            <div className="space-y-4">
              <h3 className="bg-gradient-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-3xl">How it works</h3>
              <p className="text-base leading-relaxed text-gray-400 md:text-lg">
                In a few steps, you get from scattered grant letters to a clear, actionable plan.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="group relative overflow-hidden space-y-3 rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/30 to-gray-950/50 p-6 shadow-lg shadow-black/30 backdrop-blur-sm transition-all duration-300 hover:border-amber-900/30 hover:shadow-xl hover:shadow-amber-950/10">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex items-center justify-between">
                  <div className="inline-flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-900/15 to-transparent text-sm font-semibold text-amber-500/80 ring-1 ring-amber-900/20 transition-all duration-300 group-hover:ring-amber-700/30">
                      1
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Step 1</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-amber-700/60 transition-all duration-300 group-hover:translate-x-1 group-hover:text-amber-500" />
                </div>
                <h4 className="relative text-lg font-semibold tracking-tight text-gray-100">Upload your ESOPs</h4>
                <p className="relative text-sm leading-relaxed text-gray-500">
                  Drop in a CSV with your grants, tickers, quantities, and vesting dates.
                </p>
              </div>
              <div className="group relative overflow-hidden space-y-3 rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/30 to-gray-950/50 p-6 shadow-lg shadow-black/30 backdrop-blur-sm transition-all duration-300 hover:border-amber-900/30 hover:shadow-xl hover:shadow-amber-950/10">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex items-center justify-between">
                  <div className="inline-flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-900/15 to-transparent text-sm font-semibold text-amber-500/80 ring-1 ring-amber-900/20 transition-all duration-300 group-hover:ring-amber-700/30">
                      2
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Step 2</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-amber-700/60 transition-all duration-300 group-hover:translate-x-1 group-hover:text-amber-500" />
                </div>
                <h4 className="relative text-lg font-semibold tracking-tight text-gray-100">Explore analytics</h4>
                <p className="relative text-sm leading-relaxed text-gray-500">
                  See what's vested, what's pending, and what it's worth at today's prices.
                </p>
              </div>
              <div className="group relative overflow-hidden space-y-3 rounded-xl border border-gray-800/70 bg-gradient-to-br from-gray-950/80 to-gray-900/80 p-6 shadow-lg shadow-black/20 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-center justify-between">
                  <div className="inline-flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-base font-bold text-primary ring-1 ring-primary/30 transition-all group-hover:ring-primary/50">
                      3
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Step 3</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary/70 transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h4 className="relative text-lg font-semibold tracking-tight text-gray-100">Generate a plan</h4>
                <p className="relative text-sm leading-relaxed text-gray-500">
                  Use the financial planner to simulate exercises, taxes, and reinvestment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-border/40">
          <div className="py-12">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Brand */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                    EMS
                  </div>
                  <span className="text-sm font-semibold">ESOP MANAGEMENT SYSTEM</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Turn your equity into a clear wealth plan. Built for startup employees and founders.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="https://twitter.com"
                    target="_blank"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                  </Link>
                  <Link
                    href="https://github.com"
                    target="_blank"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Github className="h-4 w-4" />
                  </Link>
                  <Link
                    href="https://linkedin.com"
                    target="_blank"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Product */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Product</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="#product" className="text-muted-foreground hover:text-foreground transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
                      Analytics
                    </Link>
                  </li>
                  <li>
                    <Link href="/financial-planning" className="text-muted-foreground hover:text-foreground transition-colors">
                      Financial Planning
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Resources</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                      How it works
                    </a>
                  </li>
                  <li>
                    <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                      Testimonials
                    </a>
                  </li>
                  <li>
                    <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                      Settings
                    </Link>
                  </li>
                  <li>
                    <Link href="/esop-upload" className="text-muted-foreground hover:text-foreground transition-colors">
                      Upload CSV
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal & Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Legal</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Mail className="h-4 w-4" />
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-sm text-muted-foreground sm:flex-row">
              <p>© {new Date().getFullYear()} ESOP MANAGEMENT SYSTEM. All rights reserved.</p>
              <p className="flex items-center gap-2">
                Made with <span className="text-primary">♥</span> by{' '}
                <span className="font-semibold text-foreground">Mrunal Sanghi</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

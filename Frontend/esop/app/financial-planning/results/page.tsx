'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  CheckCircle2, 
  TrendingUp, 
  Info, 
  AlertTriangle,
  Briefcase,
  DollarSign,
  Target,
  Download,
  Mail,
  Share2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { authorizedFetch } from '@/lib/authClient';

// --- Interfaces ---
interface StoredPlan {
  status?: string;
  wealthManagerId?: string;
  dataAsOf?: string;
  data?: Record<string, any>;
}

// --- Components ---
export default function FinancialPlanningResultsPage() {
  const [plan, setPlan] = useState<StoredPlan | null>(null);
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Calculator state
  const [vestingYears, setVestingYears] = useState(4);
  const [esopQuantity, setEsopQuantity] = useState(1000);
  const [expectedReturn, setExpectedReturn] = useState(12);

  // --- Data Loading ---
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('financialPlan');
      const savedForm = localStorage.getItem('financialFormData');

      if (!savedPlan) {
        setError('No financial plan found. Please generate a plan first.');
      } else {
        setPlan(JSON.parse(savedPlan));
      }

      if (savedForm) {
        setFormData(JSON.parse(savedForm));
      }
    } catch (err) {
      console.error('Failed to load plan:', err);
      setError('Unable to load saved financial plan. Please regenerate your plan.');
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Derived Data & Formatters ---
  const planData = plan?.data ?? {};
  const currency = planData.marketContext?.currency || 'USD';
  const riskTolerance = formData?.riskTolerance || 'medium';
  const headlineSuccess = planData.headlineSuccessProbability as number | undefined;
  const horizonYears = (formData?.investmentHorizon as number | undefined) || (Array.isArray(planData.projections) ? planData.projections.length : 10);
  const inflationRate = typeof planData.marketContext?.inflationRate === 'number'
    ? planData.marketContext.inflationRate
    : (currency === 'INR' ? 6 : 3.5);
  const expectedCagr = typeof planData.expectedCagr === 'number' ? planData.expectedCagr : undefined;
  const monthlyIncome = (formData?.monthlyIncome as number | undefined) || 0;
  const monthlyExpenses = (formData?.monthlyExpenses as number | undefined) || 0;
  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    : null;

  const esopOverview = planData.analyticsSummary?.esopOverview as any;
  const planningRegion = planData.marketContext?.region || (currency === 'INR' ? 'india' : 'us');
  const esopTaxRate = planningRegion === 'india' ? 0.1 : 0.2;
  const realizedPnL = typeof esopOverview?.totalRealizedPnL === 'number' ? esopOverview.totalRealizedPnL : 0;
  const unrealizedPnL = typeof esopOverview?.totalUnrealizedPnL === 'number' ? esopOverview.totalUnrealizedPnL : 0;
  const totalPnL = typeof esopOverview?.totalPnL === 'number' ? esopOverview.totalPnL : realizedPnL + unrealizedPnL;
  const esopTax = realizedPnL > 0 ? realizedPnL * esopTaxRate : 0;
  const esopAdjustedPnL = totalPnL - esopTax;

  const avgCurrentPriceDisplay =
    typeof esopOverview?.averageCurrentPrice === 'number' && esopOverview.averageCurrentPrice > 0
      ? esopOverview.averageCurrentPrice
      : esopOverview?.totalVestedShares
      ? esopOverview.totalValue / esopOverview.totalVestedShares
      : undefined;

  const avgExercisePriceDisplay =
    typeof esopOverview?.averageExercisePrice === 'number' && esopOverview.averageExercisePrice > 0
      ? esopOverview.averageExercisePrice
      : esopOverview?.totalVestedShares
      ? esopOverview.totalCost / esopOverview.totalVestedShares
      : undefined;

  const successProbabilityGrid = planData.successProbability as Record<string, Record<string, number>> | undefined;
  const successGridRows = useMemo(() => {
    if (!successProbabilityGrid) return [] as { label: string; values: (number | null)[] }[];
    const riskLevels = [
      { key: 'lowRisk', label: 'Low' },
      { key: 'mediumRisk', label: 'Medium' },
      { key: 'highRisk', label: 'High' },
    ];
    const horizonKeys = ['year5', 'year10', 'year15', 'year20'];

    return riskLevels.map((r) => ({
      label: r.label,
      values: horizonKeys.map((h) => {
        const v = successProbabilityGrid?.[r.key]?.[h];
        return typeof v === 'number' ? v : null;
      }),
    }));
  }, [successProbabilityGrid]);

  const successHorizonLabels = ['5Y', '10Y', '15Y', '20Y'];
  
  // Helper: Currency Formatter
  const formatCurrency = useMemo(() => {
    return (value: number | null | undefined) => {
      const numericValue = Number(value ?? 0);
      if (!Number.isFinite(numericValue)) return '-';
      return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(numericValue);
    };
  }, [currency]);

  // Helper: Number Formatter for Charts
  const formatChartCurrency = (value: number) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  // 1. ESOP Projections Data
  const vestingProjections = useMemo(() => {
    const esopOverview = planData.analyticsSummary?.esopOverview;
    const currentPrice = esopOverview?.averageCurrentPrice || 100;
    const exercisePrice = esopOverview?.averageExercisePrice || 50;
    const years = [];
    
    for (let year = 1; year <= vestingYears; year++) {
      const projectedPrice = currentPrice * Math.pow(1 + expectedReturn / 100, year);
      const vestedQuantity = Math.floor((esopQuantity / vestingYears) * year);
      const totalValue = vestedQuantity * projectedPrice;
      const potentialGain = vestedQuantity * (projectedPrice - exercisePrice);
      
      years.push({ 
        year: `Year ${year}`, 
        vestedQuantity, 
        projectedPrice, 
        totalValue, 
        potentialGain,
        cost: vestedQuantity * exercisePrice
      });
    }
    return years;
  }, [vestingYears, esopQuantity, expectedReturn, planData]);

  // 2. Growth Projection Data (Area Chart)
  const growthProjection = useMemo(() => {
    const projections = Array.isArray(planData.projections) ? planData.projections : [];
    const monthlyContribution = formData?.monthlyContribution || 0;

    if (!projections.length) return [];

    return projections.map((point: any) => {
      const numericYear = typeof point.year === 'number' ? point.year : Number(point.year) || 0;
      const nominal = Number(point.value ?? 0);
      const real = Number(point.realValue ?? nominal);
      const invested = monthlyContribution * 12 * numericYear;
      const inflationImpact = nominal - real;

      return {
        year: `Y${numericYear}`,
        nominal: Math.round(nominal),
        real: Math.round(real),
        invested: Math.round(invested),
        inflationImpact: Math.round(inflationImpact),
      };
    });
  }, [formData, planData]);

  // 3. Allocation Data (Pie Chart)
  const allocationData = useMemo(() => {
    if (!planData.allocation || !Array.isArray(planData.allocation)) return [];
    return planData.allocation.map((item: any) => ({
      name: item.name,
      value: item.value,
      color: item.name === 'Equities' ? '#3b82f6' : item.name === 'Bonds' ? '#10b981' : item.name === 'Alternatives' ? '#f59e0b' : '#a855f7'
    }));
  }, [planData]);

  // --- Actions ---
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    // We want ALL tabs (overview, portfolio, esop, growth) in the PDF.
    // Temporarily mark every tab panel as active/visible while we capture.
    const container = reportRef.current;
    const tabPanels = Array.from(
      container.querySelectorAll('[role="tabpanel"]')
    ) as HTMLElement[];

    const previousStates = tabPanels.map((panel) => panel.getAttribute('data-state'));
    const previousDisplays = tabPanels.map((panel) => panel.style.display);
    const previousHidden = tabPanels.map((panel) => panel.hasAttribute('hidden'));

    tabPanels.forEach((panel) => {
      panel.setAttribute('data-state', 'active');
      // shadcn TabsContent uses hidden attribute + CSS, so remove it for capture
      if (panel.hasAttribute('hidden')) {
        panel.removeAttribute('hidden');
      }
      if (panel.style.display === 'none') {
        panel.style.display = 'block';
      }
    });
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        // Use device pixel ratio for sharper text on high-DPI screens
        scale: typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add first page
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add extra pages as needed
      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Wealth_Strategy_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Restore original tab state so UI behaves normally after export
      tabPanels.forEach((panel, idx) => {
        const prevState = previousStates[idx];
        if (prevState) {
          panel.setAttribute('data-state', prevState);
        } else {
          panel.removeAttribute('data-state');
        }

        panel.style.display = previousDisplays[idx] || '';

        if (previousHidden[idx]) {
          panel.setAttribute('hidden', '');
        } else {
          panel.removeAttribute('hidden');
        }
      });
    }
  };

  const handleEmailReport = async () => {
    const userEmail = prompt("Please enter your email address to receive the report:");
    if (!userEmail) return;

    try {
      const response = await authorizedFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/reports/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          planId: plan?.wealthManagerId,
          planData: planData
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Report sent successfully! Check your inbox.');
      } else {
        throw new Error(data.message || 'Failed to send email');
      }
    } catch (err) {
      console.error('Email send failed:', err);
      alert('Failed to send email report. Please try again later.');
    }
  };

  const handleSavePlan = async () => {
    try {
      const response = await authorizedFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/reports/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan?.wealthManagerId,
          planData: planData
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Plan saved to your profile successfully!');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save plan. Please ensure you are logged in.');
    }
  };

  // --- Loading & Error States ---
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-lg font-medium text-muted-foreground">Generating Strategic Plan...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-xl w-full border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Plan Generation Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Link href="/financial-planning">
              <Button className="w-full">Return to Input</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50" ref={reportRef}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Wealth Strategy</h1>
              <p className="text-xs text-muted-foreground">ID: {plan?.wealthManagerId?.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="hidden md:flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 mr-2">
                <Target className="h-4 w-4" />
                <span>Success: {planData.headlineSuccessProbability?.toFixed(0)}%</span>
             </div>
             
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleEmailReport} className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </Button>
            
            <Link href="/financial-planning">
              <Button size="sm">Edit</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            <TabsList className="bg-background border p-1 h-auto">
              <TabsTrigger value="overview" className="px-4 py-2">Overview</TabsTrigger>
              <TabsTrigger value="portfolio" className="px-4 py-2">Portfolio & Strategy</TabsTrigger>
              <TabsTrigger value="esop" className="px-4 py-2">ESOP Analytics</TabsTrigger>
              <TabsTrigger value="growth" className="px-4 py-2">Growth Path</TabsTrigger>
            </TabsList>
          </div>

          {/* --- TAB: OVERVIEW --- */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-4 gap-4"
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Projected Net Worth (10Y)</p>
                      <h3 className="text-2xl font-bold mt-2">
                        {formatCurrency(growthProjection[growthProjection.length - 1]?.nominal)}
                      </h3>
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[75%]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monthly Investment</p>
                      <h3 className="text-2xl font-bold mt-2">{formatCurrency(formData?.monthlyContribution)}</h3>
                    </div>
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                   <p className="text-xs text-muted-foreground mt-2">Recommended amount based on income</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Risk Profile</p>
                      <h3 className="text-2xl font-bold mt-2 capitalize">{riskTolerance}</h3>
                    </div>
                    <Shield className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {riskTolerance === 'high' ? 'Aggressive Growth' : 'Balanced Approach'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Market Outlook</p>
                      <h3 className="text-2xl font-bold mt-2 text-amber-500">Neutral</h3>
                    </div>
                    <Info className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">CPI: 3.2% | PPI: 2.7%</p>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="md:col-span-1 h-full border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Immediate Actions
                  </CardTitle>
                  <CardDescription>Critical steps to implement this week</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex gap-3 items-start">
                      <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                      <div>
                        <p className="text-sm font-medium">Rebalance Portfolio</p>
                        <p className="text-xs text-muted-foreground">Adjust equity exposure to {planData.allocation?.find((a:any) => a.name === 'Equities')?.value}%.</p>
                      </div>
                   </div>
                   <div className="flex gap-3 items-start">
                      <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                      <div>
                        <p className="text-sm font-medium">Setup SIPs</p>
                        <p className="text-xs text-muted-foreground">Automate {formatCurrency(formData?.monthlyContribution)} monthly transfer.</p>
                      </div>
                   </div>
                   <div className="flex gap-3 items-start">
                      <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                      <div>
                        <p className="text-sm font-medium">Review ESOPs</p>
                        <p className="text-xs text-muted-foreground">Check vesting schedule for next 4 years.</p>
                      </div>
                   </div>
                </CardContent>
              </Card>

              {/* Growth Chart Preview */}
              <Card className="md:col-span-2">
                <CardHeader>
                   <CardTitle>Wealth Trajectory</CardTitle>
                   <CardDescription>10-Year Nominal vs Real Growth</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthProjection}>
                      <defs>
                        <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={formatChartCurrency} tick={{fontSize: 12}} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="nominal" stroke="#3b82f6" fillOpacity={1} fill="url(#colorNominal)" name="Nominal Value" strokeWidth={2} />
                      <Area type="monotone" dataKey="real" stroke="#10b981" fillOpacity={1} fill="url(#colorReal)" name="Real Value (Inflation Adj.)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assumptions &amp; Model</CardTitle>
                  <CardDescription>How this report is being calculated</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Planning region</span>
                    <span className="font-medium">
                      {planData.marketContext?.region?.toUpperCase() || (currency === 'INR' ? 'INDIA' : 'US')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Investment horizon</span>
                    <span className="font-medium">{horizonYears} years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expected CAGR used</span>
                    <span className="font-medium">{expectedCagr ? `${expectedCagr.toFixed(1)}%` : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Inflation assumption</span>
                    <span className="font-medium">{inflationRate.toFixed(1)}% / year</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Savings rate from income</span>
                    <span className="font-medium">
                      {savingsRate !== null ? `${savingsRate.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Target className="h-3 w-3" /> Headline success probability
                    </span>
                    <span className="font-semibold">
                      {typeof headlineSuccess === 'number' ? `${headlineSuccess.toFixed(0)}%` : '—'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    What this means for you
                  </CardTitle>
                  <CardDescription>Decision guidance based on your inputs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    This plan assumes you invest {formatCurrency(formData?.monthlyContribution)} every month for {horizonYears} years
                    into a {riskTolerance}-risk portfolio with an expected CAGR derived from the primary benchmark.
                  </p>
                  {savingsRate !== null && (
                    <p className="text-muted-foreground">
                      Your current savings rate is approximately <span className="font-semibold">{savingsRate.toFixed(1)}%</span> of income. Increasing this
                      percentage directly improves your success probability and the 10-year projected net worth.
                    </p>
                  )}
                  {typeof headlineSuccess === 'number' && (
                    <div className="space-y-1">
                      <p className="font-medium">Suggested next moves:</p>
                      {headlineSuccess >= 90 && (
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>Maintain your current monthly contribution and re-balance the portfolio annually.</li>
                          <li>Use ESOP liquidation mainly for diversification and tax optimisation, not for funding basics.</li>
                        </ul>
                      )}
                      {headlineSuccess < 90 && headlineSuccess >= 70 && (
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>Consider increasing your monthly investment or extending the investment horizon by 2-3 years.</li>
                          <li>Prioritise building a 6-month emergency fund before adding higher-risk satellite positions.</li>
                        </ul>
                      )}
                      {headlineSuccess < 70 && (
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>Boost savings by cutting discretionary expenses or increasing income to raise the savings rate.</li>
                          <li>Revisit your goal amount or timeline; a smaller target or longer horizon can materially lift success odds.</li>
                        </ul>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- TAB: PORTFOLIO --- */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid md:grid-cols-12 gap-6">
               {/* Allocation Chart */}
               <Card className="md:col-span-4">
                  <CardHeader>
                    <CardTitle>Target Allocation</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center">
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-2 mt-4">
                       {allocationData.map((item) => (
                         <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />
                               <span>{item.name}</span>
                            </div>
                            <span className="font-bold">{item.value}%</span>
                         </div>
                       ))}
                    </div>
                  </CardContent>
               </Card>
               
               {/* Strategies Grid */}
               <div className="md:col-span-8 space-y-6">
                  {/* Market Leaders */}
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <TrendingUp className="h-5 w-5 text-primary" />
                           Top Performing Assets
                        </CardTitle>
                        <CardDescription>Historical leaders to consider for your portfolio</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                           {planData.marketLeaders?.categories && Object.entries(planData.marketLeaders.categories).map(([key, category]: [string, any]) => (
                              (key !== 'algoPlays' || riskTolerance === 'high') && (
                                 <div key={key} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                                    <div className="flex items-center justify-between mb-3">
                                       <h4 className="font-semibold">{category.label}</h4>
                                       {key === 'algoPlays' && <span className="text-[10px] uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">High Risk</span>}
                                    </div>
                                    <div className="space-y-2">
                                       {category.items?.slice(0, 3).map((item: any) => (
                                          <div key={item.symbol} className="flex justify-between items-center text-sm">
                                             <span>{item.symbol}</span>
                                             <div className="flex items-center gap-1.5">
                                                <span className={item.return1y >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                                   {item.return1y > 0 ? '+' : ''}{item.return1y}%
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-medium">1Y</span>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              )
                           ))}
                        </div>
                     </CardContent>
                  </Card>

                  {/* Core Strategy */}
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <CheckCircle2 className="h-5 w-5 text-primary" />
                           Recommended Strategy
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div className="grid gap-4">
                           {planData.strategies?.slice(0, 2).map((strategy: any, i: number) => (
                              <div key={i} className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-200">
                                 <div className="mt-1 min-w-[40px] h-10 bg-primary/10 rounded flex items-center justify-center font-bold text-primary">
                                    {strategy.allocation}%
                                 </div>
                                 <div>
                                    <h4 className="font-semibold">{strategy.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{strategy.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Approx. monthly allocation: {formatCurrency((formData?.monthlyContribution || 0) * (strategy.allocation || 0) / 100)}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                       {strategy.examples?.map((ex: string) => (
                                          <span key={ex} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                             {ex}
                                          </span>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </div>
          </TabsContent>

          {/* --- TAB: ESOP --- */}
          <TabsContent value="esop" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
               <Card className="md:col-span-1">
                  <CardHeader>
                     <CardTitle>Configuration</CardTitle>
                     <CardDescription>Adjust to simulate scenarios</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Unvested Quantity</label>
                        <div className="flex items-center border rounded-md overflow-hidden">
                           <span className="px-3 py-2 bg-muted text-muted-foreground border-r">#</span>
                           <input 
                              type="number" 
                              className="flex-1 p-2 outline-none bg-transparent"
                              value={esopQuantity}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const cleaned = raw.replace(/^0+(?=\d)/, '');
                                setEsopQuantity(Number(cleaned || '0'));
                              }}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Vesting Period (Years)</label>
                        <input 
                           type="range" 
                           min="1" 
                           max="5" 
                           step="1" 
                           className="w-full"
                           value={vestingYears}
                           onChange={(e) => setVestingYears(Number(e.target.value))}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                           <span>1 Year</span>
                           <span className="font-medium text-primary">{vestingYears} Years</span>
                           <span>5 Years</span>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Expected Annual Growth</label>
                        <div className="flex items-center border rounded-md overflow-hidden">
                           <input 
                              type="number" 
                              className="flex-1 p-2 outline-none bg-transparent"
                              value={expectedReturn}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const cleaned = raw.replace(/^0+(?=\d)/, '');
                                setExpectedReturn(Number(cleaned || '0'));
                              }}
                           />
                           <span className="px-3 py-2 bg-muted text-muted-foreground border-l">%</span>
                        </div>
                     </div>
                     
                     <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-sm text-muted-foreground">Est. Exercise Cost</span>
                           <span className="font-medium text-red-500">{formatCurrency(vestingProjections.reduce((acc, curr) => acc + curr.cost, 0))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-sm text-muted-foreground">Projected Gain</span>
                           <span className="font-bold text-green-600">{formatCurrency(vestingProjections.reduce((acc, curr) => acc + curr.potentialGain, 0))}</span>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <Card className="md:col-span-2">
                  <CardHeader>
                     <CardTitle>Vesting Projection</CardTitle>
                     <CardDescription>Projected value vs cost over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vestingProjections} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                           <XAxis dataKey="year" axisLine={false} tickLine={false} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={formatChartCurrency} />
                           <Tooltip 
                              cursor={{fill: 'transparent'}}
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                           />
                           <Legend />
                           <Bar dataKey="totalValue" name="Total Value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                           <Bar dataKey="cost" name="Exercise Cost" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ESOP PnL &amp; Tax Breakdown</CardTitle>
                  <CardDescription>Realised vs unrealised gains using portfolio averages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total cost basis</span>
                    <span className="font-medium">{formatCurrency(esopOverview?.totalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current market value</span>
                    <span className="font-medium">{formatCurrency(esopOverview?.totalValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Realised PnL (sold)</span>
                    <span className={realizedPnL >= 0 ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
                      {formatCurrency(realizedPnL)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Unrealised PnL (held)</span>
                    <span className={unrealizedPnL >= 0 ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
                      {formatCurrency(unrealizedPnL)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estimated tax on realised gains</span>
                    <span className="font-medium text-amber-600">{formatCurrency(esopTax)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <span className="text-muted-foreground text-xs">Adjusted PnL after tax</span>
                    <span className={esopAdjustedPnL >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                      {formatCurrency(esopAdjustedPnL)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Concentration &amp; Exposure</CardTitle>
                  <CardDescription>Shares and regional split</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Vested shares</span>
                    <span className="font-medium">{esopOverview?.totalVestedShares ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Unvested shares</span>
                    <span className="font-medium">{esopOverview?.totalUnvestedShares ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Average current price</span>
                    <span className="font-medium">{formatCurrency(avgCurrentPriceDisplay)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Average exercise price</span>
                    <span className="font-medium">{formatCurrency(avgExercisePriceDisplay)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Tax is applied only on realised gains. Unrealised gains are shown pre-tax to reflect market risk on remaining holdings.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* --- TAB: GROWTH --- */}
          <TabsContent value="growth" className="space-y-6">
             {/* Summary Cards */}
             {growthProjection.length > 0 && (
               <div className="grid md:grid-cols-4 gap-4">
                 <Card>
                   <CardContent className="pt-6">
                     <div className="text-sm text-muted-foreground mb-1">Total Invested ({horizonYears}Y)</div>
                     <div className="text-2xl font-bold">{formatCurrency(growthProjection[growthProjection.length - 1]?.invested)}</div>
                   </CardContent>
                 </Card>
                 <Card>
                   <CardContent className="pt-6">
                     <div className="text-sm text-muted-foreground mb-1">Final Value (Nominal)</div>
                     <div className="text-2xl font-bold text-blue-600">{formatCurrency(growthProjection[growthProjection.length - 1]?.nominal)}</div>
                   </CardContent>
                 </Card>
                 <Card>
                   <CardContent className="pt-6">
                     <div className="text-sm text-muted-foreground mb-1">Real Value (Inflation-Adj.)</div>
                     <div className="text-2xl font-bold text-green-600">{formatCurrency(growthProjection[growthProjection.length - 1]?.real)}</div>
                   </CardContent>
                 </Card>
                 <Card>
                   <CardContent className="pt-6">
                     <div className="text-sm text-muted-foreground mb-1">Total Gain</div>
                     <div className="text-2xl font-bold text-emerald-600">
                       {formatCurrency((growthProjection[growthProjection.length - 1]?.nominal || 0) - (growthProjection[growthProjection.length - 1]?.invested || 0))}
                     </div>
                   </CardContent>
                 </Card>
               </div>
             )}

             <Card>
                <CardHeader>
                   <CardTitle>Detailed Wealth Projection</CardTitle>
                   <CardDescription>
                     Year-by-year breakdown: Your {formatCurrency(formData?.monthlyContribution)}/month grows at {expectedCagr?.toFixed(1)}% CAGR.
                     Real Value accounts for {inflationRate.toFixed(1)}% annual inflation to show purchasing power.
                   </CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="rounded-md border">
                      <table className="w-full text-sm text-left">
                         <thead className="bg-muted/50">
                            <tr>
                               <th className="p-4 font-medium">Year</th>
                               <th className="p-4 font-medium text-right">Nominal Value</th>
                               <th className="p-4 font-medium text-right">Real Value (Purchasing Power)</th>
                               <th className="p-4 font-medium text-right hidden md:table-cell">Inflation Impact</th>
                               <th className="p-4 font-medium text-right">Total Invested</th>
                            </tr>
                         </thead>
                         <tbody>
                            {growthProjection.map((row, i) => (
                               <tr key={i} className="border-t hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                  <td className="p-4 font-medium text-muted-foreground">{row.year}</td>
                                  <td className="p-4 text-right font-bold">{formatCurrency(row.nominal)}</td>
                                  <td className="p-4 text-right font-bold text-green-600">{formatCurrency(row.real)}</td>
                                  <td className="p-4 text-right text-red-500 hidden md:table-cell">-{formatCurrency(row.inflationImpact)}</td>
                                  <td className="p-4 text-right text-muted-foreground">{formatCurrency(row.invested)}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </CardContent>
             </Card>

             {successGridRows.length > 0 && (
               <Card>
                 <CardHeader>
                   <CardTitle>Success Probability Grid</CardTitle>
                   <CardDescription>Monte Carlo outcomes by risk level and time horizon</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="rounded-md border overflow-x-auto">
                     <table className="w-full text-sm text-left">
                       <thead className="bg-muted/50">
                         <tr>
                           <th className="p-3 font-medium">Risk \ Horizon</th>
                           {successHorizonLabels.map((label) => (
                             <th key={label} className="p-3 font-medium text-right">{label}</th>
                           ))}
                         </tr>
                       </thead>
                       <tbody>
                         {successGridRows.map((row) => (
                           <tr key={row.label} className="border-t">
                             <td className="p-3 font-medium text-muted-foreground">{row.label}</td>
                             {row.values.map((val, idx) => (
                               <td key={idx} className="p-3 text-right">
                                 {val !== null ? (
                                   <span className={val >= 80 ? 'font-semibold text-green-600' : val >= 60 ? 'font-semibold text-amber-600' : 'font-semibold text-red-600'}>
                                     {val.toFixed(0)}%
                                   </span>
                                 ) : (
                                   <span className="text-muted-foreground">—</span>
                                 )}
                               </td>
                             ))}
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                   <p className="mt-2 text-xs text-muted-foreground">
                     Grid shows % of 1,000 simulated scenarios where you reach 1.2–1.4× your total invested capital (or your explicit goal if higher).
                   </p>
                 </CardContent>
               </Card>
             )}

             {/* Key Insights */}
             <Card className="border-l-4 border-l-blue-500">
               <CardHeader>
                 <CardTitle className="text-base">Key Insights & Action Items</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3 text-sm">
                 {growthProjection.length > 0 && (
                   <>
                     <div>
                       <p className="font-medium mb-1">📊 Wealth Building Trajectory</p>
                       <p className="text-muted-foreground">
                         Over {horizonYears} years, your {formatCurrency(formData?.monthlyContribution)}/month contribution 
                         will grow from {formatCurrency(growthProjection[0]?.invested)} to approximately{' '}
                         <span className="font-semibold text-blue-600">{formatCurrency(growthProjection[growthProjection.length - 1]?.nominal)}</span>{' '}
                         (nominal), or{' '}
                         <span className="font-semibold text-green-600">{formatCurrency(growthProjection[growthProjection.length - 1]?.real)}</span>{' '}
                         in today's purchasing power.
                       </p>
                     </div>
                     <div>
                       <p className="font-medium mb-1">💰 Return on Investment</p>
                       <p className="text-muted-foreground">
                         You'll invest {formatCurrency(growthProjection[growthProjection.length - 1]?.invested)} total, 
                         and earn approximately{' '}
                         <span className="font-semibold text-emerald-600">
                           {formatCurrency((growthProjection[growthProjection.length - 1]?.nominal || 0) - (growthProjection[growthProjection.length - 1]?.invested || 0))}
                         </span>{' '}
                         in investment gains (before inflation). This represents a{' '}
                         {(((growthProjection[growthProjection.length - 1]?.nominal || 0) / (growthProjection[growthProjection.length - 1]?.invested || 1) - 1) * 100).toFixed(0)}% 
                         total return.
                       </p>
                     </div>
                     {typeof headlineSuccess === 'number' && (
                       <div>
                         <p className="font-medium mb-1">🎯 Probability of Success</p>
                         <p className="text-muted-foreground">
                           Based on Monte Carlo analysis, there's a{' '}
                           <span className={headlineSuccess >= 80 ? "font-semibold text-green-600" : headlineSuccess >= 60 ? "font-semibold text-amber-600" : "font-semibold text-red-600"}>
                             {headlineSuccess}%
                           </span>{' '}
                           chance of meeting or exceeding your financial target with this plan.
                           {headlineSuccess < 80 && (
                             <span className="block mt-1">
                               💡 To improve odds: increase monthly contribution by 10-20%, extend horizon by 2-3 years, or reduce target goal.
                             </span>
                           )}
                         </p>
                       </div>
                     )}
                   </>
                 )}
               </CardContent>
             </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}

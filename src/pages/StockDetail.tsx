import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, ArrowLeft, TrendingUp, TrendingDown, BarChart3, Shield,
  Brain, Clock, AlertTriangle, ChevronRight, Newspaper, Target,
  Gauge, Zap
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from "recharts";
import { getCompanyBySymbol } from "@/data/companies";
import { generateStockData, type StockData } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

// Helper to read CSS variable as usable HSL string
function getCssColor(varName: string): string {
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return val ? `hsl(${val})` : "";
}

// Circular Meter Component
const CircularMeter = ({ buy, sell, hold }: { buy: number; sell: number; hold: number }) => {
  const size = 200;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const buyLen = (buy / 100) * circumference;
  const sellLen = (sell / 100) * circumference;
  const holdLen = (hold / 100) * circumference;
  const dominant = buy >= sell && buy >= hold ? "BUY" : sell >= hold ? "SELL" : "HOLD";
  const dominantColor = dominant === "BUY" ? "text-bull" : dominant === "SELL" ? "text-bear" : "text-hold";
  const dominantPct = dominant === "BUY" ? buy : dominant === "SELL" ? sell : hold;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Buy arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
          className="stroke-bull"
          strokeDasharray={`${buyLen} ${circumference}`}
          strokeDashoffset={0}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${buyLen} ${circumference}` }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        {/* Sell arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
          className="stroke-bear"
          strokeDasharray={`${sellLen} ${circumference}`}
          strokeDashoffset={-buyLen}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${sellLen} ${circumference}` }}
          transition={{ duration: 1, delay: 0.7 }}
        />
        {/* Hold arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
          className="stroke-hold"
          strokeDasharray={`${holdLen} ${circumference}`}
          strokeDashoffset={-(buyLen + sellLen)}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${holdLen} ${circumference}` }}
          transition={{ duration: 1, delay: 0.9 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className={`text-3xl font-bold font-mono ${dominantColor}`}>{dominantPct}%</span>
        <span className={`text-sm font-semibold ${dominantColor}`}>{dominant}</span>
      </div>
      <div className="flex gap-4 mt-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-bull" /> Buy {buy}%</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-bear" /> Sell {sell}%</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-hold" /> Hold {hold}%</span>
      </div>
    </div>
  );
};

// Sentiment Gauge
const SentimentGauge = ({ value, confidence }: { value: number; confidence: number }) => {
  const angle = value * 90; // -90 to 90
  const color = value > 0.2 ? "text-bull" : value < -0.2 ? "text-bear" : "text-hold";
  const label = value > 0.2 ? "POSITIVE" : value < -0.2 ? "NEGATIVE" : "NEUTRAL";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="160" height="90" viewBox="0 0 160 90">
        {/* Background arc */}
        <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" strokeWidth="8" className="stroke-secondary" strokeLinecap="round" />
        {/* Colored arc based on sentiment */}
        <motion.path
          d="M 15 80 A 65 65 0 0 1 145 80"
          fill="none" strokeWidth="8" strokeLinecap="round"
          className={value > 0 ? "stroke-bull" : "stroke-bear"}
          strokeDasharray="204"
          initial={{ strokeDashoffset: 204 }}
          animate={{ strokeDashoffset: 204 - ((value + 1) / 2) * 204 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        />
        {/* Needle */}
        <motion.line
          x1="80" y1="80" x2="80" y2="25"
          strokeWidth="2" className="stroke-foreground" strokeLinecap="round"
          initial={{ rotate: -90 }}
          animate={{ rotate: angle }}
          transition={{ duration: 1, delay: 0.8 }}
          style={{ transformOrigin: "80px 80px" }}
        />
        <circle cx="80" cy="80" r="4" className="fill-foreground" />
      </svg>
      <div className="text-center">
        <span className={`text-lg font-bold font-mono ${color}`}>{value.toFixed(2)}</span>
        <p className={`text-xs font-semibold ${color}`}>{label}</p>
        <p className="text-[10px] text-muted-foreground mt-1">Confidence: {(confidence * 100).toFixed(0)}%</p>
      </div>
    </div>
  );
};

const StockDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StockData | null>(null);
  const [quarterCount, setQuarterCount] = useState<4 | 8>(4);
  const [colors, setColors] = useState({
    primary: "hsl(199, 89%, 48%)",
    grid: "hsl(222, 15%, 16%)",
    label: "hsl(215, 15%, 55%)",
    tooltipBg: "hsl(222, 20%, 9%)",
    tooltipBorder: "hsl(222, 15%, 16%)",
    bull: "hsl(142, 71%, 45%)",
    bear: "hsl(0, 72%, 55%)",
  });

  // Update chart colors when theme changes
  useEffect(() => {
    const update = () => {
      setColors({
        primary: getCssColor("--primary"),
        grid: getCssColor("--chart-grid"),
        label: getCssColor("--chart-label"),
        tooltipBg: getCssColor("--chart-tooltip-bg"),
        tooltipBorder: getCssColor("--chart-tooltip-border"),
        bull: getCssColor("--bull"),
        bear: getCssColor("--bear"),
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!symbol) return;
    const company = getCompanyBySymbol(symbol);
    if (!company) {
      navigate("/");
      return;
    }
    setLoading(true);

    const fetchAnalysis = async () => {
      try {
        const { data: result, error } = await supabase.functions.invoke("stock-analysis", {
          body: {
            symbol: company.symbol,
            companyName: company.name,
            sector: company.sector,
            exchange: company.exchange,
          },
        });

        if (error) throw error;

        if (result?.error) {
          throw new Error(result.error);
        }

        setData({
          company,
          currentPrice: result.currentPrice,
          change: result.change,
          changePct: result.changePct,
          dayHigh: result.dayHigh,
          dayLow: result.dayLow,
          volume: result.volume,
          marketCap: result.marketCap,
          pe: result.pe,
          priceHistory: result.priceHistory || [],
          quarterlyResults: result.quarterlyResults || [],
          news: result.news || [],
          sentiment: result.sentiment,
          aiAnalysis: result.aiAnalysis,
          decision: result.decision,
        });
      } catch (err: any) {
        console.error("Analysis error:", err);
        toast.error("Grok AI analysis failed, using fallback data");
        setData(generateStockData(company));
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [symbol, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <motion.div
          className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse-glow"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Brain className="w-8 h-8 text-primary" />
        </motion.div>
        <div className="text-center">
          <p className="text-foreground font-semibold mb-1">Analyzing {symbol}...</p>
          <p className="text-xs text-muted-foreground">Running Grok AI deep research pipeline</p>
        </div>
        <div className="flex gap-2 mt-2">
          {["Fundamentals", "Sentiment", "AI Research", "Decision"].map((step, i) => (
            <motion.div
              key={step}
              className="px-3 py-1 rounded-full text-[10px] font-medium border"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, delay: i * 0.5, repeat: Infinity }}
              style={{
                borderColor: "hsl(var(--primary) / 0.3)",
                color: "hsl(var(--primary))",
                backgroundColor: "hsl(var(--primary) / 0.05)",
              }}
            >
              {step}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.change >= 0;
  const quarterlyData = data.quarterlyResults.slice(quarterCount === 4 ? 4 : 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-30 bg-background/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-bull animate-pulse" />
              <span className="text-xs text-muted-foreground font-mono">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Company Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-mono mb-1">{data.company.symbol} · {data.company.exchange}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{data.company.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{data.company.sector}</p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-3">
                <span className="price-ticker text-foreground">₹{data.currentPrice.toLocaleString("en-IN")}</span>
                <span className={`flex items-center gap-1 font-mono text-sm font-semibold ${isPositive ? "text-bull" : "text-bear"}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isPositive ? "+" : ""}{data.change} ({isPositive ? "+" : ""}{data.changePct}%)
                </span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground font-mono">
                <span>H: ₹{data.dayHigh}</span>
                <span>L: ₹{data.dayLow}</span>
                <span>Vol: {data.volume}</span>
                <span>MCap: {data.marketCap}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price Chart */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Price Movement (30D)</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.priceHistory}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.primary} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: colors.label }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: colors.label }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: colors.primary }}
                  />
                  <Area type="monotone" dataKey="price" stroke={colors.primary} fill="url(#priceGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Quarterly Chart */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Quarterly Results</h3>
                </div>
                <div className="flex gap-1">
                  {([4, 8] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuarterCount(n)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        quarterCount === n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {n}Q
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: colors.label }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: colors.label }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => {
                      if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(1)}L Cr`;
                      if (Math.abs(v) >= 1000) return `₹${(v / 1000).toFixed(1)}K Cr`;
                      return `₹${v} Cr`;
                    }}
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number, name: string) => {
                      const formatted = Math.abs(value) >= 100000
                        ? `₹${(value / 100000).toFixed(2)}L Cr`
                        : `₹${value.toLocaleString("en-IN")} Cr`;
                      return [formatted, name];
                    }}
                  />
                  <Bar dataKey="revenue" name="Revenue (Cr)" radius={[4, 4, 0, 0]}>
                    {quarterlyData.map((_, i) => (
                      <Cell key={i} fill={colors.primary} opacity={0.7} />
                    ))}
                  </Bar>
                  <Bar dataKey="profit" name="Profit (Cr)" radius={[4, 4, 0, 0]}>
                    {quarterlyData.map((entry, i) => (
                      <Cell key={i} fill={entry.profit >= 0 ? colors.bull : colors.bear} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* AI Insight */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">AI Research Insight</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{data.aiAnalysis.insight}</p>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Key Findings</h4>
                {data.aiAnalysis.newsSummary.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-primary mt-1 shrink-0" />
                    <p className="text-xs text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* News */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Latest News</h3>
              </div>
              <div className="space-y-3">
                {data.news.map((n, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      n.sentiment === "positive" ? "bg-bull" : n.sentiment === "negative" ? "bg-bear" : "bg-hold"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/90">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{n.source} · {n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Analysis */}
          <div className="space-y-4">
            {/* Buy/Sell/Hold Meter */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Action Recommendation</h3>
              </div>
              <div className="relative flex justify-center">
                <CircularMeter buy={data.aiAnalysis.buyPct} sell={data.aiAnalysis.sellPct} hold={data.aiAnalysis.holdPct} />
              </div>
            </motion.div>

            {/* Risk & Holding */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Risk Level</h3>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                    data.aiAnalysis.riskScore === "Low" ? "bg-bull/10 text-bull border border-bull/20" :
                    data.aiAnalysis.riskScore === "High" ? "bg-bear/10 text-bear border border-bear/20" :
                    "bg-hold/10 text-hold border border-hold/20"
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                    {data.aiAnalysis.riskScore}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Holding Period</h3>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold border border-primary/20">
                    <Clock className="w-4 h-4" />
                    {data.aiAnalysis.holdingPeriod}-term
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sentiment Gauge */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Gauge className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Market Sentiment</h3>
              </div>
              <div className="flex justify-center">
                <SentimentGauge value={data.sentiment.avg_sentiment} confidence={data.sentiment.confidence} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
                  <p className="text-muted-foreground mb-1">Trend</p>
                  <p className="font-semibold text-foreground">{data.sentiment.trend}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
                  <p className="text-muted-foreground mb-1">Direction</p>
                  <p className={`font-semibold ${
                    data.sentiment.direction === "POSITIVE" ? "text-bull" :
                    data.sentiment.direction === "NEGATIVE" ? "text-bear" : "text-hold"
                  }`}>{data.sentiment.direction}</p>
                </div>
              </div>
            </motion.div>

            {/* Decision Panel */}
            <motion.div
              className={`glass-card p-5 border-l-4 ${
                data.decision.action === "BUY" ? "border-l-bull" :
                data.decision.action === "SELL" ? "border-l-bear" : "border-l-hold"
              }`}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Decision Agent</h3>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-2xl font-extrabold font-mono ${
                  data.decision.action === "BUY" ? "text-bull" :
                  data.decision.action === "SELL" ? "text-bear" : "text-hold"
                }`}>
                  {data.decision.action}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Confidence</span>
                    <span className="font-mono">{(data.decision.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        data.decision.action === "BUY" ? "bg-bull" :
                        data.decision.action === "SELL" ? "bg-bear" : "bg-hold"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${data.decision.confidence * 100}%` }}
                      transition={{ duration: 1, delay: 0.8 }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{data.decision.explanation}</p>
            </motion.div>

            {/* PE & Metrics */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">Key Metrics</h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: "P/E Ratio", value: data.pe.toFixed(2) },
                  { label: "Market Cap", value: data.marketCap },
                  { label: "Volume", value: data.volume },
                  { label: "Day High", value: `₹${data.dayHigh.toLocaleString("en-IN")}` },
                  { label: "Day Low", value: `₹${data.dayLow.toLocaleString("en-IN")}` },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-mono font-medium text-foreground">{m.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Disclaimer footer */}
        <div className="mt-8 py-4 border-t border-border/30 text-center">
          <p className="text-[10px] text-muted-foreground">
            AI-based probabilistic research analysis · Not SEBI registered · Invest at your own risk
          </p>
        </div>
      </main>
    </div>
  );
};

export default StockDetail;

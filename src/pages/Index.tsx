import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Search, Newspaper, ArrowRight, User, Flame } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import TrendingStocks from "@/components/TrendingStocks";
import DisclaimerModal from "@/components/DisclaimerModal";
import ThemeToggle from "@/components/ThemeToggle";
import { companies, type Company } from "@/data/companies";
import { supabase } from "@/integrations/supabase/client";
import { generateMockPrice } from "@/lib/portfolioData";
import { generateStockData } from "@/lib/mockData";

const trendingSymbols = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "BHARTIARTL", "TATAMOTORS", "SBIN", "ITC"];

// Generate live market data
function getLiveMarketStocks() {
  const bullish: Array<{ symbol: string; name: string; price: number; changePct: number }> = [];
  const bearish: Array<{ symbol: string; name: string; price: number; changePct: number }> = [];

  companies.slice(0, 20).forEach((c) => {
    const { price, changePct } = generateMockPrice(c.symbol);
    const entry = { symbol: c.symbol, name: c.name.split(" ").slice(0, 2).join(" "), price, changePct };
    if (changePct >= 0) bullish.push(entry);
    else bearish.push(entry);
  });

  bullish.sort((a, b) => b.changePct - a.changePct);
  bearish.sort((a, b) => a.changePct - b.changePct);

  return { bullish: bullish.slice(0, 5), bearish: bearish.slice(0, 5) };
}

function getMockNews() {
  return [
    { title: "Nifty 50 hits all-time high amid strong FII inflows", source: "Economic Times", time: "2h ago", sentiment: "positive" as const },
    { title: "RBI keeps repo rate unchanged at 6.5% in latest policy review", source: "LiveMint", time: "3h ago", sentiment: "neutral" as const },
    { title: "Reliance Industries Q4 profit surges 12% to ₹19,299 crore", source: "Moneycontrol", time: "4h ago", sentiment: "positive" as const },
    { title: "IT sector faces headwinds as US recession fears mount", source: "CNBC TV18", time: "5h ago", sentiment: "negative" as const },
    { title: "Banking stocks rally as credit growth remains robust at 15%", source: "Business Standard", time: "6h ago", sentiment: "positive" as const },
    { title: "Auto sales hit record high in February 2026, Maruti leads", source: "Economic Times", time: "7h ago", sentiment: "positive" as const },
  ];
}

const Index = () => {
  const navigate = useNavigate();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    return localStorage.getItem("disclaimer_accepted") === "true";
  });
  const [featuredStocks, setFeaturedStocks] = useState<Company[]>([]);
  const [footerClicks, setFooterClicks] = useState(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [liveMarket] = useState(getLiveMarketStocks);
  const [news] = useState(getMockNews);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem("disclaimer_accepted", "true");
    setDisclaimerAccepted(true);
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from("featured_stocks")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: Company[] = data.map((s: any) => ({
            name: s.company_name,
            symbol: s.symbol,
            exchange: s.exchange as "NSE" | "BSE",
            sector: s.sector,
          }));
          setFeaturedStocks(mapped);
        }
      } catch {}
    };
    fetchFeatured();
  }, []);

  const handleFooterClick = () => {
    const newCount = footerClicks + 1;
    setFooterClicks(newCount);
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (newCount >= 5) {
      setFooterClicks(0);
      navigate("/admin");
      return;
    }
    clickTimerRef.current = setTimeout(() => setFooterClicks(0), 2000);
  };

  const trendingStocks =
    featuredStocks.length > 0
      ? featuredStocks
      : trendingSymbols.map((s) => companies.find((c) => c.symbol === s)!).filter(Boolean);

  return (
    <>
      <DisclaimerModal open={!disclaimerAccepted} onAccept={handleAcceptDisclaimer} />

      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Intense background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-bull/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-bear/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/3 rounded-full blur-[180px]" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header className="border-b border-border/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-foreground tracking-tight">StockAI</h1>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Research Platform</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <button
                  onClick={() => navigate(isLoggedIn ? "/portfolio" : "/auth")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  {isLoggedIn ? "Portfolio" : "Sign In"}
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-bull animate-pulse" />
                  <span className="text-xs text-muted-foreground font-mono">LIVE</span>
                </div>
              </div>
            </div>
          </header>

          {/* Hero */}
          <main className="container mx-auto px-4 pt-12 pb-8">
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-bull/30 bg-bull/5 mb-6">
                <Flame className="w-3.5 h-3.5 text-bull" />
                <span className="text-xs font-medium text-bull">Live Market · Real-time Data</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-foreground mb-4 tracking-tighter leading-[1.1]">
                Indian Stock
                <span className="text-gradient-primary"> Intelligence</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
                Deep research combining fundamentals, sentiment & market data for every Indian listed company.
              </p>
            </motion.div>

            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <SearchBar />
            </motion.div>

            {/* Live Market Section */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Bullish */}
              <div className="glass-card p-5 border-l-4 border-l-bull">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-bull" />
                  <h3 className="text-sm font-bold text-bull uppercase tracking-wider">Top Gainers</h3>
                </div>
                <div className="space-y-3">
                  {liveMarket.bullish.map((s) => (
                    <button
                      key={s.symbol}
                      onClick={() => navigate(`/stock/${s.symbol}`)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-bull/5 transition-colors group"
                    >
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">{s.symbol}</p>
                        <p className="text-xs text-muted-foreground">{s.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-foreground">₹{s.price.toLocaleString("en-IN")}</p>
                        <p className="text-xs font-mono text-bull font-semibold">+{s.changePct}%</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bearish */}
              <div className="glass-card p-5 border-l-4 border-l-bear">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-4 h-4 text-bear" />
                  <h3 className="text-sm font-bold text-bear uppercase tracking-wider">Top Losers</h3>
                </div>
                <div className="space-y-3">
                  {liveMarket.bearish.map((s) => (
                    <button
                      key={s.symbol}
                      onClick={() => navigate(`/stock/${s.symbol}`)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-bear/5 transition-colors group"
                    >
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">{s.symbol}</p>
                        <p className="text-xs text-muted-foreground">{s.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-foreground">₹{s.price.toLocaleString("en-IN")}</p>
                        <p className="text-xs font-mono text-bear font-semibold">{s.changePct}%</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* News Section */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Market News</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {news.map((n, i) => (
                  <motion.div
                    key={i}
                    className="glass-card p-4 hover:border-primary/30 transition-all cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        n.sentiment === "positive" ? "bg-bull" :
                        n.sentiment === "negative" ? "bg-bear" : "bg-hold"
                      }`} />
                      <div>
                        <p className="text-sm text-foreground font-medium leading-snug">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">{n.source} · {n.time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Trending */}
            <TrendingStocks stocks={trendingStocks} />
          </main>

          {/* Footer */}
          <footer className="border-t border-border/50 py-6">
            <div className="container mx-auto px-4 text-center">
              <p
                className="text-xs text-muted-foreground cursor-default select-none"
                onClick={handleFooterClick}
              >
                AI-based probabilistic research analysis · Not SEBI registered · Invest at your own risk
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Index;

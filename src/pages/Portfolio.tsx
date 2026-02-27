import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { enrichWithPrices, getDefaultPortfolioStocks, type PortfolioStock } from "@/lib/portfolioData";
import { generateMockFnOPositions, type FnOPosition } from "@/lib/fnoData";
import { generateMockMutualFunds, type MutualFund } from "@/lib/mfData";

const PortfolioOverview = lazy(() => import("@/components/portfolio/PortfolioOverview"));
const EquityTab = lazy(() => import("@/components/portfolio/EquityTab"));
const FnOTab = lazy(() => import("@/components/portfolio/FnOTab"));
const MutualFundsTab = lazy(() => import("@/components/portfolio/MutualFundsTab"));

const TAB_KEY = "portfolio-active-tab";

const Portfolio = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<PortfolioStock[]>([]);
  const [fnoPositions] = useState<FnOPosition[]>(() => generateMockFnOPositions());
  const [mutualFunds] = useState<MutualFund[]>(() => generateMockMutualFunds());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(TAB_KEY) || "overview");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(TAB_KEY, tab);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
      else setUserId(session.user.id);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUserId(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadPortfolio = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_portfolios")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      if (!data || data.length === 0) {
        const defaults = getDefaultPortfolioStocks();
        const inserts = defaults.map((s) => ({ ...s, user_id: userId }));
        const { error: insertErr } = await supabase.from("user_portfolios").insert(inserts);
        if (insertErr) throw insertErr;
        setStocks(enrichWithPrices(defaults));
      } else {
        setStocks(enrichWithPrices(data.map((d: any) => ({
          symbol: d.symbol, company_name: d.company_name, exchange: d.exchange,
          sector: d.sector, quantity: d.quantity, avg_buy_price: Number(d.avg_buy_price),
        }))));
      }
    } catch (err: any) {
      toast.error("Failed to load portfolio");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadPortfolio(); }, [loadPortfolio]);

  // Refresh prices every 30s
  useEffect(() => {
    if (stocks.length === 0) return;
    const interval = setInterval(() => {
      setStocks((prev) =>
        enrichWithPrices(prev.map((s) => ({
          symbol: s.symbol, company_name: s.company_name, exchange: s.exchange,
          sector: s.sector, quantity: s.quantity, avg_buy_price: s.avg_buy_price,
        })))
      );
    }, 30000);
    return () => clearInterval(interval);
  }, [stocks.length]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const tabLoader = (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-30 bg-background/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">StockAI</span>
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full max-w-lg mb-6 grid grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="equity">Equity</TabsTrigger>
            <TabsTrigger value="fno">F&O</TabsTrigger>
            <TabsTrigger value="mf">Mutual Funds</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Suspense fallback={tabLoader}>
              <PortfolioOverview equityStocks={stocks} fnoPositions={fnoPositions} mutualFunds={mutualFunds} />
            </Suspense>
          </TabsContent>

          <TabsContent value="equity">
            <Suspense fallback={tabLoader}>
              <EquityTab stocks={stocks} />
            </Suspense>
          </TabsContent>

          <TabsContent value="fno">
            <Suspense fallback={tabLoader}>
              <FnOTab positions={fnoPositions} />
            </Suspense>
          </TabsContent>

          <TabsContent value="mf">
            <Suspense fallback={tabLoader}>
              <MutualFundsTab funds={mutualFunds} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Portfolio;

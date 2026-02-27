import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Plus, Trash2, Power, PowerOff, ArrowLeft, LogOut,
  TrendingUp, Search, BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { companies } from "@/data/companies";

interface FeaturedStock {
  id: string;
  symbol: string;
  company_name: string;
  exchange: string;
  sector: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<FeaturedStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchStocks();
  }, [token, navigate]);

  const fetchStocks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-stocks", {
        body: { action: "list", token },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStocks(data.stocks || []);
    } catch (err: any) {
      toast.error("Failed to load stocks");
      if (err.message?.includes("Unauthorized") || err.message?.includes("Invalid token")) {
        localStorage.removeItem("admin_token");
        navigate("/admin");
      }
    } finally {
      setLoading(false);
    }
  };

  const addStock = async (company: typeof companies[0]) => {
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-stocks", {
        body: {
          action: "add",
          token,
          symbol: company.symbol,
          company_name: company.name,
          exchange: company.exchange,
          sector: company.sector,
          display_order: stocks.length,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`${company.symbol} added to featured stocks`);
      setShowAddModal(false);
      setSearchQuery("");
      fetchStocks();
    } catch (err: any) {
      toast.error(err.message || "Failed to add stock");
    } finally {
      setAdding(false);
    }
  };

  const deleteStock = async (id: string, symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-stocks", {
        body: { action: "delete", token, id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`${symbol} removed`);
      fetchStocks();
    } catch (err: any) {
      toast.error("Failed to delete stock");
    }
  };

  const toggleStock = async (id: string, is_active: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-stocks", {
        body: { action: "toggle", token, id, is_active: !is_active },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      fetchStocks();
    } catch (err: any) {
      toast.error("Failed to toggle stock");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    toast.success("Logged out");
    navigate("/");
  };

  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    if (q.length < 2) return false;
    const alreadyAdded = stocks.some((s) => s.symbol === c.symbol);
    return (
      !alreadyAdded &&
      (c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-30 bg-background/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-[10px] text-muted-foreground font-mono">STOCK MANAGEMENT</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total Stocks", value: stocks.length, icon: BarChart3 },
            { label: "Active", value: stocks.filter((s) => s.is_active).length, icon: TrendingUp },
            { label: "Inactive", value: stocks.filter((s) => !s.is_active).length, icon: PowerOff },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="glass-card p-4 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Add Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Featured Stocks</h2>
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
            whileTap={{ scale: 0.97 }}
          >
            <Plus className="w-4 h-4" />
            Add Stock
          </motion.button>
        </div>

        {/* Stocks List */}
        <div className="space-y-2">
          <AnimatePresence>
            {stocks.length === 0 ? (
              <motion.div
                className="glass-card p-12 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No featured stocks yet</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Add stocks to display on the homepage</p>
              </motion.div>
            ) : (
              stocks.map((stock, i) => (
                <motion.div
                  key={stock.id}
                  className={`glass-card p-4 flex items-center justify-between group ${
                    !stock.is_active ? "opacity-50" : ""
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: stock.is_active ? 1 : 0.5, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold font-mono text-primary">
                        {stock.symbol.slice(0, 3)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{stock.company_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">{stock.symbol}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{stock.exchange}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-primary/70">{stock.sector}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStock(stock.id, stock.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        stock.is_active
                          ? "text-bull hover:bg-bull/10"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                      title={stock.is_active ? "Deactivate" : "Activate"}
                    >
                      {stock.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteStock(stock.id, stock.symbol)}
                      className="p-2 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="w-full max-w-lg glass-card border border-primary/20 p-6"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-foreground mb-4">Add Stock to Featured</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                  placeholder="Search by name, symbol, or sector..."
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-hide">
                {filteredCompanies.length === 0 && searchQuery.length >= 2 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No matching stocks found</p>
                )}
                {searchQuery.length < 2 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Type at least 2 characters to search</p>
                )}
                {filteredCompanies.map((company) => (
                  <motion.button
                    key={company.symbol}
                    onClick={() => addStock(company)}
                    disabled={adding}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all text-left"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{company.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">{company.symbol}</span>
                        <span className="text-[10px] text-primary/70">{company.sector}</span>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery("");
                }}
                className="w-full mt-4 py-2 rounded-xl bg-secondary text-muted-foreground text-sm hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;

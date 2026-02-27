import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Loader2 } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PortfolioStock } from "@/lib/portfolioData";

const SECTOR_COLORS = [
  "hsl(145, 72%, 45%)", "hsl(200, 80%, 50%)", "hsl(280, 60%, 55%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 55%)", "hsl(180, 60%, 45%)",
  "hsl(320, 60%, 50%)", "hsl(60, 80%, 45%)", "hsl(220, 70%, 55%)",
  "hsl(100, 60%, 40%)",
];

interface Props {
  stocks: PortfolioStock[];
}

export default function EquityTab({ stocks }: Props) {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const totalInvested = stocks.reduce((s, st) => s + st.avg_buy_price * st.quantity, 0);
  const totalCurrent = stocks.reduce((s, st) => s + st.current_price * st.quantity, 0);
  const totalPL = totalCurrent - totalInvested;
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  const sectorMap: Record<string, number> = {};
  stocks.forEach((s) => {
    sectorMap[s.sector] = (sectorMap[s.sector] || 0) + s.current_price * s.quantity;
  });
  const pieData = Object.entries(sectorMap).map(([name, value]) => ({ name, value: Math.round(value) }));

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("portfolio-analysis", {
        body: {
          stocks: stocks.map((s) => ({
            symbol: s.symbol, company_name: s.company_name, sector: s.sector,
            quantity: s.quantity, avg_buy_price: s.avg_buy_price, current_price: s.current_price,
            pl: s.pl, plPct: s.plPct,
          })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data);
      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const fmt = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div>
      {/* Summary */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Invested</p>
          <p className="text-2xl font-bold font-mono text-foreground">{fmt(totalInvested)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Value</p>
          <p className="text-2xl font-bold font-mono text-foreground">{fmt(totalCurrent)}</p>
        </div>
        <div className={`glass-card p-5 border ${totalPL >= 0 ? "border-bull/30" : "border-bear/30"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Equity P&L</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold font-mono ${totalPL >= 0 ? "text-bull" : "text-bear"}`}>{totalPL >= 0 ? "+" : ""}{fmt(totalPL)}</p>
            <span className={`text-sm font-mono ${totalPL >= 0 ? "text-bull" : "text-bear"}`}>({totalPLPct >= 0 ? "+" : ""}{totalPLPct.toFixed(2)}%)</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Table */}
        <div className="lg:col-span-2">
          <motion.div className="glass-card overflow-hidden" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">My Holdings</h2>
              <span className="text-xs text-muted-foreground font-mono">{stocks.length} stocks</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Stock</th>
                    <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Qty</th>
                    <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Price</th>
                    <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">CMP</th>
                    <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((s, i) => (
                    <motion.tr
                      key={s.symbol}
                      className="border-b border-border/20 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/stock/${s.symbol}`)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{s.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{s.company_name.split(" ").slice(0, 2).join(" ")}</p>
                      </td>
                      <td className="text-right px-4 py-3 font-mono text-foreground">{s.quantity}</td>
                      <td className="text-right px-4 py-3 font-mono text-muted-foreground">₹{s.avg_buy_price.toLocaleString("en-IN")}</td>
                      <td className="text-right px-4 py-3">
                        <p className="font-mono text-foreground">₹{s.current_price.toLocaleString("en-IN")}</p>
                        <p className={`text-xs font-mono ${s.change >= 0 ? "text-bull" : "text-bear"}`}>{s.change >= 0 ? "+" : ""}{s.changePct}%</p>
                      </td>
                      <td className="text-right px-4 py-3">
                        <p className={`font-mono font-semibold ${s.pl >= 0 ? "text-bull" : "text-bear"}`}>{s.pl >= 0 ? "+" : ""}₹{s.pl.toLocaleString("en-IN")}</p>
                        <p className={`text-xs font-mono ${s.pl >= 0 ? "text-bull" : "text-bear"}`}>{s.plPct >= 0 ? "+" : ""}{s.plPct.toFixed(1)}%</p>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Sector Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number, name: string) => [`₹${value.toLocaleString("en-IN")}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                  <span className="text-muted-foreground truncate">{d.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 glow-primary"
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {analyzing ? (
              <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</span>
            ) : (
              <span className="flex items-center justify-center gap-2"><BarChart3 className="w-4 h-4" />Analyze My Portfolio</span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div ref={analysisRef} className="mt-8 space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />Portfolio Analysis
            </h2>
            {analysis.summary && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
              </div>
            )}
            {analysis.rankings && (
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <h3 className="text-sm font-semibold text-foreground">Stock Rankings</h3>
                </div>
                <div className="divide-y divide-border/20">
                  {analysis.rankings.map((r: any, i: number) => (
                    <div key={r.symbol} className="p-5 flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${r.recommendation === "BUY" ? "bg-bull/10 text-bull" : r.recommendation === "SELL" ? "bg-bear/10 text-bear" : "bg-hold/10 text-hold"}`}>
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-foreground text-base">{r.symbol}</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${r.recommendation === "BUY" ? "bg-bull/10 text-bull" : r.recommendation === "SELL" ? "bg-bear/10 text-bear" : "bg-hold/10 text-hold"}`}>{r.recommendation}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{r.reasoning}</p>
                        {r.buy_levels && (
                          <div className="mt-3 p-3 rounded-xl bg-bull/5 border border-bull/20">
                            <p className="text-sm text-bull font-semibold">Buy levels: {r.buy_levels.map((l: any) => `₹${Number(l).toLocaleString("en-IN")}`).join(" · ")}</p>
                          </div>
                        )}
                        {r.exit_range && (
                          <div className="mt-2 p-3 rounded-xl bg-bear/5 border border-bear/20">
                            <p className="text-sm text-bear font-semibold">Exit range: ₹{Number(r.exit_range[0]).toLocaleString("en-IN")} – ₹{Number(r.exit_range[1]).toLocaleString("en-IN")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

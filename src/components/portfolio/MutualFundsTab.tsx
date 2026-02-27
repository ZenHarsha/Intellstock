import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Calendar, Pause, Play } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { MutualFund } from "@/lib/mfData";
import { getMFSummary, generateNavHistory } from "@/lib/mfData";
import { toast } from "sonner";

function getCssColor(varName: string): string {
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return val ? `hsl(${val})` : "";
}

interface Props {
  funds: MutualFund[];
}

export default function MutualFundsTab({ funds: initialFunds }: Props) {
  const [funds, setFunds] = useState(initialFunds);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const summary = useMemo(() => getMFSummary(funds), [funds]);
  const activeSips = funds.filter((f) => f.sipActive);

  const [colors, setColors] = useState({
    primary: "hsl(145,72%,40%)",
    grid: "hsl(140,10%,85%)",
    label: "hsl(150,10%,40%)",
    tooltipBg: "hsl(0,0%,100%)",
    tooltipBorder: "hsl(140,10%,85%)",
    bull: "hsl(145,72%,40%)",
    bear: "hsl(0,72%,50%)",
    hold: "hsl(38,92%,45%)",
    chart2: "hsl(145,72%,55%)",
    chart5: "hsl(270,60%,55%)",
  });

  useEffect(() => {
    const update = () => {
      setColors({
        primary: getCssColor("--primary"),
        grid: getCssColor("--border"),
        label: getCssColor("--muted-foreground"),
        tooltipBg: getCssColor("--card"),
        tooltipBorder: getCssColor("--border"),
        bull: getCssColor("--bull"),
        bear: getCssColor("--bear"),
        hold: getCssColor("--hold"),
        chart2: getCssColor("--chart-2"),
        chart5: getCssColor("--chart-5"),
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Cache NAV histories
  const navHistories = useMemo(() => {
    const map: Record<string, ReturnType<typeof generateNavHistory>> = {};
    funds.forEach((f) => { map[f.id] = generateNavHistory(f.nav); });
    return map;
  }, [funds]);

  // Allocation data for pie chart
  const allocationData = useMemo(() => {
    const catMap: Record<string, number> = {};
    funds.forEach((f) => { catMap[f.category] = (catMap[f.category] || 0) + f.currentValue; });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [funds]);

  const PIE_COLORS: Record<string, string> = {
    Equity: colors.bull,
    Debt: colors.chart2,
    Hybrid: colors.hold,
  };

  const fmt = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const toggleSip = (fundId: string) => {
    setFunds((prev) =>
      prev.map((f) => {
        if (f.id !== fundId) return f;
        const newActive = !f.sipActive;
        toast.success(
          newActive
            ? `SIP resumed for ${f.name.split(" - ")[0]}`
            : `SIP paused for ${f.name.split(" - ")[0]}`
        );
        return { ...f, sipActive: newActive };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total MF Value</p>
          <p className="text-xl font-bold font-mono text-foreground">{fmt(summary.totalValue)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Invested</p>
          <p className="text-xl font-bold font-mono text-foreground">{fmt(summary.totalInvested)}</p>
        </div>
        <div className={`glass-card p-5 border ${summary.totalReturns >= 0 ? "border-bull/30" : "border-bear/30"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Returns</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-xl font-bold font-mono ${summary.totalReturns >= 0 ? "text-bull" : "text-bear"}`}>
              {summary.totalReturns >= 0 ? "+" : ""}{fmt(summary.totalReturns)}
            </p>
            <span className={`text-xs font-mono ${summary.totalReturns >= 0 ? "text-bull" : "text-bear"}`}>
              ({summary.totalReturnsPct >= 0 ? "+" : ""}{summary.totalReturnsPct.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className={`glass-card p-5 border ${summary.todayChange >= 0 ? "border-bull/30" : "border-bear/30"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Today's Change</p>
          <div className="flex items-center gap-2">
            {summary.todayChange >= 0 ? <TrendingUp className="w-4 h-4 text-bull" /> : <TrendingDown className="w-4 h-4 text-bear" />}
            <p className={`text-xl font-bold font-mono ${summary.todayChange >= 0 ? "text-bull" : "text-bear"}`}>
              {summary.todayChange >= 0 ? "+" : ""}{fmt(summary.todayChange)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Allocation Pie Chart */}
      <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h3 className="text-sm font-semibold text-foreground mb-3">Category Allocation</h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {allocationData.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name] || colors.chart5} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [fmt(value), ""]}
              />
              <Legend
                formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Fund Holdings */}
      <motion.div className="space-y-3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-sm font-semibold text-foreground">My Funds ({funds.length})</h2>
        {funds.map((f, i) => {
          const isExpanded = expandedId === f.id;
          return (
            <motion.div
              key={f.id}
              className="glass-card overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <div
                className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : f.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm truncate">{f.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        f.category === "Equity" ? "bg-bull/10 text-bull" :
                        f.category === "Debt" ? "bg-accent text-accent-foreground" :
                        "bg-hold/10 text-hold"
                      }`}>{f.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        f.riskLevel === "High" ? "bg-bear/10 text-bear" :
                        f.riskLevel === "Moderate" ? "bg-hold/10 text-hold" :
                        "bg-bull/10 text-bull"
                      }`}>{f.riskLevel} Risk</span>
                      {f.sipActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">SIP Active</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-foreground">{fmt(f.currentValue)}</p>
                      <p className={`text-xs font-mono ${f.returns >= 0 ? "text-bull" : "text-bear"}`}>
                        {f.returns >= 0 ? "+" : ""}{fmt(f.returns)} ({f.returnsPct >= 0 ? "+" : ""}{f.returnsPct.toFixed(1)}%)
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="px-4 pb-4 bg-secondary/20"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Fund Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">NAV</p>
                        <p className="font-mono text-sm text-foreground">₹{f.nav.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Units</p>
                        <p className="font-mono text-sm text-foreground">{f.units.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Invested Value</p>
                        <p className="font-mono text-sm text-foreground">{fmt(f.investedValue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expense Ratio</p>
                        <p className="font-mono text-sm text-foreground">{f.expenseRatio}%</p>
                      </div>
                    </div>

                    {/* NAV History Chart */}
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-foreground mb-2">NAV History (1Y)</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={navHistories[f.id]}>
                          <defs>
                            <linearGradient id={`navGrad-${f.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={f.returns >= 0 ? colors.bull : colors.bear} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={f.returns >= 0 ? colors.bull : colors.bear} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: colors.label }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 9, fill: colors.label }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: "8px", fontSize: "11px", color: "hsl(var(--foreground))" }}
                            formatter={(value: number) => [`₹${value.toFixed(2)}`, "NAV"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="nav"
                            stroke={f.returns >= 0 ? colors.bull : colors.bear}
                            fill={`url(#navGrad-${f.id})`}
                            strokeWidth={2}
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* SIP Controls */}
                    <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <p className="text-xs text-foreground font-medium">
                            {f.sipActive
                              ? `SIP: ${fmt(f.sipAmount!)} · ${f.sipFrequency} · Next: ${f.nextSipDate}`
                              : `SIP: ${fmt(f.sipAmount || 0)} · Paused`}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSip(f.id);
                          }}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            f.sipActive
                              ? "bg-hold/10 text-hold hover:bg-hold/20"
                              : "bg-bull/10 text-bull hover:bg-bull/20"
                          }`}
                        >
                          {f.sipActive ? (
                            <><Pause className="w-3 h-3" /> Pause</>
                          ) : (
                            <><Play className="w-3 h-3" /> Start</>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Active SIPs Summary */}
      {activeSips.length > 0 && (
        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-sm font-semibold text-foreground mb-3">Active SIPs ({activeSips.length})</h3>
          <div className="space-y-2">
            {activeSips.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[60%]">{f.name.split(" - ")[0]}</span>
                <span className="font-mono text-foreground">{fmt(f.sipAmount!)} / {f.sipFrequency?.toLowerCase()}</span>
              </div>
            ))}
            <div className="border-t border-border/30 pt-2 mt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Total SIP</span>
              <span className="font-mono font-bold text-foreground">{fmt(activeSips.reduce((s, f) => s + (f.sipAmount || 0), 0))} / month</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

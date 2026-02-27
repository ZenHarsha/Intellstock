import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from "recharts";
import type { PortfolioStock } from "@/lib/portfolioData";
import type { FnOPosition } from "@/lib/fnoData";
import type { MutualFund } from "@/lib/mfData";

const ALLOC_COLORS = [
  "hsl(145, 72%, 45%)", "hsl(200, 80%, 50%)",
  "hsl(280, 60%, 55%)", "hsl(38, 92%, 50%)",
];

interface Props {
  equityStocks: PortfolioStock[];
  fnoPositions: FnOPosition[];
  mutualFunds: MutualFund[];
}

export default function PortfolioOverview({ equityStocks, fnoPositions, mutualFunds }: Props) {
  const equityValue = equityStocks.reduce((s, st) => s + st.current_price * st.quantity, 0);
  const equityInvested = equityStocks.reduce((s, st) => s + st.avg_buy_price * st.quantity, 0);
  const fnoValue = fnoPositions.reduce((s, p) => s + p.ltp * p.quantity, 0);
  const fnoInvested = fnoPositions.reduce((s, p) => s + p.avgPrice * p.quantity, 0);
  const mfValue = mutualFunds.reduce((s, f) => s + f.currentValue, 0);
  const mfInvested = mutualFunds.reduce((s, f) => s + f.investedValue, 0);
  const cashValue = 125000;

  const totalValue = equityValue + fnoValue + mfValue + cashValue;
  const totalInvested = equityInvested + fnoInvested + mfInvested + cashValue;
  const overallPL = totalValue - totalInvested;
  const overallPLPct = totalInvested > 0 ? (overallPL / totalInvested) * 100 : 0;
  const todayPL = Math.round((Math.random() - 0.4) * totalValue * 0.008);

  const allocData = [
    { name: "Equity", value: Math.round(equityValue) },
    { name: "F&O", value: Math.round(fnoValue) },
    { name: "Mutual Funds", value: Math.round(mfValue) },
    { name: "Cash", value: cashValue },
  ].filter((d) => d.value > 0);

  const fmt = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Portfolio Value</p>
          <p className="text-xl font-bold font-mono text-foreground">{fmt(totalValue)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Invested</p>
          <p className="text-xl font-bold font-mono text-foreground">{fmt(totalInvested)}</p>
        </div>
        <div className={`glass-card p-5 border ${overallPL >= 0 ? "border-bull/30" : "border-bear/30"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Overall P&L</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-xl font-bold font-mono ${overallPL >= 0 ? "text-bull" : "text-bear"}`}>
              {overallPL >= 0 ? "+" : ""}{fmt(overallPL)}
            </p>
            <span className={`text-xs font-mono ${overallPL >= 0 ? "text-bull" : "text-bear"}`}>
              ({overallPLPct >= 0 ? "+" : ""}{overallPLPct.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className={`glass-card p-5 border ${todayPL >= 0 ? "border-bull/30" : "border-bear/30"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Today's P&L</p>
          <div className="flex items-center gap-2">
            {todayPL >= 0 ? <TrendingUp className="w-4 h-4 text-bull" /> : <TrendingDown className="w-4 h-4 text-bear" />}
            <p className={`text-xl font-bold font-mono ${todayPL >= 0 ? "text-bull" : "text-bear"}`}>
              {todayPL >= 0 ? "+" : ""}{fmt(todayPL)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Asset Allocation Chart */}
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Asset Allocation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={allocData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value">
                {allocData.map((_, i) => (
                  <Cell key={i} fill={ALLOC_COLORS[i % ALLOC_COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string) => [fmt(value), name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {allocData.map((d, i) => {
              const pct = Math.round((d.value / totalValue) * 100);
              return (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: ALLOC_COLORS[i] }} />
                    <span className="text-sm text-foreground">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono text-foreground">{fmt(d.value)}</span>
                    <span className="text-xs text-muted-foreground ml-2">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Last Updated */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        Last updated: {new Date().toLocaleTimeString("en-IN")}
      </div>
    </div>
  );
}

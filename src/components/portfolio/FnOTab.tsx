import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, AlertTriangle, Shield } from "lucide-react";
import type { FnOPosition } from "@/lib/fnoData";
import { getFnOSummary } from "@/lib/fnoData";

interface Props {
  positions: FnOPosition[];
}

export default function FnOTab({ positions }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const summary = useMemo(() => getFnOSummary(positions), [positions]);

  const fmt = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <motion.div className="grid grid-cols-2 md:grid-cols-5 gap-4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Margin Used</p>
          <p className="text-lg font-bold font-mono text-foreground">{fmt(summary.totalMarginUsed)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Available Margin</p>
          <p className="text-lg font-bold font-mono text-foreground">{fmt(summary.availableMargin)}</p>
        </div>
        <div className={`glass-card p-4 border ${summary.totalUnrealizedPL >= 0 ? "border-bull/30" : "border-bear/30"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unrealized P&L</p>
          <p className={`text-lg font-bold font-mono ${summary.totalUnrealizedPL >= 0 ? "text-bull" : "text-bear"}`}>
            {summary.totalUnrealizedPL >= 0 ? "+" : ""}{fmt(summary.totalUnrealizedPL)}
          </p>
        </div>
        <div className={`glass-card p-4 border ${summary.realizedPL >= 0 ? "border-bull/30" : "border-bear/30"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Realized P&L</p>
          <p className={`text-lg font-bold font-mono ${summary.realizedPL >= 0 ? "text-bull" : "text-bear"}`}>
            {summary.realizedPL >= 0 ? "+" : ""}{fmt(summary.realizedPL)}
          </p>
        </div>
        <div className={`glass-card p-4 border ${summary.riskLevel === "High" ? "border-bear/30" : summary.riskLevel === "Medium" ? "border-hold/30" : "border-bull/30"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Risk Level</p>
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${summary.riskLevel === "High" ? "text-bear" : summary.riskLevel === "Medium" ? "text-hold" : "text-bull"}`} />
            <p className={`text-lg font-bold ${summary.riskLevel === "High" ? "text-bear" : summary.riskLevel === "Medium" ? "text-hold" : "text-bull"}`}>{summary.riskLevel}</p>
          </div>
        </div>
      </motion.div>

      {/* Risk Warning */}
      {summary.riskLevel === "High" && (
        <motion.div className="flex items-start gap-3 p-4 rounded-xl bg-bear/5 border border-bear/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AlertTriangle className="w-5 h-5 text-bear flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-bear">High Exposure Warning</p>
            <p className="text-xs text-muted-foreground mt-1">Your F&O margin usage is elevated. Consider reducing positions or adding margin to maintain a healthy risk profile.</p>
          </div>
        </motion.div>
      )}

      {/* Positions List */}
      <motion.div className="glass-card overflow-hidden" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Open Positions</h2>
          <span className="text-xs text-muted-foreground font-mono">{positions.length} positions</span>
        </div>
        <div className="divide-y divide-border/20">
          {positions.map((p, i) => {
            const isExpanded = expandedId === p.id;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      p.contractType === "Call" ? "bg-bull/10 text-bull" :
                      p.contractType === "Put" ? "bg-bear/10 text-bear" :
                      "bg-hold/10 text-hold"
                    }`}>
                      {p.contractType === "Futures" ? "FUT" : p.contractType === "Call" ? "CE" : "PE"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{p.instrument}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.contractType !== "Futures" && `₹${p.strikePrice.toLocaleString("en-IN")} · `}
                        Exp: {p.expiry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-muted-foreground">Qty</p>
                      <p className="font-mono text-sm text-foreground">{p.quantity}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-muted-foreground">LTP</p>
                      <p className="font-mono text-sm text-foreground">₹{p.ltp.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-semibold text-sm ${p.unrealizedPL >= 0 ? "text-bull" : "text-bear"}`}>
                        {p.unrealizedPL >= 0 ? "+" : ""}₹{p.unrealizedPL.toLocaleString("en-IN")}
                      </p>
                      <p className={`text-xs font-mono ${p.unrealizedPL >= 0 ? "text-bull" : "text-bear"}`}>
                        {p.unrealizedPLPct >= 0 ? "+" : ""}{p.unrealizedPLPct.toFixed(1)}%
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Price</p>
                          <p className="font-mono text-sm text-foreground">₹{p.avgPrice.toLocaleString("en-IN")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Margin Used</p>
                          <p className="font-mono text-sm text-foreground">{fmt(p.marginUsed)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Entry Time</p>
                          <p className="text-sm text-foreground">{new Date(p.entryTime).toLocaleDateString("en-IN")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity</p>
                          <p className="font-mono text-sm text-foreground">{p.quantity}</p>
                        </div>
                        {p.stopLoss && (
                          <div>
                            <p className="text-xs text-muted-foreground">Stop Loss</p>
                            <p className="font-mono text-sm text-bear">₹{p.stopLoss.toLocaleString("en-IN")}</p>
                          </div>
                        )}
                        {p.target && (
                          <div>
                            <p className="text-xs text-muted-foreground">Target</p>
                            <p className="font-mono text-sm text-bull">₹{p.target.toLocaleString("en-IN")}</p>
                          </div>
                        )}
                        {p.delta !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground">Delta</p>
                            <p className="font-mono text-sm text-foreground">{p.delta}</p>
                          </div>
                        )}
                        {p.theta !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground">Theta</p>
                            <p className="font-mono text-sm text-foreground">{p.theta}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <button className="px-4 py-2 rounded-lg bg-bear/10 text-bear text-xs font-semibold hover:bg-bear/20 transition-colors">
                          Close Position
                        </button>
                        <p className="text-xs text-muted-foreground italic">Mock only – no real execution</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

import { generateMockPrice } from "@/lib/portfolioData";

export interface FnOPosition {
  id: string;
  instrument: string;
  contractType: "Call" | "Put" | "Futures";
  strikePrice: number;
  expiry: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  unrealizedPL: number;
  unrealizedPLPct: number;
  marginUsed: number;
  entryTime: string;
  stopLoss?: number;
  target?: number;
  delta?: number;
  theta?: number;
}

const INSTRUMENTS = ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "HDFCBANK", "INFY"];
const CONTRACT_TYPES: FnOPosition["contractType"][] = ["Call", "Put", "Futures"];

function getNextExpiry(): string {
  const now = new Date();
  const thursday = new Date(now);
  thursday.setDate(now.getDate() + ((4 - now.getDay() + 7) % 7 || 7));
  return thursday.toISOString().split("T")[0];
}

function getMonthlyExpiry(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  while (lastDay.getDay() !== 4) lastDay.setDate(lastDay.getDate() - 1);
  return lastDay.toISOString().split("T")[0];
}

export function generateMockFnOPositions(): FnOPosition[] {
  const expiries = [getNextExpiry(), getMonthlyExpiry()];

  const raw: Array<{ instrument: string; contractType: FnOPosition["contractType"]; strikePrice: number; qty: number }> = [
    { instrument: "NIFTY", contractType: "Call", strikePrice: 24500, qty: 50 },
    { instrument: "NIFTY", contractType: "Put", strikePrice: 24000, qty: 50 },
    { instrument: "BANKNIFTY", contractType: "Call", strikePrice: 52000, qty: 15 },
    { instrument: "BANKNIFTY", contractType: "Futures", strikePrice: 0, qty: 15 },
    { instrument: "RELIANCE", contractType: "Call", strikePrice: 2900, qty: 250 },
    { instrument: "TCS", contractType: "Put", strikePrice: 3800, qty: 125 },
  ];

  const positions: FnOPosition[] = raw.map((p, i) => {
    const basePrice = p.contractType === "Futures"
      ? (p.instrument === "NIFTY" ? 24200 : p.instrument === "BANKNIFTY" ? 51800 : 2800)
      : 50 + Math.random() * 300;
    const avgPrice = Math.round(basePrice * 100) / 100;
    const ltp = Math.round((avgPrice * (0.85 + Math.random() * 0.3)) * 100) / 100;
    const unrealizedPL = Math.round((ltp - avgPrice) * p.qty * 100) / 100;
    const unrealizedPLPct = Math.round((unrealizedPL / (avgPrice * p.qty)) * 10000) / 100;
    const marginUsed = Math.round(avgPrice * p.qty * 0.2);

    return {
      id: `fno-${i}`,
      instrument: p.instrument,
      contractType: p.contractType,
      strikePrice: p.strikePrice,
      expiry: expiries[i % 2],
      quantity: p.qty,
      avgPrice,
      ltp,
      unrealizedPL,
      unrealizedPLPct,
      marginUsed,
      entryTime: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      stopLoss: Math.round(avgPrice * 0.7 * 100) / 100,
      target: Math.round(avgPrice * 1.5 * 100) / 100,
      delta: p.contractType !== "Futures" ? Math.round((Math.random() * 0.8 + 0.1) * (p.contractType === "Put" ? -1 : 1) * 100) / 100 : undefined,
      theta: p.contractType !== "Futures" ? Math.round(-Math.random() * 15 * 100) / 100 : undefined,
    };
  });

  return positions;
}

export function getFnOSummary(positions: FnOPosition[]) {
  const totalMarginUsed = positions.reduce((s, p) => s + p.marginUsed, 0);
  const totalUnrealizedPL = positions.reduce((s, p) => s + p.unrealizedPL, 0);
  const realizedPL = Math.round((Math.random() - 0.3) * 25000);
  const dayPL = Math.round((Math.random() - 0.45) * 8000);
  const availableMargin = Math.round(500000 - totalMarginUsed);
  const riskLevel = totalMarginUsed > 300000 ? "High" : totalMarginUsed > 150000 ? "Medium" : "Low";

  return { totalMarginUsed, availableMargin, totalUnrealizedPL, realizedPL, dayPL, riskLevel };
}

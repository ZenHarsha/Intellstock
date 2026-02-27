import { companies, type Company } from "@/data/companies";

export interface PortfolioStock {
  symbol: string;
  company_name: string;
  exchange: string;
  sector: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number;
  change: number;
  changePct: number;
  pl: number;
  plPct: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateMockPrice(symbol: string): { price: number; change: number; changePct: number } {
  const h = hashStr(symbol + new Date().toDateString());
  const rand = seededRandom(h);
  const basePrice = 200 + rand() * 4800;
  const price = Math.round(basePrice * 100) / 100;
  const change = Math.round((rand() - 0.45) * basePrice * 0.04 * 100) / 100;
  const changePct = Math.round((change / (price - change)) * 10000) / 100;
  return { price, change, changePct };
}

export function getDefaultPortfolioStocks(): Array<{
  symbol: string;
  company_name: string;
  exchange: string;
  sector: string;
  quantity: number;
  avg_buy_price: number;
}> {
  const symbols = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "SBIN", "ITC", "WIPRO", "BHARTIARTL", "BAJFINANCE"];
  return symbols.map((sym) => {
    const c = companies.find((co) => co.symbol === sym)!;
    const { price } = generateMockPrice(sym);
    const buyOffset = (Math.random() - 0.4) * price * 0.15;
    return {
      symbol: c.symbol,
      company_name: c.name,
      exchange: c.exchange,
      sector: c.sector,
      quantity: Math.floor(Math.random() * 50) + 5,
      avg_buy_price: Math.round((price - buyOffset) * 100) / 100,
    };
  });
}

export function enrichWithPrices(
  stocks: Array<{ symbol: string; company_name: string; exchange: string; sector: string; quantity: number; avg_buy_price: number }>
): PortfolioStock[] {
  return stocks.map((s) => {
    const { price, change, changePct } = generateMockPrice(s.symbol);
    const pl = (price - s.avg_buy_price) * s.quantity;
    const plPct = ((price - s.avg_buy_price) / s.avg_buy_price) * 100;
    return {
      ...s,
      current_price: price,
      change,
      changePct,
      pl: Math.round(pl * 100) / 100,
      plPct: Math.round(plPct * 100) / 100,
    };
  });
}

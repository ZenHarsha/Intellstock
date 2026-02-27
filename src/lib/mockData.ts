import type { Company } from "@/data/companies";

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface QuarterlyResult {
  quarter: string;
  revenue: number;
  profit: number;
  eps: number;
}

export interface NewsItem {
  title: string;
  source: string;
  time: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface SentimentData {
  avg_sentiment: number;
  confidence: number;
  direction: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  trend: "STRENGTHENING" | "WEAKENING" | "STABLE";
}

export interface AIAnalysis {
  newsSummary: string[];
  insight: string;
  buyPct: number;
  sellPct: number;
  holdPct: number;
  riskScore: "Low" | "Medium" | "High";
  holdingPeriod: "Short" | "Medium" | "Long";
}

export interface DecisionOutput {
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  explanation: string;
}

export interface PricePoint {
  time: string;
  price: number;
}

export interface StockData {
  company: Company;
  currentPrice: number;
  change: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  volume: string;
  marketCap: string;
  pe: number;
  priceHistory: PricePoint[];
  quarterlyResults: QuarterlyResult[];
  news: NewsItem[];
  sentiment: SentimentData;
  aiAnalysis: AIAnalysis;
  decision: DecisionOutput;
}

const newsHeadlines: Record<string, string[]> = {
  positive: [
    "reports strong quarterly earnings beating estimates",
    "announces strategic expansion into new markets",
    "receives upgraded rating from major brokerage",
    "signs landmark partnership deal worth billions",
    "posts record revenue growth in latest quarter",
  ],
  negative: [
    "faces regulatory scrutiny over compliance concerns",
    "reports lower than expected quarterly profits",
    "sees key management departures in leadership shakeup",
    "impacted by global supply chain disruptions",
    "faces increased competition in core market segment",
  ],
  neutral: [
    "maintains steady growth trajectory in annual review",
    "announces board meeting for quarterly results review",
    "participates in industry conference showcasing roadmap",
    "declares interim dividend for shareholders",
    "completes planned restructuring of business units",
  ],
};

const quarters = ["Q1 FY24", "Q2 FY24", "Q3 FY24", "Q4 FY24", "Q1 FY25", "Q2 FY25", "Q3 FY25", "Q4 FY25"];

export function generateStockData(company: Company): StockData {
  const h = hashCode(company.symbol);
  const rand = seededRandom(h);

  const basePrice = 500 + rand() * 4500;
  const currentPrice = Math.round(basePrice * 100) / 100;
  const changeAmt = (rand() - 0.45) * basePrice * 0.04;
  const change = Math.round(changeAmt * 100) / 100;
  const changePct = Math.round((change / (currentPrice - change)) * 10000) / 100;

  // Price history (30 days)
  const priceHistory: PricePoint[] = [];
  let p = currentPrice - change * 15;
  for (let i = 29; i >= 0; i--) {
    p += (rand() - 0.48) * basePrice * 0.015;
    p = Math.max(p, basePrice * 0.85);
    const date = new Date();
    date.setDate(date.getDate() - i);
    priceHistory.push({
      time: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      price: Math.round(p * 100) / 100,
    });
  }

  // Quarterly results
  const quarterlyResults: QuarterlyResult[] = quarters.map((q) => {
    const rev = 1000 + rand() * 15000;
    const margin = 0.05 + rand() * 0.25;
    return {
      quarter: q,
      revenue: Math.round(rev),
      profit: Math.round(rev * margin),
      eps: Math.round(rand() * 50 * 100) / 100,
    };
  });

  // News
  const sentimentTypes: Array<"positive" | "neutral" | "negative"> = ["positive", "neutral", "negative", "positive", "neutral"];
  const news: NewsItem[] = sentimentTypes.map((s, i) => ({
    title: `${company.name} ${newsHeadlines[s][Math.floor(rand() * 5)]}`,
    source: ["Economic Times", "Moneycontrol", "LiveMint", "CNBC TV18", "Business Standard"][i],
    time: `${Math.floor(rand() * 12) + 1}h ago`,
    sentiment: s,
  }));

  // Sentiment
  const avgSent = Math.round((rand() * 2 - 1) * 100) / 100;
  const sentiment: SentimentData = {
    avg_sentiment: avgSent,
    confidence: Math.round((0.5 + rand() * 0.5) * 100) / 100,
    direction: avgSent > 0.2 ? "POSITIVE" : avgSent < -0.2 ? "NEGATIVE" : "NEUTRAL",
    trend: rand() > 0.6 ? "STRENGTHENING" : rand() > 0.3 ? "STABLE" : "WEAKENING",
  };

  // AI Analysis
  const buyPct = Math.round(25 + rand() * 50);
  const sellPct = Math.round(10 + rand() * (90 - buyPct));
  const holdPct = 100 - buyPct - sellPct;
  const riskOptions: Array<"Low" | "Medium" | "High"> = ["Low", "Medium", "High"];
  const periodOptions: Array<"Short" | "Medium" | "Long"> = ["Short", "Medium", "Long"];

  const aiAnalysis: AIAnalysis = {
    newsSummary: news.slice(0, 5).map((n) => n.title),
    insight: `Based on comprehensive analysis of ${company.name}'s fundamentals, market positioning, and recent quarterly performance, the company shows ${
      buyPct > 50 ? "strong growth potential" : buyPct > 35 ? "moderate outlook" : "cautious positioning"
    } driven by ${company.sector} sector dynamics. Key drivers include revenue trajectory, margin expansion potential, and competitive positioning within the Indian market landscape.`,
    buyPct,
    sellPct,
    holdPct,
    riskScore: riskOptions[Math.floor(rand() * 3)],
    holdingPeriod: periodOptions[Math.floor(rand() * 3)],
  };

  // Decision
  const dominant = buyPct >= sellPct && buyPct >= holdPct ? "BUY" : sellPct >= holdPct ? "SELL" : "HOLD";
  const sentimentModifier = sentiment.direction === "POSITIVE" ? "strengthened by positive market sentiment" : sentiment.direction === "NEGATIVE" ? "tempered by negative market sentiment" : "balanced with neutral market sentiment";
  const decision: DecisionOutput = {
    action: dominant as "BUY" | "SELL" | "HOLD",
    confidence: Math.round((0.55 + rand() * 0.4) * 100) / 100,
    explanation: `The ${dominant} recommendation for ${company.name} is ${sentimentModifier} (confidence: ${sentiment.confidence.toFixed(2)}). AI analysis assigns ${buyPct}% buy / ${sellPct}% sell / ${holdPct}% hold probability. Risk level assessed as ${aiAnalysis.riskScore} with ${aiAnalysis.holdingPeriod}-term holding horizon recommended. This is AI-based probabilistic research analysis.`,
  };

  return {
    company,
    currentPrice,
    change,
    changePct,
    dayHigh: Math.round((currentPrice + rand() * basePrice * 0.02) * 100) / 100,
    dayLow: Math.round((currentPrice - rand() * basePrice * 0.02) * 100) / 100,
    volume: `${(rand() * 50 + 5).toFixed(1)}M`,
    marketCap: `₹${(rand() * 15 + 0.5).toFixed(2)}L Cr`,
    pe: Math.round((10 + rand() * 60) * 100) / 100,
    priceHistory,
    quarterlyResults,
    news,
    sentiment,
    aiAnalysis,
    decision,
  };
}

export function getTrendingSymbols(): string[] {
  return ["RELIANCE", "TCS", "HDFCBANK", "INFY", "BHARTIARTL", "TATAMOTORS", "SBIN", "ITC"];
}

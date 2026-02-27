export interface MutualFund {
  id: string;
  name: string;
  category: "Equity" | "Debt" | "Hybrid";
  nav: number;
  units: number;
  investedValue: number;
  currentValue: number;
  returns: number;
  returnsPct: number;
  riskLevel: "Low" | "Moderate" | "High";
  expenseRatio: number;
  sipActive: boolean;
  sipAmount?: number;
  sipFrequency?: string;
  nextSipDate?: string;
}

export interface NavHistory {
  date: string;
  nav: number;
}

export function generateNavHistory(currentNav: number, months: number = 12): NavHistory[] {
  const data: NavHistory[] = [];
  const now = new Date();
  let nav = currentNav * (0.6 + Math.random() * 0.2); // start lower
  const dailyGrowth = Math.pow(currentNav / nav, 1 / (months * 30));

  for (let i = months * 30; i >= 0; i -= 7) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    nav *= dailyGrowth ** 7 * (0.97 + Math.random() * 0.06);
    data.push({
      date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      nav: Math.round(nav * 100) / 100,
    });
  }
  // Ensure last point matches current NAV
  if (data.length > 0) data[data.length - 1].nav = currentNav;
  return data;
}

export function generateMockMutualFunds(): MutualFund[] {
  const funds: MutualFund[] = [
    { name: "Axis Bluechip Fund - Direct Growth", category: "Equity", nav: 52.34, units: 245.67, invested: 10000, risk: "Moderate", expense: 0.49, sip: true, sipAmt: 5000 },
    { name: "Mirae Asset Large Cap Fund - Direct", category: "Equity", nav: 98.12, units: 102.34, invested: 8000, risk: "Moderate", expense: 0.53, sip: true, sipAmt: 3000 },
    { name: "Parag Parikh Flexi Cap Fund - Direct", category: "Equity", nav: 72.45, units: 180.90, invested: 12000, risk: "High", expense: 0.63, sip: false },
    { name: "HDFC Short Term Debt Fund - Direct", category: "Debt", nav: 28.67, units: 520.30, invested: 15000, risk: "Low", expense: 0.30, sip: true, sipAmt: 10000 },
    { name: "ICICI Pru Balanced Advantage - Direct", category: "Hybrid", nav: 61.23, units: 163.45, invested: 9000, risk: "Moderate", expense: 0.82, sip: false },
    { name: "SBI Equity Hybrid Fund - Direct", category: "Hybrid", nav: 234.56, units: 42.10, invested: 8500, risk: "Moderate", expense: 0.72, sip: true, sipAmt: 2000 },
  ].map((f, i) => {
    const currentValue = Math.round(f.nav * f.units);
    const returns = currentValue - f.invested;
    const returnsPct = Math.round((returns / f.invested) * 10000) / 100;
    const nextSip = new Date();
    nextSip.setDate(nextSip.getDate() + Math.floor(Math.random() * 25) + 1);

    return {
      id: `mf-${i}`,
      name: f.name,
      category: f.category as MutualFund["category"],
      nav: f.nav,
      units: f.units,
      investedValue: f.invested,
      currentValue,
      returns,
      returnsPct,
      riskLevel: f.risk as MutualFund["riskLevel"],
      expenseRatio: f.expense,
      sipActive: f.sip,
      sipAmount: f.sipAmt,
      sipFrequency: f.sip ? "Monthly" : undefined,
      nextSipDate: f.sip ? nextSip.toISOString().split("T")[0] : undefined,
    };
  });

  return funds;
}

export function getMFSummary(funds: MutualFund[]) {
  const totalValue = funds.reduce((s, f) => s + f.currentValue, 0);
  const totalInvested = funds.reduce((s, f) => s + f.investedValue, 0);
  const totalReturns = totalValue - totalInvested;
  const totalReturnsPct = totalInvested > 0 ? Math.round((totalReturns / totalInvested) * 10000) / 100 : 0;
  const todayChange = Math.round((Math.random() - 0.45) * totalValue * 0.01);

  return { totalValue, totalInvested, totalReturns, totalReturnsPct, todayChange };
}

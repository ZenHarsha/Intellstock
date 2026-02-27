export interface Company {
  name: string;
  symbol: string;
  exchange: "NSE" | "BSE";
  sector: string;
}

export const companies: Company[] = [
  { name: "Reliance Industries Limited", symbol: "RELIANCE", exchange: "NSE", sector: "Energy" },
  { name: "Tata Consultancy Services Limited", symbol: "TCS", exchange: "NSE", sector: "IT" },
  { name: "Infosys Limited", symbol: "INFY", exchange: "NSE", sector: "IT" },
  { name: "HDFC Bank Limited", symbol: "HDFCBANK", exchange: "NSE", sector: "Banking" },
  { name: "ICICI Bank Limited", symbol: "ICICIBANK", exchange: "NSE", sector: "Banking" },
  { name: "Bharti Airtel Limited", symbol: "BHARTIARTL", exchange: "NSE", sector: "Telecom" },
  { name: "ITC Limited", symbol: "ITC", exchange: "NSE", sector: "FMCG" },
  { name: "Wipro Limited", symbol: "WIPRO", exchange: "NSE", sector: "IT" },
  { name: "HCL Technologies Limited", symbol: "HCLTECH", exchange: "NSE", sector: "IT" },
  { name: "Asian Paints Limited", symbol: "ASIANPAINT", exchange: "NSE", sector: "Consumer Goods" },
  { name: "Bajaj Finance Limited", symbol: "BAJFINANCE", exchange: "NSE", sector: "Finance" },
  { name: "Maruti Suzuki India Limited", symbol: "MARUTI", exchange: "NSE", sector: "Automobile" },
  { name: "Titan Company Limited", symbol: "TITAN", exchange: "NSE", sector: "Consumer Goods" },
  { name: "Adani Enterprises Limited", symbol: "ADANIENT", exchange: "NSE", sector: "Conglomerate" },
  { name: "State Bank of India", symbol: "SBIN", exchange: "NSE", sector: "Banking" },
  { name: "Kotak Mahindra Bank Limited", symbol: "KOTAKBANK", exchange: "NSE", sector: "Banking" },
  { name: "Larsen & Toubro Limited", symbol: "LT", exchange: "NSE", sector: "Infrastructure" },
  { name: "Sun Pharmaceutical Industries Limited", symbol: "SUNPHARMA", exchange: "NSE", sector: "Pharma" },
  { name: "Axis Bank Limited", symbol: "AXISBANK", exchange: "NSE", sector: "Banking" },
  { name: "Nestle India Limited", symbol: "NESTLEIND", exchange: "NSE", sector: "FMCG" },
  { name: "Tata Motors Limited", symbol: "TATAMOTORS", exchange: "NSE", sector: "Automobile" },
  { name: "Tata Steel Limited", symbol: "TATASTEEL", exchange: "NSE", sector: "Metals" },
  { name: "Power Grid Corporation of India Limited", symbol: "POWERGRID", exchange: "NSE", sector: "Power" },
  { name: "NTPC Limited", symbol: "NTPC", exchange: "NSE", sector: "Power" },
  { name: "UltraTech Cement Limited", symbol: "ULTRACEMCO", exchange: "NSE", sector: "Cement" },
  { name: "Tech Mahindra Limited", symbol: "TECHM", exchange: "NSE", sector: "IT" },
  { name: "IndusInd Bank Limited", symbol: "INDUSINDBK", exchange: "NSE", sector: "Banking" },
  { name: "Hindustan Unilever Limited", symbol: "HINDUNILVR", exchange: "NSE", sector: "FMCG" },
  { name: "Dr. Reddy's Laboratories Limited", symbol: "DRREDDY", exchange: "NSE", sector: "Pharma" },
  { name: "Cipla Limited", symbol: "CIPLA", exchange: "NSE", sector: "Pharma" },
  { name: "Bajaj Auto Limited", symbol: "BAJAJ-AUTO", exchange: "NSE", sector: "Automobile" },
  { name: "Mahindra & Mahindra Limited", symbol: "M&M", exchange: "NSE", sector: "Automobile" },
  { name: "Adani Ports and Special Economic Zone Limited", symbol: "ADANIPORTS", exchange: "NSE", sector: "Infrastructure" },
  { name: "Grasim Industries Limited", symbol: "GRASIM", exchange: "NSE", sector: "Cement" },
  { name: "Divis Laboratories Limited", symbol: "DIVISLAB", exchange: "NSE", sector: "Pharma" },
  { name: "JSW Steel Limited", symbol: "JSWSTEEL", exchange: "NSE", sector: "Metals" },
  { name: "Tata Consumer Products Limited", symbol: "TATACONSUM", exchange: "NSE", sector: "FMCG" },
  { name: "Apollo Hospitals Enterprise Limited", symbol: "APOLLOHOSP", exchange: "NSE", sector: "Healthcare" },
  { name: "Eicher Motors Limited", symbol: "EICHERMOT", exchange: "NSE", sector: "Automobile" },
  { name: "Hero MotoCorp Limited", symbol: "HEROMOTOCO", exchange: "NSE", sector: "Automobile" },
];

export function searchCompanies(query: string): Company[] {
  if (query.length < 3) return [];
  const q = query.toLowerCase();
  return companies.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q)
  ).slice(0, 8);
}

export function getCompanyBySymbol(symbol: string): Company | undefined {
  return companies.find((c) => c.symbol === symbol);
}

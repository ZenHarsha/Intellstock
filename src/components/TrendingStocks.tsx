import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import type { Company } from "@/data/companies";
import { generateStockData } from "@/lib/mockData";

interface TrendingStocksProps {
  stocks: Company[];
}

const TrendingStocks = ({ stocks }: TrendingStocksProps) => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Trending Stocks
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stocks.map((company, i) => {
          const data = generateStockData(company);
          const isPositive = data.change >= 0;

          return (
            <motion.button
              key={company.symbol}
              onClick={() => navigate(`/stock/${company.symbol}`)}
              className="glass-card p-4 text-left group hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-muted-foreground">{company.symbol}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-medium text-foreground truncate mb-2">{company.name.split(" ").slice(0, 2).join(" ")}</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-foreground">
                  ₹{data.currentPrice.toLocaleString("en-IN")}
                </span>
                <span className={`flex items-center gap-1 text-xs font-mono font-medium ${isPositive ? "text-bull" : "text-bear"}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? "+" : ""}{data.changePct}%
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingStocks;

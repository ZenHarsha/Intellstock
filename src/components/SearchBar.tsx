import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchCompanies, type Company } from "@/data/companies";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setResults(searchCompanies(query));
  }, [query]);

  const handleSelect = (company: Company) => {
    setQuery("");
    setResults([]);
    setIsFocused(false);
    navigate(`/stock/${company.symbol}`);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div
        className={`relative flex items-center rounded-2xl border transition-all duration-300 ${
          isFocused
            ? "border-primary/50 glow-primary bg-card"
            : "border-border bg-card/60"
        }`}
      >
        <Search className="absolute left-5 w-5 h-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search any Indian listed company..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full bg-transparent pl-14 pr-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
        />
        {query.length > 0 && query.length < 3 && (
          <span className="absolute right-5 text-xs text-muted-foreground">
            Type {3 - query.length} more
          </span>
        )}
      </div>

      <AnimatePresence>
        {results.length > 0 && isFocused && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 glass-card overflow-hidden z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {results.map((company, i) => (
              <motion.button
                key={company.symbol}
                onClick={() => handleSelect(company)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/50 transition-colors text-left"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {company.symbol} · {company.exchange} · {company.sector}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;

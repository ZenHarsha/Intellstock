import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield } from "lucide-react";

interface DisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
}

const DisclaimerModal = ({ open, onAccept }: DisclaimerModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/20"
                initial={{
                  x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
                  y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
                }}
                animate={{
                  y: [null, -100],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <motion.div
            className="glass-card glow-primary p-8 max-w-lg mx-4 relative"
            initial={{ scale: 0.8, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.1 }}
          >
            {/* Header */}
            <motion.div
              className="flex items-center gap-4 mb-6"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-bear/10 border border-bear/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-bear" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Important Disclaimer</h2>
                <p className="text-sm text-muted-foreground">Please read carefully before proceeding</p>
              </div>
            </motion.div>

            {/* Disclaimer text */}
            <motion.div
              className="bg-secondary/50 rounded-xl p-5 mb-6 border border-border/30"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-foreground/90 leading-relaxed text-sm">
                This platform provides AI-generated research and analysis. We are{" "}
                <span className="text-bear font-bold">NOT SEBI registered advisors</span>. All investments carry risk.
                Invest at your own responsibility. The company is not liable for financial losses.
              </p>
            </motion.div>

            {/* Badge */}
            <motion.div
              className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-hold/5 border border-hold/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Shield className="w-4 h-4 text-hold" />
              <span className="text-xs text-hold font-medium">AI-based probabilistic research analysis</span>
            </motion.div>

            {/* Accept button */}
            <motion.button
              onClick={onAccept}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              I Understand & Accept
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DisclaimerModal;

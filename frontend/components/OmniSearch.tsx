"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, Sparkles, Loader2, ArrowRight } from "lucide-react";

interface OmniSearchProps {
  onSearch?: (q: string) => void;
  isLoading?: boolean;
  isBottom?: boolean;
}

export const OmniSearch = ({ onSearch, isLoading = false, isBottom = false }: OmniSearchProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    if (query.trim() && onSearch && !isLoading) {
      onSearch(query);
      setQuery("");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto relative group">
      <motion.div
        initial="hidden"
        animate={isFocused ? "focused" : "visible"}
        variants={{
          hidden: { opacity: 0, y: -30 },
          visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 16px rgba(0, 0, 0, 0.4)",
            transition: { type: "spring", stiffness: 400, damping: 30, staggerChildren: 0.1 }
          },
          focused: {
            opacity: 1, 
            y: 0, 
            scale: 1.01,
            boxShadow: "0 0 15px rgba(6, 182, 212, 0.4), 0 0 30px rgba(168, 85, 247, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            transition: { type: "spring", stiffness: 400, damping: 30 }
          }
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="rounded-full flex items-center p-3 pr-5 transition-all bg-white/[0.05] backdrop-blur-xl border border-white/10"
      >
        <motion.div 
          variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 }, focused: { opacity: 1, y: 0 } }}
          className="flex items-center justify-center pl-3 pr-3 border-r border-white/10 mr-3"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : (
            <Search className={`w-5 h-5 transition-colors ${isFocused ? "text-blue-500" : "text-slate-400"}`} />
          )}
        </motion.div>

        <motion.input
          variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 }, focused: { opacity: 1, y: 0 } }}
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask anything about your research... (Cmd + K)"
          className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500 py-2.5 px-2 text-sm font-medium"
        />

        <motion.div 
          variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 }, focused: { opacity: 1, y: 0 } }}
          className="flex items-center gap-3"
        >
          {!query && !isLoading && (
            <div className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold text-slate-400 transition-opacity ${isFocused ? "opacity-0" : "opacity-100"}`}>
              <Command className="w-3.5 h-3.5" />
              <span>K</span>
            </div>
          )}

          <AnimatePresence>
            {(query || isLoading) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleSearch}
                disabled={isLoading}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
                  isLoading ? "bg-slate-600" : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-cyan-500/20"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Focus Hints */}
      <AnimatePresence>
        {isFocused && !isLoading && !isBottom && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-3 w-full bg-[#0a0a0a]/95 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-2xl z-30"
          >
            <div className="flex flex-wrap gap-3">
              <span className="text-xs px-3 py-2 rounded-xl bg-white/5 text-slate-300 border border-white/10 flex items-center gap-2 cursor-pointer hover:bg-white/10 hover:text-white transition-colors font-medium">
                <Sparkles className="w-4 h-4 text-blue-400" strokeWidth={1.5} /> Summarize my document
              </span>
              <span className="text-xs px-3 py-2 rounded-xl bg-white/5 text-slate-300 border border-white/10 flex items-center gap-2 cursor-pointer hover:bg-white/10 hover:text-white transition-colors font-medium">
                <Sparkles className="w-4 h-4 text-indigo-400" strokeWidth={1.5} /> Key findings
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

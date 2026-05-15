"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10"
    >
      <Link href="/" className="flex items-center gap-2.5 group">
        <motion.div
          className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform relative"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-white font-black text-lg">N</span>
          {/* Orbiting particle */}
          <motion.div
            className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full"
            style={{ animation: "orbit 3s linear infinite" }}
          />
        </motion.div>
        <span
          className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"
          style={{ backgroundSize: "200% auto", animation: "text-shimmer 3s linear infinite" }}
        >
          Aethon AI
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
        <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/auth?mode=login">
          <button className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Log In
          </button>
        </Link>
        <Link href="/auth?mode=signup">
          <button className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            Get Started
          </button>
        </Link>
      </div>
    </motion.nav>
  );
};

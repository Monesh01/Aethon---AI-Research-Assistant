"use client";

import React, { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Globe, ArrowRight, UserPlus, LogIn, AlertCircle, Loader2, Shield, Zap, Brain, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/api";

// ─── Animated dot grid background for left panel ───
const DotGrid = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.07]"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="dotgrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dotgrid)" />
  </svg>
);

const features = [
  {
    icon: <Brain className="w-5 h-5 text-blue-400" />,
    title: "Multi agentic engine",
    desc: "Agentic RAG pipeline with semantic reranking",
  },
  {
    icon: <Zap className="w-5 h-5 text-indigo-400" />,
    title: "Real-time Streaming",
    desc: "Sub-second token streaming with LangGraph",
  },
  {
    icon: <Shield className="w-5 h-5 text-violet-400" />,
    title: "Secure by Default",
    desc: "Session-isolated vector databases per user",
  },
];

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        const data = await signIn(email, password);
        if (data.error) throw new Error(data.error);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("session_id", data.session_id);
        localStorage.setItem("supabase_session", JSON.stringify(data.session));
        router.push("/dashboard");
      } else {
        const data = await signUp(email, password);
        if (data.error) throw new Error(data.error);
        setMode("login");
        setError("Account created! Please sign in.");
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#060915]">

      {/* ── LEFT PANEL: Branding ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[58%] xl:w-[60%] relative flex-col justify-between p-14 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #060915 0%, #0d1117 40%, #0f172a 100%)",
        }}
      >
        {/* Background layers */}
        <DotGrid />
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-[40%] right-[10%] w-[200px] h-[200px] rounded-full bg-violet-600/8 blur-[80px] pointer-events-none" />

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-lg">N</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">Aethon AI</span>
          </Link>
        </div>

        {/* Middle: Hero text */}
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">AI Research Platform</span>
            </div>
            <h1 className="text-5xl font-black text-white leading-[1.1] mb-5">
              Your Intelligence,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">
                Amplified.
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed font-[450]">
              Upload documents. Ask anything. Get precise answers powered by Multi agentic intelligence and ChromaDB — streamed in real time.
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-10 space-y-3"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm hover:bg-white/[0.05] hover:border-white/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/8 transition-all">
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white">{f.title}</div>
                  <div className="text-xs text-slate-500 truncate">{f.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 ml-auto shrink-0 group-hover:text-slate-400 transition-colors" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom: Testimonial */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="relative z-10 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]"
        >
          <p className="text-slate-400 text-sm leading-relaxed italic mb-3">
            "Aethon AI completely changed how I interact with research papers. Answers are instant and grounded in the document."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">S</div>
            <div>
              <div className="text-xs font-bold text-white">S. Monesh</div>
              <div className="text-[10px] text-slate-500">AI Research Engineer</div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── RIGHT PANEL: Auth Form ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-16 xl:px-20 relative bg-[#0d1117] border-l border-white/[0.06]"
      >
        {/* Top-right: back link (desktop only on right panel) */}
        <div className="absolute top-8 right-8 lg:right-10">
          <Link
            href="/"
            className="hidden lg:flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-xs font-semibold group"
          >
            ← Back to Home
          </Link>
          {/* Mobile back link */}
          <Link
            href="/"
            className="flex lg:hidden items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-xs font-semibold"
          >
            ← Home
          </Link>
        </div>

        <div className="w-full max-w-[400px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">N</span>
              </div>
              <span className="text-white font-black text-base">Aethon AI</span>
            </div>
            <h2 className="text-[28px] font-black text-white mb-1.5 tracking-tight">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-slate-500 text-sm">
              {mode === "login"
                ? "Sign in to access your research workspace."
                : "Join Aethon AI — the elite AI research platform."}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-white/5 p-1 rounded-xl mb-7 border border-white/[0.08]">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-white/10 text-white shadow-sm border border-white/10"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-white/10 text-white shadow-sm border border-white/10"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error alert */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: [0, -6, 6, -6, 6, 0] }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.4, x: { duration: 0.3 } }}
                className={`mb-5 p-3.5 rounded-xl flex items-center gap-3 text-sm font-semibold border ${
                  error.includes("created")
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3.5 pl-10 pr-4 text-sm text-white font-medium placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all hover:border-white/15"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3.5 pl-10 pr-4 text-sm text-white font-medium placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all hover:border-white/15"
                />
              </div>
            </div>

            {/* Forgot password */}
            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 group disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "login" ? (
                <>Sign In <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              ) : (
                <>Create Account <UserPlus className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <span className="relative px-4 text-[10px] font-bold text-slate-600 bg-[#0d1117] uppercase tracking-widest">
              or continue with
            </span>
          </div>

          {/* OAuth stub buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled
              className="flex items-center justify-center gap-2 bg-white/[0.04] py-3 rounded-xl border border-white/[0.08] opacity-40 cursor-not-allowed hover:opacity-40"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400">Google</span>
            </button>
            <button
              disabled
              className="flex items-center justify-center gap-2 bg-white/[0.04] py-3 rounded-xl border border-white/[0.08] opacity-40 cursor-not-allowed hover:opacity-40"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400">GitHub</span>
            </button>
          </div>

          <p className="text-center mt-8 text-[11px] text-slate-600 leading-relaxed">
            By continuing, you agree to our{" "}
            <span className="text-blue-500 hover:text-blue-400 cursor-pointer transition-colors">Terms</span>
            {" "}and{" "}
            <span className="text-blue-500 hover:text-blue-400 cursor-pointer transition-colors">Privacy Policy</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#060915] text-white font-bold">
          Initializing Lab...
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

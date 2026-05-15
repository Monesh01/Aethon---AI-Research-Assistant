"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { NeuralNetworkBackground } from "@/components/NeuralNetworkBackground";
import { NeuralScrollytelling } from "@/components/NeuralScrollytelling";
import { ArrowRight, FileText, Volume2, Brain, Bot, Sparkles } from "lucide-react";
import { AmbientLighting } from "@/components/AmbientLighting";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const titleContainerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (titleContainerRef.current) {
      const letters = titleContainerRef.current.querySelectorAll(".letter");
      
      gsap.fromTo(letters, 
        { 
          opacity: 0, 
          y: 60, 
          rotateX: -90, 
          filter: "blur(10px)",
          scale: 0.8 
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          filter: "blur(0px)",
          scale: 1,
          duration: 1.2,
          stagger: 0.08,
          ease: "expo.out",
          delay: 0.5
        }
      );

      // Shimmer effect
      gsap.to(letters, {
        backgroundPosition: "200% center",
        duration: 3,
        repeat: -1,
        ease: "linear",
        stagger: 0.1
      });
    }
  }, []);

  const features = [
    {
      icon: <FileText className="w-7 h-7" />,
      title: "Multi-Modal Parsing",
      desc: "Instant markdown & table extraction with Gemini 3.1 Flash vision captioning.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: <Volume2 className="w-7 h-7" />,
      title: "Neural Voice Synthesis",
      desc: "Listen to the RAG output via real-time Gemini 2.5 Flash TTS.",
      color: "from-violet-500 to-purple-600",
    },
    {
      icon: <Brain className="w-7 h-7" />,
      title: "Vector Data Retrieval",
      desc: "Semantic ChromaDB chunking with BGE-Reranker for pinpoint accuracy.",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      icon: <Bot className="w-7 h-7" />,
      title: "Multi agentic intelligence",
      desc: "Intelligent query routing and autonomous 3D Mermaid architecture drawing.",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className="relative selection:bg-cyan-500/30 selection:text-cyan-100 bg-[#0a0a0a] text-slate-200">
      <Navbar />
      <NeuralNetworkBackground />

      {/* ─── Hero Section ─── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative z-10 pt-20 overflow-hidden">
        {/* Realistic Cybernetic Lightning Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[150px] pointer-events-none animate-lightning-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-violet-600/20 rounded-full blur-[150px] pointer-events-none [animation-delay:2s] animate-lightning-pulse" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[10px] font-black text-slate-300 mb-8 uppercase tracking-[0.3em] flex items-center gap-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Intelligence Redefined
        </motion.div>

        <h1 ref={titleContainerRef} className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.9]">
          <span className="text-white block overflow-hidden">
            <span className="inline-block translate-y-0 text-[0.8em] font-medium text-slate-400 mb-2">Unleash</span>
          </span>
          <span className="flex flex-wrap justify-center overflow-hidden py-4" style={{ perspective: "1000px" }}>
            {"Aethon AI".split("").map((l, i) => (
              <span 
                key={i} 
                className="letter inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"
                style={{ backgroundSize: "200% auto" }}
              >
                {l}
              </span>
            ))}
            <span className="letter text-blue-600">.</span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed font-medium mx-auto"
        >
          Supercharge your workflow. Instantly parse PDFs into Markdown, embed with Gemini, retrieve via ChromaDB Vectors, and analyze with powerful Multi agentic intelligence. 
        </motion.p>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 1.8, duration: 0.8 }}
           className="flex flex-col sm:flex-row gap-5 relative z-10"
        >
          <Link href="/auth?mode=signup">
            <button className="px-12 py-5 bg-white text-slate-900 rounded-2xl font-bold transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:bg-slate-200 flex items-center gap-3 group active:scale-95">
              Launch Research <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link href="/auth?mode=login">
            <button className="px-12 py-5 bg-transparent border border-white/20 text-white rounded-2xl font-bold transition-all hover:bg-white/10 flex items-center gap-3 active:scale-95">
              Access Vault
            </button>
          </Link>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scroll to explore</span>
            <div className="w-0.5 h-12 bg-gradient-to-b from-slate-400 to-transparent" />
        </motion.div>
      </section>

      {/* ─── 3D Scrollytelling Section ─── */}
      <NeuralScrollytelling />

      {/* ─── Final Features Grid ─── */}
      <section className="py-40 px-6 max-w-6xl mx-auto relative z-10 bg-transparent">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Built for <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">Speed & Scale</span></h2>
          <p className="text-slate-400 font-medium max-w-xl mx-auto text-lg leading-relaxed">
            Running exclusively on local LangGraph agents, blazing-fast Groq inference, and state-of-the-art multimodal vision capability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-8 shadow-xl group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="py-20 text-center px-6 relative z-10 bg-transparent border-t border-white/5">
        <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black">N</div>
            <span className="text-xl font-black text-white tracking-tighter">Aethon AI</span>
        </div>
        <p className="text-slate-500 text-sm font-medium">
            &copy; 2026 Aethon AI Research Assistant. All rights reserved.
        </p>
      </footer>

      <AmbientLighting />
    </div>
  );
}

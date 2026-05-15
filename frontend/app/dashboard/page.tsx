"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { OmniSearch } from "@/components/OmniSearch";
import { InlineAudioPlayer } from "@/components/AudioPlayer";
import { DashboardNeuralNetwork } from "@/components/DashboardNeuralNetwork";
import { AmbientLighting } from "@/components/AmbientLighting";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Upload, FileText, X, AlertCircle, Loader2, CheckCircle2, Brain, Plus, Minus, Maximize2, Bot, Copy, Check, ExternalLink } from "lucide-react";
import { queryAssistant, uploadFile } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

const MermaidViewer = ({ chart }: { chart: string }) => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (chart) {
      mermaid
        .render(`mermaid-${Math.random().toString(36).substring(2, 11)}`, chart)
        .then((result) => setSvgContent(result.svg))
        .catch((e) => console.error("Mermaid parsing error", e));
    }
  }, [chart]);

  const ViewerContent = ({ isModal = false }: { isModal?: boolean }) => (
    <div className={`relative overflow-hidden group bg-[#0d1117] flex-shrink-0 border border-white/10 rounded-lg max-w-full ${isModal ? 'w-[90vw] h-[90vh] shadow-2xl' : 'w-full h-[400px] my-4'}`}>
      <div className={`absolute top-4 right-4 z-20 flex flex-col gap-2 transition-all duration-300 ${isModal ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0'}`}>
        <button onClick={(e) => { e.stopPropagation(); setScale((s) => Math.min(s + 0.2, 4)); }} className="p-2 bg-white/5 backdrop-blur-md rounded-xl shadow-sm border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:shadow-md transition-all active:scale-90" title="Zoom In"><Plus className="w-4 h-4" strokeWidth={1.5} /></button>
        <button onClick={(e) => { e.stopPropagation(); setScale((s) => Math.max(s - 0.2, 0.4)); }} className="p-2 bg-white/5 backdrop-blur-md rounded-xl shadow-sm border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:shadow-md transition-all active:scale-90" title="Zoom Out"><Minus className="w-4 h-4" strokeWidth={1.5} /></button>
        <button onClick={(e) => { e.stopPropagation(); setScale(1); }} className="p-2 bg-white/5 backdrop-blur-md rounded-xl shadow-sm border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:shadow-md transition-all active:scale-90" title="Reset Zoom"><Maximize2 className="w-4 h-4" strokeWidth={1.5} /></button>
        {isModal ? (
          <button onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }} className="p-2 bg-red-500/10 backdrop-blur-md rounded-xl shadow-sm border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all active:scale-90 mt-2" title="Close">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }} className="p-2 bg-blue-500/10 backdrop-blur-md rounded-xl shadow-sm border border-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all active:scale-90 mt-2" title="Expand (Fullscreen)">
            <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
      </div>
      <motion.div drag dragMomentum={false} animate={{ scale }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing p-4">
        <div dangerouslySetInnerHTML={{ __html: svgContent }} className="pointer-events-none transition-transform duration-200 flex items-center justify-center w-full" />
      </motion.div>
    </div>
  );

  return (
    <>
      <ViewerContent />
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsFullscreen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <ViewerContent isModal={true} />
          </div>
        </div>
      )}
    </>
  );
};

// ─── Professional Code Block with Copy Button ───
const CodeBlock = ({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
        >
          {copied ? (
            <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
          ) : (
            <><Copy className="w-3 h-3" /><span>Copy</span></>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-slate-300 font-mono custom-scrollbar">
        <code>{children}</code>
      </pre>
    </div>
  );
};

// ─── Professional Markdown Components ───
const markdownComponents: any = {
  // Headings
  h1: ({ children }: any) => (
    <h1 className="text-2xl font-black text-white mt-8 mb-4 pb-3 border-b border-white/10 bg-clip-text">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xl font-black text-white mt-7 mb-3 pb-2 border-b border-white/5">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-lg font-bold text-blue-300 mt-6 mb-2">{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-base font-bold text-slate-200 mt-5 mb-2">{children}</h4>
  ),

  // Paragraphs
  p: ({ children }: any) => (
    <p className="text-[15px] leading-[1.85] text-slate-300 mb-4 font-[450]">{children}</p>
  ),

  // Inline code
  code: ({ children, className, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const isBlock = className?.startsWith('language-');

    if (isBlock && language === 'mermaid') {
      return <MermaidViewer chart={String(children).replace(/\n$/, '')} />;
    }
    if (isBlock) {
      return <CodeBlock language={language}>{String(children).replace(/\n$/, '')}</CodeBlock>;
    }
    return (
      <code className="bg-white/10 text-blue-300 text-[13px] font-mono px-1.5 py-0.5 rounded-md border border-white/10" {...props}>
        {children}
      </code>
    );
  },

  // Pre wrapper (markdown-it wraps code in pre > code)
  pre: ({ children }: any) => <>{children}</>,

  // Blockquote
  blockquote: ({ children }: any) => (
    <blockquote className="my-4 pl-4 border-l-4 border-blue-500/70 bg-blue-500/5 py-3 pr-4 rounded-r-xl text-slate-300 italic">
      {children}
    </blockquote>
  ),

  // Unordered list
  ul: ({ children }: any) => (
    <ul className="my-3 ml-2 space-y-1.5 list-none">{children}</ul>
  ),
  li: ({ children, ordered, index, ...props }: any) => (
    <li className="flex items-start gap-2.5 text-[15px] text-slate-300 leading-relaxed">
      {ordered ? (
        <span className="mt-[1px] text-[13px] font-bold text-blue-400 shrink-0 w-5 text-right">{(index ?? 0) + 1}.</span>
      ) : (
        <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
      )}
      <span>{children}</span>
    </li>
  ),

  // Ordered list
  ol: ({ children }: any) => (
    <ol className="my-3 ml-2 space-y-1.5 list-none">{children}</ol>
  ),

  // Strong / bold
  strong: ({ children }: any) => (
    <strong className="font-bold text-white">{children}</strong>
  ),

  // Emphasis / italic
  em: ({ children }: any) => (
    <em className="italic text-slate-200">{children}</em>
  ),

  // Horizontal rule
  hr: () => <hr className="my-6 border-white/10" />,

  // Links
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 underline underline-offset-2 decoration-blue-400/40 hover:text-blue-300 hover:decoration-blue-300 transition-colors inline-flex items-center gap-0.5 group"
    >
      {children}
      <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
    </a>
  ),

  // Tables
  table: ({ children }: any) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-white/10 custom-scrollbar">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-white/5 border-b border-white/10">{children}</thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-white/5">{children}</tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 text-slate-300 text-[13px]">{children}</td>
  ),

  // Images
  img: ({ src, alt }: any) => (
    <img src={src} alt={alt} className="my-4 rounded-xl border border-white/10 shadow-lg max-w-full" />
  ),
};

// ─── Scrollytelling for Dashboard Empty State ───
const DashboardScrollytelling = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (!containerRef.current) return;
        
        stepsRef.current.forEach((step, i) => {
            if (!step) return;
            gsap.fromTo(step, 
                { opacity: 0, scale: 0.9, y: 50 },
                { 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    scrollTrigger: {
                        trigger: step,
                        start: "top center+=150",
                        end: "bottom center-=150",
                        toggleActions: "play reverse play reverse"
                    }
                }
            );
        });

        // Add a line connecting the steps
        gsap.fromTo(".scrolly-line", 
            { height: "0%" },
            { 
                height: "100%",
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top center",
                    end: "bottom center",
                    scrub: true
                }
            }
        );
    }, []);

    const steps = [
        {
            title: "1. Document Neural Ingestion",
            desc: "Upload a PDF. The backend immediately begins semantic markdown extraction, parsing complex tables and embedding visual charts via Gemini Flash.",
            icon: <FileText className="w-8 h-8 text-blue-500" />,
            color: "bg-blue-50 border-blue-200"
        },
        {
            title: "2. ChromaDB RAG Vectorization",
            desc: "Your data is fractured into highly optimized chunks. It's then mapped into multi-dimensional space utilizing Gemini 2 Embeddings.",
            icon: <Brain className="w-8 h-8 text-violet-500" />,
            color: "bg-violet-50 border-violet-200"
        },
        {
            title: "3. Multi agentic intelligence",
            desc: "Agentic models intercept your queries, deciding exactly which local chunks to retrieve, rerank, and synthesize for precise insights.",
            icon: <Bot className="w-8 h-8 text-emerald-500" />,
            color: "bg-emerald-50 border-emerald-200"
        },
        {
            title: "4. Multi-Modal Synthesis",
            desc: "Experience real-time generation of Voice (TTS), 3D Mermaid Architecture, and impeccably formatted Markdown results.",
            icon: <Sparkles className="w-8 h-8 text-amber-500" />,
            color: "bg-amber-50 border-amber-200"
        }
    ];

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl mx-auto mt-32 mb-40 flex flex-col gap-32">
            <div className="absolute left-[39px] top-0 bottom-0 w-1 bg-slate-100 rounded-full z-0">
                <div className="scrolly-line w-full bg-gradient-to-b from-blue-500 via-emerald-500 to-amber-500 rounded-full" />
            </div>
            
            <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white mb-4">How Aethon AI <span className="text-blue-500">Works</span></h2>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Scroll to Explore the Pipeline</span>
            </div>

            {steps.map((step, i) => (
                <div key={i} ref={el => { stepsRef.current[i] = el; }} className="relative z-10 flex items-center gap-10">
                    <div className={`w-20 h-20 shrink-0 rounded-2xl flex items-center justify-center border shadow-xl bg-slate-900/40 border-white/10 backdrop-blur-xl group hover:border-blue-500/50 transition-colors`}>
                        {step.icon}
                    </div>
                    <div className="glass-morphism p-6 rounded-2xl border border-white/10 shadow-lg flex-1 group hover:border-blue-500/30 transition-colors">
                        <h3 className="text-lg font-black text-white mb-2 group-hover:text-blue-400 transition-colors">{step.title}</h3>
                        <p className="text-slate-400 font-medium text-sm leading-relaxed">{step.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

interface ProcessingStep {
  label: string;
  status: "pending" | "active" | "done";
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; audioSrc?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<{ 
    name: string; 
    title?: string;
    summary?: string; 
    n_chunks?: number; 
    n_pages?: number; 
    pdf_words?: number;
    summary_words?: number 
  }[]>([]);

  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [showProcessing, setShowProcessing] = useState(false);
  const [isKGModalOpen, setIsKGModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) window.location.href = "/auth?mode=login";

    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
      originalWarn(...args);
    };
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isLoading]);

  const handleSearch = async (q: string) => {
    const userId = localStorage.getItem("user_id");
    const sessionId = localStorage.getItem("session_id");
    const sessionStr = localStorage.getItem("supabase_session");
    if (!userId || !sessionId || !sessionStr) return;

    setIsLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: q }]);

    try {
      const session = JSON.parse(sessionStr);
      const stream = await queryAssistant(q, userId, sessionId, session, files.map((f) => f.summary || ""), files.map((f) => f.name));
      if (!stream) throw new Error("No response stream");

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let audioSrc: string | undefined;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);

        if (chunk.includes("||AUDIO_READY:")) {
          const parts = chunk.split(/\|\|AUDIO_READY:(.*?)\|\|/);
          if (parts[0]) assistantMessage += parts[0];
          if (parts[1]) audioSrc = `http://localhost:5000/images_static/${parts[1]}`;
          if (parts[2]) assistantMessage += parts[2];
        } else {
          assistantMessage += chunk;
        }

        const parsedContent = assistantMessage.replace(/\[Image:(.*?)\]/g, "![Image](http://localhost:5000/images_static/$1)");

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: parsedContent, audioSrc };
          return updated;
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to get response from AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const userId = localStorage.getItem("user_id");
    const sessionId = localStorage.getItem("session_id");
    const sessionStr = localStorage.getItem("supabase_session");
    if (!userId || !sessionId || !sessionStr) return;

    setIsUploading(true);
    setError(null);

    const steps: ProcessingStep[] = [
      { label: "Title Extraction", status: "active" },
      { label: "Chunking & Parsing", status: "pending" },
      { label: "Embedding Generation", status: "pending" },
      { label: "Vector Indexing", status: "pending" },
      { label: "PDF Summarization", status: "pending" },
    ];
    setProcessingSteps(steps);
    setShowProcessing(true);

    const progressInterval = setInterval(() => {
      setProcessingSteps((prev) => {
        const activeIdx = prev.findIndex((s) => s.status === "active");
        if (activeIdx === -1 || activeIdx >= prev.length - 1) return prev;
        const next = [...prev];
        next[activeIdx] = { ...next[activeIdx], status: "done" };
        next[activeIdx + 1] = { ...next[activeIdx + 1], status: "active" };
        return next;
      });
    }, 3000);

    try {
      const session = JSON.parse(sessionStr);
      const filesArray = Array.from(selectedFiles);
      const data = await uploadFile(userId, sessionId, session, filesArray);

      clearInterval(progressInterval);
      setProcessingSteps((prev) => prev.map((s) => ({ ...s, status: "done" as const })));

      const newFiles = data.map((item: any) => ({
        name: item.filename,
        title: item.title,
        summary: item.summary,
        n_chunks: item.n_chunks,
        n_pages: item.n_pages,
        pdf_words: item.pdf_words,
        summary_words: item.summary_words,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      setTimeout(() => setShowProcessing(false), 2000);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "Failed to upload files");
      setShowProcessing(false);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-transparent text-slate-900">
      <DashboardNeuralNetwork />
      <Sidebar files={files} onUploadClick={() => fileInputRef.current?.click()} />

      <div className="ml-72 flex-1 flex flex-col relative z-10 w-full overflow-hidden">
        <motion.header 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="p-8 pb-0 flex items-center justify-between relative z-20"
        >
          <motion.div 
            className="flex items-center gap-6 px-7 py-5 rounded-[2rem] bg-slate-900/50 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group hover:border-blue-500/40 transition-all duration-500"
            whileHover={{ scale: 1.02 }}
          >
            {/* Cinematic light sweep */}
            <motion.div 
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
              animate={{ x: ["-300%", "400%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Intrinsic Glow orb */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-blue-500/30 transition-colors duration-700" />

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.5)] relative z-10 border border-blue-400/40 group-hover:shadow-[0_0_35px_rgba(59,130,246,0.7)] transition-shadow duration-500">
              <motion.div
                animate={{ 
                  rotate: [0, 180, 360],
                  scale: [1, 1.15, 1],
                  filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-7 h-7 text-white drop-shadow-md" strokeWidth={1.5} />
              </motion.div>
            </div>

            <div className="relative z-10">
              <h1 className="text-3xl font-black text-white mb-0.5 flex items-center gap-4 drop-shadow-2xl tracking-tight">
                <motion.span
                  className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-blue-400 inline-block"
                  style={{ backgroundSize: "200% auto" }}
                  animate={{ 
                    backgroundPosition: ["0% center", "200% center"],
                    filter: ["drop-shadow(0 0 10px rgba(59,130,246,0.4))", "drop-shadow(0 0 25px rgba(59,130,246,0.8))", "drop-shadow(0 0 10px rgba(59,130,246,0.4))"]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  Aethon AI
                </motion.span>
              </h1>
              <p className="text-blue-200/70 text-[9px] font-black uppercase tracking-[0.35em] pl-0.5">
                {files.length > 0 ? `${files.length} Document${files.length > 1 ? "s" : ""} Neural Index Active` : "Next-Gen Research Intelligence"}
              </p>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            {files.length > 0 && (
              <button
                onClick={() => setIsKGModalOpen(true)}
                className="px-5 py-2.5 bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-xl text-blue-400 font-bold text-xs hover:border-blue-500/50 hover:text-blue-300 hover:bg-blue-500/20 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
              >
                <Brain className="w-4 h-4" />
                Knowledge Graph
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" multiple />
          </div>
        </motion.header>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-8 mt-4 p-4 rounded-xl bg-red-50 backdrop-blur-md border border-red-200 flex items-center gap-3 text-red-600 text-sm font-bold shadow-sm"
            >
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-100/80 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar ${hasMessages ? "pb-28" : ""}`}>
          {!hasMessages && (
            <div className="flex flex-col items-center justify-start pt-16 px-8 py-12 relative z-10 min-h-max">
              {files.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  className="w-full max-w-lg p-8 bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl flex flex-col items-center text-center mb-10 relative group"
                >
                   {/* Ambient Card Glow */}
                   <div className="absolute -inset-4 bg-blue-500/5 blur-[60px] rounded-[3rem] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700" />
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 shadow-sm relative z-10">
                    <FileText className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-black text-white mb-1 relative z-10">Research Ready</h2>
                  <p className="text-blue-400 font-black uppercase tracking-[0.15em] text-[11px] mb-4 relative z-10">
                    {files[files.length - 1].name}
                  </p>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 relative z-10">
                    <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                    Neural Index Ready
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  className="w-full max-w-lg py-16 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[2.5rem] bg-slate-900/20 backdrop-blur-2xl shadow-2xl mb-12 relative group overflow-hidden"
                >
                  {/* Internal ambient glow */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                  
                  {/* Ambient Card Glow */}
                  <div className="absolute -inset-10 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-all duration-1000" />
                  
                  <motion.div 
                    className="w-24 h-24 rounded-[2rem] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-8 transform -rotate-12 shadow-2xl relative z-10 group-hover:rotate-0 transition-transform duration-500"
                    whileHover={{ scale: 1.1 }}
                  >
                    <Upload className="w-12 h-12 text-blue-400" strokeWidth={1} />
                  </motion.div>
                  
                  <h3 className="text-2xl font-black text-white mb-3 tracking-tight relative z-10">Neural Ignition</h3>
                  <p className="text-slate-400 font-medium max-w-[280px] text-center text-[13px] leading-relaxed mb-10 relative z-10">
                    Deploy your research documents to the neural grid for deep-context analysis.
                  </p>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-10 py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_50px_rgba(255,255,255,0.2)] transition-all active:scale-95 border border-transparent hover:bg-blue-50"
                  >
                    Activate Upload
                  </button>
                </motion.div>
              )}
              <motion.div 
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                className="w-full max-w-3xl z-20 sticky top-4 relative group"
              >
                {/* Ambient Search Glow */}
                <div className="absolute -inset-10 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none group-focus-within:bg-blue-500/20 transition-all duration-700" />
                <OmniSearch onSearch={handleSearch} isLoading={isLoading} />
              </motion.div>

              {/* Scrollytelling reveals below search bar when no files exist */}
              {files.length === 0 && (
                  <DashboardScrollytelling />
              )}
            </div>
          )}

          {hasMessages && (
            <div className="flex-1 flex flex-row h-full overflow-hidden relative z-10 w-full max-h-[calc(100vh-140px)]">
              <section ref={scrollContainerRef} className={`overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar w-full transition-all duration-300 pb-32`}>
                {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 min-h-[100px] ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-sm ${
                      msg.role === "assistant"
                        ? "bg-[#0d1117] border border-white/10 text-white shadow-md shadow-blue-500/20"
                        : "bg-white/5 border border-white/10 text-slate-300"
                    }`}
                  >
                    {msg.role === "assistant" ? "N" : "U"}
                  </div>
                  <div
                    className={`p-5 rounded-2xl max-w-[85%] backdrop-blur-[12px] shadow-lg relative ${
                      msg.role === "assistant"
                        ? "bg-white/[0.03] border border-blue-500/20 text-slate-200"
                        : "bg-transparent border border-white/10 text-slate-300"
                    }`}
                  >
                    {/* Bio-luminescent glow for AI Messages */}
                    {msg.role === "assistant" && (
                      <div className="absolute -inset-4 bg-blue-500/5 blur-2xl rounded-3xl pointer-events-none -z-10" />
                    )}
                    {msg.role === "assistant" ? (
                      <div className="relative h-full">
                        <div className="max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        {msg.audioSrc && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <InlineAudioPlayer src={msg.audioSrc} filename="Aethon Voice" />
                          </div>
                        )}
                        <div className="mt-3 pt-2 border-t border-white/5 flex justify-end mt-auto h-full items-end">
                          <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                            {msg.content.trim().split(/\s+/).length} words
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className="mt-2 flex justify-end opacity-50">
                          <span className="text-[10px] font-bold text-blue-600">
                            {msg.content.trim().split(/\s+/).length} words
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex gap-3 min-h-[100px]">
                  <div className="w-8 h-8 rounded-lg bg-[#0d1117] border border-white/10 shrink-0 flex items-center justify-center text-white animate-pulse font-bold text-sm shadow-md">N</div>
                  <div className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-[12px] border border-blue-500/20 shadow-lg">
                    <div className="flex gap-1.5 h-full items-center">
                      <span className="w-2 h-2 bg-blue-400/50 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-blue-400/50 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-2 h-2 bg-blue-400/50 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
              </section>


            </div>
          )}
        </div>

        {/* Bottom Search Bar Area */}
        {hasMessages && (
          <div className="fixed bottom-0 left-72 right-0 p-5 bg-gradient-to-t from-[#080a0f] via-[#080a0f]/95 to-transparent z-30 pointer-events-none">
            <div className="pointer-events-auto max-w-3xl mx-auto w-full">
              <OmniSearch onSearch={handleSearch} isLoading={isLoading} isBottom />
            </div>
          </div>
        )}

        {/* RAG Processing Panel */}
        <AnimatePresence>
          {showProcessing && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-80 bg-white/90 backdrop-blur-2xl border-l border-slate-200 p-8 z-50 flex flex-col shadow-[-10px_0_30px_rgb(0,0,0,0.05)]"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-black text-sm">RAG Processing</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Indexing document</p>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {processingSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      step.status === "done" ? "bg-emerald-50 border border-emerald-200" :
                      step.status === "active" ? "bg-blue-50 border border-blue-200" :
                      "bg-slate-50 border border-slate-200"
                    }`}>
                      {step.status === "done" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                       step.status === "active" ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> :
                       <div className="w-2 h-2 rounded-full bg-slate-300" />}
                    </div>
                    <span className={`text-sm font-bold transition-colors ${
                      step.status === "done" ? "text-emerald-600" :
                      step.status === "active" ? "text-slate-900" :
                      "text-slate-400"
                    }`}>{step.label}</span>
                  </motion.div>
                ))}
              </div>

              {processingSteps.every((s) => s.status === "done") && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center"
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-emerald-600 font-bold text-sm">Indexing Complete!</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Knowledge Graph Modal */}
        <AnimatePresence>
          {isKGModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
              <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setIsKGModalOpen(false)}
                 className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />
              <motion.div
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative w-full max-w-6xl h-full max-h-[90vh] bg-[#0d1117] border border-white/10 shadow-2xl rounded-2xl flex flex-col overflow-hidden"
              >
                 <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <Brain className="w-5 h-5" />
                       </div>
                       <div>
                          <h2 className="text-xl font-black text-white">Knowledge Graph</h2>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Global Concept Map</p>
                       </div>
                    </div>
                    <button 
                       onClick={() => setIsKGModalOpen(false)}
                       className="p-2.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-xl transition-all active:scale-90"
                    >
                       <X className="w-5 h-5" />
                    </button>
                 </div>
                 <div className="flex-1 overflow-hidden relative bg-[#0a0d14] flex items-center justify-center">
                    <div className="w-full h-full bg-[#0d1117] overflow-hidden flex items-center justify-center">
                        <iframe 
                          src="http://localhost:5000/images_static/neuroprime_viz.html" 
                          className="w-full h-full border-0"
                          title="Knowledge Graph Visualization"
                        />
                    </div>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <AmbientLighting />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, LogOut, LayoutDashboard, Loader2, FileText, Layers, BookOpen, AlignLeft, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { resetSession } from "@/lib/api";

interface FileInfo {
  name: string;
  title?: string;
  summary?: string;
  n_chunks?: number;
  n_pages?: number;
  pdf_words?: number;
  summary_words?: number;
}

interface SidebarProps {
  files?: FileInfo[];
  onUploadClick?: () => void;
}

const NavItem = ({ icon, label, href, active, onClick }: { icon: React.ReactNode; label: string; href: string; active?: boolean; onClick?: () => void }) => (
  <Link href={href} onClick={(e) => { if (onClick) { e.preventDefault(); onClick(); } }}>
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ x: 4 }}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active
          ? "bg-white/5 text-white border border-white/10 shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"
      }`}
    >
      <div className={`transition-colors ${active ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"}`}>
        {icon}
      </div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </motion.div>
  </Link>
);

export const Sidebar = ({ files = [], onUploadClick }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [isPdfDrawerOpen, setIsPdfDrawerOpen] = useState(false);
  const [expandedPdfIdx, setExpandedPdfIdx] = useState<number | null>(null);

  const handleNewSession = async () => {
    const userId = localStorage.getItem("user_id");
    const sessionId = localStorage.getItem("session_id");
    const sessionStr = localStorage.getItem("supabase_session");
    if (!userId || !sessionId || !sessionStr) return;

    setIsResetting(true);
    try {
      const session = JSON.parse(sessionStr);
      const data = await resetSession(userId, sessionId, session);
      localStorage.setItem("session_id", data.session_id);
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset session:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth?mode=login");
  };

  return (
    <div className="w-72 h-screen fixed left-0 top-0 bg-transparent border-r border-white/5 flex flex-col p-6 z-20 shadow-sm">
      {/* Brand */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
        className="flex items-center gap-3 mb-10 px-2 group cursor-pointer" 
        onClick={() => router.push("/")}
      >
        <motion.div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform relative"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-white font-black text-xl">N</span>
          <motion.div
            className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full"
            style={{ animation: "orbit 3s linear infinite" }}
          />
        </motion.div>
        <span
          className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"
          style={{ backgroundSize: "200% auto", animation: "text-shimmer 4s linear infinite" }}
        >
          Aethon AI
        </span>
      </motion.div>

      {/* Main Nav */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
        }}
        className="space-y-1.5 mb-8"
      >
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Workspace</div>
        <NavItem icon={<LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />} label="Workspace" href="/dashboard" active={pathname === "/dashboard"} />
        <NavItem
          icon={isResetting ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : <PlusCircle className="w-4 h-4" strokeWidth={1.5} />}
          label="New Session"
          href="#"
          onClick={handleNewSession}
        />
      </motion.div>

      {/* Replace old uploaded files section with a Toggle Button for PDF Manager */}
      <div className="flex-1 mt-6">
        <motion.div
           onClick={() => setIsPdfDrawerOpen(true)}
           whileHover={{ x: 4, scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           className="group flex flex-col justify-center gap-2 px-5 py-5 rounded-[1.5rem] cursor-pointer bg-gradient-to-br from-indigo-600/20 to-blue-600/10 border border-indigo-500/20 text-blue-400 hover:border-indigo-500/40 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Layers className="w-4 h-4 text-indigo-400" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-black tracking-widest uppercase text-slate-200">Neural Vault</span>
            </div>
            {files.length > 0 && (
               <span className="bg-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]">{files.length}</span>
            )}
          </div>
          <p className="text-[9px] text-slate-500 font-bold ml-11 uppercase tracking-wider">Access Knowledge Base</p>
        </motion.div>
      </div>

      {/* PDF Manager Extensible Drawer */}
      <AnimatePresence>
      {isPdfDrawerOpen && (
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: "0%", opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="fixed top-0 left-72 bottom-0 w-[28rem] bg-slate-950/95 backdrop-blur-[40px] border-r border-white/10 shadow-[20px_0_40px_rgb(0,0,0,0.5)] z-40 flex flex-col"
        >
          {/* Subtle top glow */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
          
          <div className="p-8 pb-6 flex items-center justify-between border-b border-white/5 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                Vault Manager
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-3">Knowledge Ingestion Center</p>
            </div>
            <button 
              onClick={() => setIsPdfDrawerOpen(false)}
              className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 group"
            >
              <div className="group-hover:rotate-90 transition-transform duration-300">
                 <X className="w-4 h-4" />
              </div>
            </button>
          </div>

          <div className="p-6 relative z-10">
            <button
              onClick={() => {
                if (onUploadClick) onUploadClick();
              }}
              className="w-full px-5 py-5 bg-white text-slate-950 hover:bg-blue-50 rounded-2xl transition-all flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] group shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-[0.98]"
            >
              <PlusCircle className="w-5 h-5 text-blue-600" />
              Ingest Document
            </button>
          </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
          {files.length > 0 ? (
            files.map((file, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl border transition-all overflow-hidden ${expandedPdfIdx === i ? 'bg-white/10 border-blue-500/50 shadow-lg shadow-blue-500/10' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'}`}
              >
                <div 
                  className="p-5 cursor-pointer flex items-start gap-4"
                  onClick={() => setExpandedPdfIdx(expandedPdfIdx === i ? null : i)}
                >
                   <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center flex-shrink-0 transition-colors ${expandedPdfIdx === i ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800/40 text-slate-500 border border-white/5'}`}>
                     <FileText className="w-5 h-5" strokeWidth={1.5} />
                   </div>
                   <div className="flex-1 overflow-hidden">
                     <h4 className="text-[13px] font-black text-white truncate w-full tracking-tight" title={file.title || file.name}>
                       {file.title && file.title !== "None" ? file.title : file.name}
                     </h4>
                     <div className="flex items-center gap-3 text-[9px] uppercase font-black tracking-widest mt-2">
                        {file.n_pages && <span className="text-slate-500">{file.n_pages} Pages</span>}
                        {file.n_chunks && <span className="text-blue-500/60 font-black">/ {file.n_chunks} Semantic Units</span>}
                     </div>
                   </div>
                </div>

                {expandedPdfIdx === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-4 pb-4 pt-1 border-t border-white/5"
                  >
                    <div className="flex flex-col gap-4 mt-3">
                      <div className="flex items-center justify-between text-[11px] bg-black/40 p-3 rounded-lg border border-black/50">
                         <div className="flex flex-col items-center flex-1">
                           <span className="text-slate-500 font-bold uppercase tracking-widest mb-1 text-[9px]">Original</span>
                           <span className="text-emerald-400 font-bold">{file.pdf_words?.toLocaleString() || 0} w</span>
                         </div>
                         <div className="w-px h-8 bg-white/10" />
                         <div className="flex flex-col items-center flex-1">
                           <span className="text-slate-500 font-bold uppercase tracking-widest mb-1 text-[9px]">Summary</span>
                           <span className="text-blue-400 font-bold">{file.summary_words?.toLocaleString() || 0} w</span>
                         </div>
                      </div>

                      {file.summary && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-3 h-3 text-amber-500" strokeWidth={1.5} />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">AI Synopsis</span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic bg-white/5 p-3 rounded-lg border border-white/5">
                            "{file.summary}"
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
               <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 transform -rotate-6">
                 <FileText className="w-8 h-8 text-slate-600" strokeWidth={1.5} />
               </div>
               <p className="text-slate-400 text-sm font-bold">No Documents Indexed</p>
               <p className="text-slate-600 text-xs mt-2 max-w-[200px] leading-relaxed">Upload a PDF to extract neural insights and begin analysis.</p>
            </div>
          )}
        </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
        className="pt-4 border-t border-white/5 mt-4"
      >
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 transition-all cursor-pointer group rounded-xl hover:bg-white/5 font-bold"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          <span className="text-sm">Log Out</span>
        </div>
      </motion.div>
    </div>
  );
};

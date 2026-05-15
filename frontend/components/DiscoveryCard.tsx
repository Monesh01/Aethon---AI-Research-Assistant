"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { FileText, ArrowUpRight, Clock, Tag } from "lucide-react";

export const DiscoveryCard = ({ title, date, category, snippet }: { title: string, date: string, category: string, snippet: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    
    // Normalize to -0.5 to 0.5 for tilt
    mouseX.set( (x / width) - 0.5 );
    mouseY.set( (y / height) - 0.5 );
  };

  const onMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const springConfig = { damping: 20, stiffness: 200 };
  const rotateX = useSpring(useMotionValue(0), springConfig);
  const rotateY = useSpring(useMotionValue(0), springConfig);

  // Sync springs with raw values
  mouseX.on("change", val => rotateY.set(val * 15));
  mouseY.on("change", val => rotateX.set(val * -15));

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transform: "translate3d(0, 0, 0)" 
      }}
      className="glass-morphism rounded-[2rem] p-8 relative group transition-all duration-500 hover:border-blue-500/30 overflow-hidden bg-white/60 hover:shadow-2xl"
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-blue-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110">
            <FileText className="w-7 h-7" />
          </div>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 45 }}
            className="p-2.5 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 cursor-pointer transition-all"
          >
            <ArrowUpRight className="w-5 h-5" />
          </motion.div>
        </div>

        <h4 className="text-slate-900 text-xl font-bold mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3 font-medium">{snippet}</p>

        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <Clock className="w-4 h-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
            <Tag className="w-3.5 h-3.5" />
            <span>{category}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

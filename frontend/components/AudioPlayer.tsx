"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Download, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AudioPlayerProps {
  src: string;
  filename?: string;
}

export const InlineAudioPlayer: React.FC<AudioPlayerProps> = ({ src, filename }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const handleMeta = () => setDuration(audio.duration);
    const handleEnd = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0); };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", handleMeta);
    audio.addEventListener("ended", handleEnd);
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", handleMeta);
      audio.removeEventListener("ended", handleEnd);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const fmt = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (audioRef.current && duration) {
      audioRef.current.currentTime = (v / 100) * duration;
      setProgress(v);
    }
  };

  return (
    <div className="inline-flex items-center">
      {/* Toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          isOpen
            ? "bg-blue-50 text-blue-600 border border-blue-200"
            : "bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 border border-slate-200"
        }`}
        title="Toggle audio player"
      >
        <Volume2 className={`w-4 h-4 ${isPlaying ? "animate-pulse" : ""}`} />
      </motion.button>

      {/* Expandable player */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
            animate={{ width: 320, opacity: 1, marginLeft: 8 }}
            exit={{ width: 0, opacity: 0, marginLeft: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors shrink-0 shadow-lg shadow-blue-600/20"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>

              {/* Progress + Time */}
              <div className="flex-1 min-w-0">
                <div className="relative h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                  <input
                    type="range" min="0" max="100" value={progress}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] font-mono text-slate-400">{fmt(currentTime)}</span>
                  <span className="text-[10px] font-mono text-slate-400">{fmt(duration)}</span>
                </div>
              </div>

              {/* Download */}
              <a
                href={src}
                download={filename || "ai_audio.wav"}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} src={src} className="hidden" />
    </div>
  );
};

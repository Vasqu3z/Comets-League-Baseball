"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TeamInfo {
  name: string;
  code: string;
  logoColor: string;
  score?: number;
}

interface VersusCardProps {
  home: TeamInfo;
  away: TeamInfo;
  date: string;
  time: string;
  isFinished: boolean;
}

export default function VersusCard({ home, away, date, time, isFinished }: VersusCardProps) {
  return (
    <div className="group relative w-full h-32 bg-surface-dark border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all duration-300">
      
      {/* Background Split */}
      <div className="absolute inset-0 flex">
        <div 
            className="w-[55%] h-full skew-x-12 -ml-4 transition-all duration-500 group-hover:w-[60%] group-hover:opacity-40 opacity-20"
            style={{ backgroundColor: home.logoColor }}
        />
        <div 
            className="flex-1 h-full bg-black/50" 
        />
        <div 
            className="absolute right-0 top-0 bottom-0 w-[55%] skew-x-12 -mr-4 transition-all duration-500 group-hover:w-[60%] group-hover:opacity-40 opacity-20"
            style={{ backgroundColor: away.logoColor }}
        />
      </div>

      {/* Content Grid */}
      <div className="absolute inset-0 flex items-center justify-between px-8 z-10">
        
        <div className="flex items-center gap-4 text-left w-1/3">
          <div className="text-4xl font-display text-white">{home.code}</div>
          <div className="hidden md:block font-ui uppercase tracking-wider text-sm text-white/60">{home.name}</div>
        </div>

        <div className="flex flex-col items-center justify-center w-1/3">
            {isFinished ? (
                <div className="flex items-center gap-4 font-mono text-3xl font-bold text-white bg-black/50 px-4 py-1 rounded border border-white/10 backdrop-blur-sm">
                    <span className={home.score! > away.score! ? "text-comets-yellow" : "text-white/50"}>{home.score}</span>
                    <span className="text-sm text-white/20">-</span>
                    <span className={away.score! > home.score! ? "text-comets-yellow" : "text-white/50"}>{away.score}</span>
                </div>
            ) : (
                <div className="font-display text-4xl text-white/10 group-hover:text-white/80 group-hover:scale-125 transition-all duration-300 italic">
                    VS
                </div>
            )}
            <div className="mt-1 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                {date} • {time}
            </div>
        </div>

        <div className="flex items-center gap-4 justify-end text-right w-1/3">
          <div className="hidden md:block font-ui uppercase tracking-wider text-sm text-white/60">{away.name}</div>
          <div className="text-4xl font-display text-white">{away.code}</div>
        </div>

      </div>
    </div>
  );
}
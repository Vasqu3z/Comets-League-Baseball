"use client";

import React from "react";
import { Swords } from "lucide-react";

// Mock Data - In production, these would be state driven by a selector
const PLAYER_A = { name: "Mario", team: "Fireballs", color: "#FF4D4D", stats: { avg: ".412", hr: 24, ops: "1.240" } };
const PLAYER_B = { name: "Bowser", team: "Monsters", color: "#F4D03F", stats: { avg: ".280", hr: 35, ops: "1.100" } };

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-background pt-20 relative flex flex-col">
      
      {/* Tool Header Floating */}
      <div className="absolute top-24 left-0 right-0 z-20 text-center pointer-events-none">
        <div className="inline-flex items-center gap-2 bg-black/80 border border-white/10 px-4 py-1 rounded-full backdrop-blur-md">
            <Swords size={16} className="text-comets-cyan" />
            <span className="font-ui uppercase tracking-widest text-xs text-white">Head-to-Head</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 relative">
        
        {/* Center Divider Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 hidden md:block z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black border border-white/20 rounded-full flex items-center justify-center font-display text-white/50 text-sm">VS</div>
        </div>

        {/* Player A (Left) */}
        <div className="relative p-8 flex flex-col justify-center items-center md:items-end text-center md:text-right border-b md:border-b-0 border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-red-900/10 pointer-events-none" />
            
            <div className="relative z-10">
                <div className="w-24 h-24 rounded-xl bg-surface-dark border-2 border-white/10 mb-6 mx-auto md:mr-0 md:ml-auto flex items-center justify-center font-display text-4xl" style={{ borderColor: PLAYER_A.color, color: PLAYER_A.color }}>
                    {PLAYER_A.name[0]}
                </div>
                <h2 className="font-display text-5xl text-white uppercase mb-1">{PLAYER_A.name}</h2>
                <div className="font-ui text-white/50 tracking-widest uppercase mb-12">{PLAYER_A.team}</div>

                {/* Stats List */}
                <div className="space-y-6 w-full max-w-xs ml-auto">
                    <StatRow label="AVG" value={PLAYER_A.stats.avg} isWinner={true} color={PLAYER_A.color} align="right" />
                    <StatRow label="HR" value={PLAYER_A.stats.hr} isWinner={false} color={PLAYER_A.color} align="right" />
                    <StatRow label="OPS" value={PLAYER_A.stats.ops} isWinner={true} color={PLAYER_A.color} align="right" />
                </div>
            </div>
        </div>

        {/* Player B (Right) */}
        <div className="relative p-8 flex flex-col justify-center items-center md:items-start text-center md:text-left">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-yellow-900/10 pointer-events-none" />
            
            <div className="relative z-10">
                <div className="w-24 h-24 rounded-xl bg-surface-dark border-2 border-white/10 mb-6 mx-auto md:ml-0 md:mr-auto flex items-center justify-center font-display text-4xl" style={{ borderColor: PLAYER_B.color, color: PLAYER_B.color }}>
                    {PLAYER_B.name[0]}
                </div>
                <h2 className="font-display text-5xl text-white uppercase mb-1">{PLAYER_B.name}</h2>
                <div className="font-ui text-white/50 tracking-widest uppercase mb-12">{PLAYER_B.team}</div>

                {/* Stats List */}
                <div className="space-y-6 w-full max-w-xs mr-auto">
                    <StatRow label="AVG" value={PLAYER_B.stats.avg} isWinner={false} color={PLAYER_B.color} align="left" />
                    <StatRow label="HR" value={PLAYER_B.stats.hr} isWinner={true} color={PLAYER_B.color} align="left" />
                    <StatRow label="OPS" value={PLAYER_B.stats.ops} isWinner={false} color={PLAYER_B.color} align="left" />
                </div>
            </div>
        </div>

      </div>
    </main>
  );
}

// Helper Component for Stat Comparison Rows
function StatRow({ label, value, isWinner, color, align }: any) {
    return (
        <div className={`flex flex-col ${align === "right" ? "items-end" : "items-start"}`}>
            <div className="text-xs font-mono text-white/30 mb-1">{label}</div>
            <div 
                className={`text-3xl font-mono ${isWinner ? "font-bold" : "text-white/50"}`} 
                style={{ 
                    color: isWinner ? color : undefined, 
                    textShadow: isWinner ? `0 0 10px ${color}` : 'none' 
                }}
            >
                {value}
            </div>
        </div>
    )
}
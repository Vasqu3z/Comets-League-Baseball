"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const POSITIONS = {
  P: { top: "50%", left: "50%" },
  C: { top: "85%", left: "50%" },
  "1B": { top: "50%", left: "80%" },
  "2B": { top: "20%", left: "65%" },
  "3B": { top: "50%", left: "20%" },
  SS: { top: "20%", left: "35%" },
  LF: { top: "10%", left: "15%" },
  CF: { top: "5%", left: "50%" },
  RF: { top: "10%", left: "85%" },
};

interface HolographicFieldProps {
  roster: Record<string, any>;
  onPositionClick: (pos: string) => void;
}

export default function HolographicField({ roster, onPositionClick }: HolographicFieldProps) {
  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto perspective-1000">
      
      <div className="absolute inset-0 transform rotate-x-45 scale-90 bg-black/20 border border-white/10 rounded-full shadow-[0_0_50px_rgba(0,243,255,0.1)] backdrop-blur-sm overflow-hidden">
        
        <div 
          className="absolute inset-0 opacity-20"
          style={{ 
            backgroundImage: 'linear-gradient(to right, #00F3FF 1px, transparent 1px), linear-gradient(to bottom, #00F3FF 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} 
        />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rotate-45 border-2 border-comets-cyan/30 shadow-[0_0_20px_rgba(0,243,255,0.2)]" />
        
        <motion.div 
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-1 bg-comets-cyan/50 shadow-[0_0_10px_#00F3FF] blur-[2px]"
        />
      </div>

      {Object.entries(POSITIONS).map(([pos, coords]) => {
        const player = roster[pos];
        return (
          <motion.button
            key={pos}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2, y: -5 }}
            onClick={() => onPositionClick(pos)}
            className={cn(
              "absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300",
              player 
                ? "border-comets-yellow bg-black shadow-[0_0_15px_#F4D03F]" 
                : "border-white/20 bg-black/50 hover:border-comets-cyan hover:shadow-[0_0_10px_#00F3FF]"
            )}
            style={{ top: coords.top, left: coords.left }}
          >
            {player ? (
              <div className="font-bold text-xs text-comets-yellow">{player.name[0]}</div>
            ) : (
              <div className="text-[10px] text-white/50 font-mono">{pos}</div>
            )}
          </motion.button>
        );
      })}

    </div>
  );
}
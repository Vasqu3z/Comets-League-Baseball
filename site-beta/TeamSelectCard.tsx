"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

interface TeamSelectCardProps {
  name: string;
  code: string;
  logoColor: string;
  stats: {
    wins: number;
    losses: number;
    avg: string;
  };
  href: string;
}

export default function TeamSelectCard({ name, code, logoColor, stats, href }: TeamSelectCardProps) {
  return (
    <Link href={href} className="block h-full group perspective-1000">
      <motion.div
        whileHover={{ scale: 1.02, rotateX: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="relative h-64 bg-surface-dark border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all duration-300 shadow-lg"
      >
        <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-b from-transparent to-black"
            style={{ background: `linear-gradient(to bottom, ${logoColor}20, transparent)` }}
        />
        
        <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 grayscale group-hover:grayscale-0">
             <div className="text-9xl font-display" style={{ color: logoColor }}>{code[0]}</div>
        </div>

        <div className="absolute inset-0 p-6 flex flex-col justify-between z-10 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex justify-between items-start">
                <div className="px-2 py-1 rounded bg-white/10 border border-white/10 text-xs font-mono text-white/60 backdrop-blur-sm">
                    {code}
                </div>
                <div className="text-white/40 group-hover:text-comets-yellow transition-colors">
                    <TrendingUp size={20} />
                </div>
            </div>

            <div>
                <h3 className="font-display text-2xl text-white leading-none mb-2 group-hover:text-shadow-neon transition-all">{name}</h3>
                <div className="flex gap-4 text-sm font-mono text-white/60">
                    <span><span className="text-white">W:</span> {stats.wins}</span>
                    <span><span className="text-white">L:</span> {stats.losses}</span>
                    <span className="text-comets-cyan">{stats.avg} AVG</span>
                </div>
            </div>
        </div>
        
        <div 
            className="absolute inset-0 border-2 border-transparent group-hover:border-opacity-50 transition-all duration-300 rounded-xl pointer-events-none" 
            style={{ borderColor: logoColor }}
        />

      </motion.div>
    </Link>
  );
}
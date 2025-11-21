"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

export default function StatHighlight() {
  return (
    <section className="py-24 md:py-32 container mx-auto px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 right-0 h-[500px] bg-white/[0.02] -skew-y-3 -translate-y-1/2 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-2 text-comets-cyan mb-4">
            <TrendingUp size={20} />
            <span className="font-ui font-bold tracking-widest uppercase text-sm">Deep Analytics</span>
          </div>
          
          <h2 className="font-display text-5xl md:text-7xl text-white uppercase leading-[0.9] mb-8">
            Numbers <br/> don't lie.
          </h2>
          
          <p className="text-white/60 text-lg max-w-md mb-8 font-body leading-relaxed">
            Dive into advanced sabermetrics for the Mario Super Sluggers universe. Track OPS, Chemistry Ratios, and historical performance across all seasons using our custom-built engine.
          </p>
          
          <Link href="/tools/stats">
            <button className="group flex items-center gap-3 text-white border-b border-comets-yellow pb-1 font-ui uppercase tracking-widest hover:text-comets-yellow transition-colors text-lg">
              Explore Data Tools
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </button>
          </Link>
        </motion.div>

        <div className="relative perspective-1000">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, type: "spring" }}
            className="relative z-10 bg-surface-dark/90 border border-white/10 p-6 md:p-8 rounded-xl backdrop-blur-xl shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-comets-red flex items-center justify-center text-2xl font-display text-white shadow-[0_0_15px_rgba(255,77,77,0.5)]">M</div>
                <div>
                  <div className="font-display text-2xl text-white">MARIO</div>
                  <div className="font-ui text-comets-red text-sm tracking-widest uppercase">Fireballs • Cpt</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-ui text-xs text-white/40 uppercase tracking-wider">Season AVG</div>
                <div className="font-mono text-4xl text-comets-yellow text-shadow-neon">.412</div>
              </div>
            </div>
            
            <div className="space-y-6">
              {[
                { label: "OPS", value: "1.240", width: "85%", color: "bg-comets-cyan" },
                { label: "HR", value: "24", width: "65%", color: "bg-comets-red" },
                { label: "OBP", value: ".510", width: "55%", color: "bg-comets-purple" },
              ].map((stat, i) => (
                <div key={stat.label} className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="font-ui text-white/60 text-sm uppercase tracking-wider w-16 z-10">{stat.label}</span>
                  <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden z-10">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: stat.width }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + (i * 0.2), duration: 1, ease: "easeOut" }}
                      className={`h-full ${stat.color} shadow-[0_0_10px_currentColor]`} 
                    />
                  </div>
                  <span className="font-mono text-white z-10">{stat.value}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
               <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.5em]">Player Card // ID: 001</div>
            </div>
          </motion.div>
          <div className="absolute -inset-12 bg-gradient-to-tr from-comets-blue to-comets-purple opacity-20 blur-3xl -z-10 animate-pulse-slow" />
        </div>
      </div>
    </section>
  );
}
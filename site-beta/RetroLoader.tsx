"use client";

import React from "react";
import { motion } from "framer-motion";

export default function RetroLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-12 min-h-[300px] w-full">
      <div className="relative w-16 h-16">
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-full h-full rounded-full border-4 border-comets-yellow bg-black relative overflow-hidden shadow-[0_0_20px_var(--comets-yellow)]"
        >
          <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-full scale-75 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-comets-yellow/20 rounded-full blur-sm" />
        </motion.div>
      </div>

      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="flex flex-col items-center text-center"
      >
        <div className="font-display text-2xl text-white tracking-widest">
          LOADING
        </div>
        <div className="text-xs font-mono text-comets-cyan uppercase tracking-[0.5em] mt-2">
          Insert Coin
        </div>
      </motion.div>
    </div>
  );
}
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="relative pt-24 pb-12 border-t border-white/10 bg-background overflow-hidden">
      <div className="absolute inset-0 scanlines opacity-10 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-6xl md:text-[12vw] leading-[0.8] text-white/5 select-none pointer-events-none tracking-tighter"
          >
            PLAY BALL
          </motion.div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16 font-ui uppercase tracking-widest text-sm md:text-base text-white/40">
            <Link href="/about" className="hover:text-comets-cyan transition-colors hover:underline decoration-comets-cyan decoration-2 underline-offset-4">
              About League
            </Link>
            <Link href="/rules" className="hover:text-comets-red transition-colors hover:underline decoration-comets-red decoration-2 underline-offset-4">
              Official Rules
            </Link>
            <Link href="/discord" className="hover:text-comets-purple transition-colors hover:underline decoration-comets-purple decoration-2 underline-offset-4">
              Join Discord
            </Link>
            <Link href="/privacy" className="hover:text-comets-yellow transition-colors hover:underline decoration-comets-yellow decoration-2 underline-offset-4">
              Privacy Policy
            </Link>
          </div>

          <div className="mt-12 text-white/20 font-mono text-xs">
            © {new Date().getFullYear()} Comets League Baseball. Not affiliated with Nintendo.
          </div>
        </div>
      </div>
    </footer>
  );
}
"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

interface RetroCardProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  href: string;
  color: string;
  delay?: number;
}

const RetroCard = ({ title, subtitle, icon: Icon, href, color, delay = 0 }: RetroCardProps) => {
  return (
    <Link href={href} className="block h-full no-underline group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: delay, duration: 0.5 }}
        className="relative h-full min-h-[240px] p-8 bg-surface-dark border border-white/5 hover:border-white/20 transition-colors duration-300 overflow-hidden rounded-xl"
      >
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
        />

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="mb-6 flex items-center justify-between">
            <div 
              className="p-3 rounded-lg bg-white/5 text-white group-hover:scale-110 transition-transform duration-300"
              style={{ color: color }}
            >
              {Icon && <Icon size={32} strokeWidth={1.5} />}
            </div>
            <ArrowRight className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
          </div>
          
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-white mb-2 uppercase leading-none tracking-tight">
              {title}
            </h3>
            <p className="font-body text-white/50 text-sm md:text-base mt-2">
              {subtitle}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default RetroCard;
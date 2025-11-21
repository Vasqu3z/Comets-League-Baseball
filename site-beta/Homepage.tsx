"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Calendar, Users, Activity, ArrowRight, Star } from "lucide-react";
import StatHighlight from "@/components/ui/StatHighlight";
import RetroCard from "@/components/ui/RetroCard";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-comets-blue/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-comets-purple/10 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
      </div>

      <div className="z-10 container mx-auto px-4 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <h1 className="font-display text-6xl md:text-[9rem] uppercase leading-[0.85] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            Comets
            <br />
            <span className="text-stroke-2 text-transparent text-stroke-white-20 md:ml-24 block">League</span>
          </h1>
          
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
            className="absolute -top-8 -right-4 md:-top-12 md:-right-16 text-comets-yellow"
          >
            <Star size={64} fill="currentColor" className="animate-spin-slow" />
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-8 text-xl md:text-2xl font-ui text-comets-cyan uppercase tracking-widest max-w-2xl"
        >
          The Premier Mario Baseball Statistics Hub
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-12 flex flex-wrap gap-4 justify-center"
        >
          <Link href="/standings">
            <button className="group relative px-8 py-4 bg-comets-yellow text-black font-display text-xl uppercase tracking-wide overflow-hidden hover:scale-105 transition-transform duration-200 rounded-sm">
              <span className="relative z-10">View Standings</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          </Link>
          <Link href="/schedule">
            <button className="group px-8 py-4 border border-white/20 text-white font-display text-xl uppercase tracking-wide hover:bg-white/5 hover:border-white/50 transition-all duration-200 backdrop-blur-sm rounded-sm">
              Latest Scores
            </button>
          </Link>
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll to Start</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent" />
      </motion.div>
    </section>
  );
};

const LiveTicker = () => {
  const items = [
    "🔥 MARIO HITS 3 HR IN OPENER",
    "📊 YOSHI LEADS AVG (.750)",
    "🏆 BOWSER MONSTERS 3-0 STREAK",
    "⚡ WEEK 4 SCHEDULE UPDATED",
    "👀 TRADE RUMORS: WALUIGI?"
  ];

  return (
    <div className="w-full bg-comets-yellow text-black py-3 overflow-hidden flex relative z-20 border-y-4 border-black transform -skew-y-1 mb-24">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-comets-yellow to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-comets-yellow to-transparent z-10" />
      
      <motion.div 
        className="flex gap-16 whitespace-nowrap font-ui font-bold text-lg uppercase tracking-wider items-center"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      >
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-3">
            <span className="w-2 h-2 bg-black rounded-full" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export default function HomePage() {
  const features = [
    {
      title: "League Standings",
      subtitle: "Track team performance and playoff races.",
      icon: Trophy,
      href: "/standings",
      color: "#F4D03F"
    },
    {
      title: "Player Stats",
      subtitle: "Comprehensive database of every slugger.",
      icon: Users,
      href: "/players",
      color: "#00F3FF"
    },
    {
      title: "Full Schedule",
      subtitle: "Upcoming matches and historical results.",
      icon: Calendar,
      href: "/schedule",
      color: "#FF4D4D"
    },
    {
      title: "Lineup Builder",
      subtitle: "Optimize your team chemistry and stats.",
      icon: Activity,
      href: "/tools/lineup",
      color: "#BD00FF"
    }
  ];

  return (
    <main className="bg-background text-foreground overflow-x-hidden selection:bg-comets-cyan selection:text-black">
      <HeroSection />
      <LiveTicker />
      
      <div className="container mx-auto px-4 py-24 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <RetroCard key={feature.title} {...feature} delay={index * 0.1} />
          ))}
        </div>
      </div>

      <StatHighlight />

      <div className="py-24 text-center">
        <Link href="/signup" className="inline-block">
            <div className="font-display text-4xl md:text-6xl text-white/20 hover:text-white/100 transition-colors duration-500 uppercase select-none tracking-widest cursor-pointer">
                Join The League
            </div>
        </Link>
      </div>
    </main>
  );
}
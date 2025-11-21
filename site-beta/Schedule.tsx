"use client";

import React from "react";
import VersusCard from "@/components/ui/VersusCard";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

// Mock Data
const MATCHES = [
  { 
    id: "1", 
    home: { name: "Mario Fireballs", code: "MAR", logoColor: "#FF4D4D", score: 5 }, 
    away: { name: "Bowser Monsters", code: "BOW", logoColor: "#F4D03F", score: 3 }, 
    date: "MAY 12", time: "FINAL", isFinished: true 
  },
  { 
    id: "2", 
    home: { name: "Luigi Knights", code: "LUI", logoColor: "#2ECC71", score: 1 }, 
    away: { name: "Wario Muscles", code: "WAR", logoColor: "#F1C40F", score: 4 }, 
    date: "MAY 12", time: "FINAL", isFinished: true 
  },
  { 
    id: "3", 
    home: { name: "Peach Monarchs", code: "PCH", logoColor: "#FF69B4" }, 
    away: { name: "Daisy Flowers", code: "DSY", logoColor: "#E67E22" }, 
    date: "MAY 14", time: "18:00 EST", isFinished: false 
  },
  { 
    id: "4", 
    home: { name: "Yoshi Eggs", code: "YOS", logoColor: "#2E86DE" }, 
    away: { name: "Birdo Bows", code: "BDO", logoColor: "#E91E63" }, 
    date: "MAY 14", time: "20:00 EST", isFinished: false 
  },
];

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-background pb-24 pt-32 px-4">
      <div className="container mx-auto max-w-4xl">
        
        {/* Page Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2 text-comets-red mb-2">
              <Calendar size={20} />
              <span className="font-ui uppercase tracking-widest text-sm">Official Schedule</span>
            </div>
            <h1 className="font-display text-5xl text-white uppercase leading-none">Week 4</h1>
          </div>
          
          {/* Week Selector Controls */}
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors">
                <ChevronLeft size={20} />
            </button>
            <button className="w-10 h-10 rounded border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors">
                <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
            
            {/* Day Group Header */}
            <div className="flex items-center gap-4 py-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="font-mono text-white/40 text-sm">MAY 12</span>
                <div className="h-px flex-1 bg-white/10" />
            </div>

            <VersusCard {...MATCHES[0]} />
            <VersusCard {...MATCHES[1]} />

            {/* Day Group Header */}
            <div className="flex items-center gap-4 py-4 mt-8">
                <div className="h-px flex-1 bg-white/10" />
                <span className="font-mono text-white/40 text-sm">MAY 14</span>
                <div className="h-px flex-1 bg-white/10" />
            </div>

            <VersusCard {...MATCHES[2]} />
            <VersusCard {...MATCHES[3]} />
        </div>

      </div>
    </main>
  );
}
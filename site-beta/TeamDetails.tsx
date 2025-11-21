"use client";

import React, { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, Calendar, Activity, Trophy } from "lucide-react";
import RetroTable from "@/components/ui/RetroTable";
import VersusCard from "@/components/ui/VersusCard";
import StatHighlight from "@/components/ui/StatHighlight";
import { cn } from "@/lib/utils";

// --- Types ---
interface Player {
  id: string;
  name: string;
  position: string;
  avg: string;
  hr: number;
  ops: string;
}

interface Matchup {
  id: string;
  home: { name: string; code: string; logoColor: string; score?: number };
  away: { name: string; code: string; logoColor: string; score?: number };
  date: string;
  time: string;
  isFinished: boolean;
}

// --- Mock Data (Replace with API calls) ---
const TEAM_DATA = {
  name: "Mario Fireballs",
  code: "MAR",
  logoColor: "#FF4D4D",
  record: "12-2",
  standing: "1st",
  roster: [
    { id: "1", name: "Mario", position: "P", avg: ".412", hr: 24, ops: "1.240" },
    { id: "2", name: "Luigi", position: "C", avg: ".305", hr: 12, ops: ".890" },
    { id: "3", name: "Pianta", position: "1B", avg: ".280", hr: 5, ops: ".750" },
    { id: "4", name: "Noki", position: "2B", avg: ".265", hr: 3, ops: ".710" },
  ] as Player[],
  schedule: [
    { 
      id: "m1", 
      home: { name: "Mario Fireballs", code: "MAR", logoColor: "#FF4D4D", score: 5 }, 
      away: { name: "Bowser Monsters", code: "BOW", logoColor: "#F4D03F", score: 3 }, 
      date: "MAY 12", time: "FINAL", isFinished: true 
    },
    { 
      id: "m2", 
      home: { name: "DK Wilds", code: "DKW", logoColor: "#8D6E63" }, 
      away: { name: "Mario Fireballs", code: "MAR", logoColor: "#FF4D4D" }, 
      date: "MAY 15", time: "19:00", isFinished: false 
    },
  ] as Matchup[]
};

export default function TeamDetailPage({ params }: { params: { slug: string } }) {
  const [activeTab, setActiveTab] = useState<"roster" | "schedule" | "stats">("roster");

  // In production: 
  // const team = await fetchTeam(params.slug);
  // if (!team) return notFound();
  const team = TEAM_DATA; 

  // Roster Table Configuration
  const rosterColumns = [
    { 
      header: "Player", 
      cell: (p: Player) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center font-display text-white">
            {p.name[0]}
          </div>
          <Link href={`/players/${p.id}`} className="font-bold hover:text-comets-yellow transition-colors uppercase">
            {p.name}
          </Link>
        </div>
      )
    },
    { header: "Pos", accessorKey: "position" as keyof Player, className: "text-white/50" },
    { header: "AVG", accessorKey: "avg" as keyof Player, className: "font-mono text-comets-cyan" },
    { header: "HR", accessorKey: "hr" as keyof Player, className: "font-mono text-comets-red" },
    { header: "OPS", accessorKey: "ops" as keyof Player, className: "font-mono text-white font-bold" },
  ];

  return (
    <main className="min-h-screen bg-background pb-24">
      
      {/* --- Team Header (Locker Room Banner) --- */}
      <div className="relative h-[40vh] overflow-hidden flex items-end pb-12">
        {/* Dynamic Background based on Team Color */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{ 
            background: `linear-gradient(to bottom, ${team.logoColor}, transparent)`,
          }} 
        />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        
        <div className="container mx-auto px-4 relative z-10 flex items-end gap-8">
          {/* Huge Logo Watermark */}
          <div 
            className="w-32 h-32 md:w-48 md:h-48 bg-surface-dark border-4 border-white/10 rounded-xl flex items-center justify-center shadow-2xl transform rotate-3"
            style={{ borderColor: team.logoColor }}
          >
             <div className="font-display text-8xl" style={{ color: team.logoColor }}>{team.code[0]}</div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-mono uppercase tracking-widest border border-white/5">
                    Season 6
                </span>
                <span className="text-comets-yellow font-bold flex items-center gap-1">
                    <Trophy size={14} /> {team.standing}
                </span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl text-white uppercase leading-none tracking-tight">
              {team.name}
            </h1>
            <div className="text-xl text-white/60 font-ui tracking-widest mt-2">
              Record: <span className="text-white">{team.record}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Dashboard Content --- */}
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { id: "roster", label: "Active Roster", icon: Users },
            { id: "schedule", label: "Season Schedule", icon: Calendar },
            { id: "stats", label: "Team Stats", icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-3 rounded-t-lg font-ui uppercase tracking-widest text-sm flex items-center gap-2 border-t border-x transition-colors",
                activeTab === tab.id 
                  ? "bg-background border-white/20 text-white" 
                  : "bg-surface-dark border-transparent text-white/40 hover:text-white hover:bg-surface-light"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
          <div className="flex-1 border-b border-white/20 translate-y-[1px]" />
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          
          {activeTab === "roster" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display text-2xl text-white">Starting Lineup</h3>
                    <button className="text-xs font-mono text-comets-cyan hover:underline uppercase">Download CSV</button>
                </div>
                <RetroTable data={team.roster} columns={rosterColumns} />
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {team.schedule.map((match) => (
                    <VersusCard key={match.id} {...match} />
                ))}
            </div>
          )}

          {activeTab === "stats" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Reusing the highlight component for the MVP showcase */}
                <StatHighlight />
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
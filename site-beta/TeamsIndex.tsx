import React from "react";
import TeamSelectCard from "@/components/ui/TeamSelectCard";
import { Users } from "lucide-react";

// Mock Data - Replace with your database fetch
const TEAMS = [
  { name: "Mario Fireballs", code: "MAR", logoColor: "#FF4D4D", stats: { wins: 12, losses: 2, avg: ".312" }, href: "/teams/mario-fireballs" },
  { name: "Bowser Monsters", code: "BOW", logoColor: "#F4D03F", stats: { wins: 10, losses: 4, avg: ".289" }, href: "/teams/bowser-monsters" },
  { name: "Peach Monarchs", code: "PCH", logoColor: "#FF69B4", stats: { wins: 8, losses: 6, avg: ".275" }, href: "/teams/peach-monarchs" },
  { name: "DK Wilds", code: "DKW", logoColor: "#8D6E63", stats: { wins: 7, losses: 7, avg: ".265" }, href: "/teams/dk-wilds" },
  { name: "Luigi Knights", code: "LUI", logoColor: "#2ECC71", stats: { wins: 6, losses: 8, avg: ".250" }, href: "/teams/luigi-knights" },
  { name: "Wario Muscles", code: "WAR", logoColor: "#F1C40F", stats: { wins: 4, losses: 10, avg: ".240" }, href: "/teams/wario-muscles" },
  { name: "Yoshi Eggs", code: "YOS", logoColor: "#2E86DE", stats: { wins: 9, losses: 5, avg: ".295" }, href: "/teams/yoshi-eggs" },
  { name: "Waluigi Spitballs", code: "WAL", logoColor: "#9B59B6", stats: { wins: 5, losses: 9, avg: ".230" }, href: "/teams/waluigi-spitballs" },
];

export default function TeamsPage() {
  return (
    <main className="min-h-screen bg-background pb-24 pt-32 px-4 relative overflow-hidden">
       {/* Background Decor */}
       <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-comets-blue/10 to-transparent -z-10" />
       
       <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-comets-cyan text-xs font-mono uppercase tracking-widest mb-4">
                  <Users size={14} />
                  League Roster
              </div>
              <h1 className="font-display text-5xl md:text-7xl text-white uppercase tracking-tight">
                  Select <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Team</span>
              </h1>
          </div>

          {/* The Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {TEAMS.map((team) => (
                  <TeamSelectCard key={team.code} {...team} />
              ))}
          </div>
       </div>
    </main>
  );
}
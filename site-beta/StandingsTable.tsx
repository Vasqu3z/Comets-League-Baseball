import React from "react";
import StandingsTable from "./StandingsTable";
import { Trophy } from "lucide-react";

export default function StandingsPage() {
  return (
    <main className="min-h-screen bg-background pb-24 pt-32 px-4">
      <div className="container mx-auto max-w-5xl">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 text-comets-yellow mb-2">
              <Trophy size={24} />
              <span className="font-ui uppercase tracking-[0.2em] font-bold text-sm">Season 6</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl uppercase text-white leading-none">
              League Standings
            </h1>
          </div>

          {/* Filter / Toggle (Static Mock) */}
          <div className="flex bg-surface-dark border border-white/10 rounded p-1">
            <button className="px-4 py-2 bg-white/10 rounded-sm text-white font-ui text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              Regular Season
            </button>
            <button className="px-4 py-2 hover:bg-white/5 rounded-sm text-white/40 hover:text-white font-ui text-xs uppercase tracking-wider transition-colors">
              Playoffs
            </button>
          </div>
        </div>

        {/* The Table */}
        <StandingsTable />

        {/* Legend / Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono text-white/30 border-t border-white/5 pt-8">
          <div>
            <span className="text-comets-yellow block mb-1 font-bold">RANKING CRITERIA</span>
            Win Percentage &gt; Head-to-Head &gt; Run Differential
          </div>
          <div>
            <span className="text-comets-cyan block mb-1 font-bold">PLAYOFF CLINCH</span>
            Top 4 teams advance to the Star Cup Semifinals.
          </div>
          <div className="md:text-right">
            <span className="text-white/50 block mb-1 font-bold">LAST UPDATED</span>
            2025-05-12 14:30 EST
          </div>
        </div>

      </div>
    </main>
  );
}
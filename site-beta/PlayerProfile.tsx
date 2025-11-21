import React from "react";
import StatHighlight from "@/components/ui/StatHighlight";
import RetroTable from "@/components/ui/RetroTable";
import { Activity, History } from "lucide-react";

export default function PlayerProfilePage({ params }: { params: { slug: string } }) {
  // In real app, fetch data based on params.slug
  
  const gameLog = [
    { date: "MAY 12", opp: "BOW", ab: 4, h: 2, hr: 1, rbi: 3, pts: 120 },
    { date: "MAY 10", opp: "DKW", ab: 3, h: 1, hr: 0, rbi: 0, pts: 45 },
    { date: "MAY 08", opp: "PCH", ab: 5, h: 3, hr: 2, rbi: 5, pts: 210 },
  ];

  const logColumns = [
    { header: "Date", accessorKey: "date", className: "text-white/60" },
    { header: "VS", accessorKey: "opp", className: "text-comets-red font-bold" },
    { header: "AB", accessorKey: "ab" },
    { header: "H", accessorKey: "h" },
    { header: "HR", accessorKey: "hr", className: "text-comets-yellow" },
    { header: "RBI", accessorKey: "rbi" },
    { header: "PTS", accessorKey: "pts", className: "text-comets-cyan font-bold" },
  ];

  return (
    <main className="min-h-screen bg-background pb-24">
      
      <StatHighlight />

      <div className="container mx-auto max-w-5xl px-4 -mt-12 relative z-20">
        
        <div className="flex gap-8 border-b border-white/10 mb-8">
            <button className="pb-4 text-comets-yellow border-b-2 border-comets-yellow font-ui uppercase tracking-widest text-sm flex items-center gap-2">
                <Activity size={16} /> Recent Performance
            </button>
            <button className="pb-4 text-white/40 hover:text-white font-ui uppercase tracking-widest text-sm flex items-center gap-2 transition-colors">
                <History size={16} /> Season History
            </button>
        </div>

        <div className="space-y-4">
            <h3 className="font-display text-2xl text-white uppercase">Game Log</h3>
            <RetroTable data={gameLog} columns={logColumns} />
        </div>

      </div>
    </main>
  );
}
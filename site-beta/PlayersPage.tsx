import React from "react";
import RetroTable from "@/components/ui/RetroTable";
import { Search, SlidersHorizontal } from "lucide-react";

// Mock Data
const PLAYERS = [
  { id: 1, name: "Mario", team: "Fireballs", avg: ".412", hr: 24, ops: "1.240", stamina: 90 },
  { id: 2, name: "Luigi", team: "Fireballs", avg: ".305", hr: 12, ops: ".890", stamina: 85 },
  { id: 3, name: "Bowser", team: "Monsters", avg: ".280", hr: 35, ops: "1.100", stamina: 95 },
  { id: 4, name: "Peach", team: "Monarchs", avg: ".350", hr: 8, ops: ".950", stamina: 70 },
];

export default function PlayersPage() {
  const columns = [
    { 
      header: "Player", 
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-light rounded flex items-center justify-center font-display text-white/80">
            {item.name[0]}
          </div>
          <span className="font-bold text-white uppercase tracking-wider">{item.name}</span>
        </div>
      )
    },
    { header: "Team", accessorKey: "team", className: "text-white/60" },
    { header: "AVG", accessorKey: "avg", className: "text-comets-cyan font-mono" },
    { header: "HR", accessorKey: "hr", className: "text-comets-red font-mono" },
    { header: "OPS", accessorKey: "ops", className: "text-comets-yellow font-mono font-bold" },
    { 
        header: "Stamina", 
        cell: (item: any) => (
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-comets-purple" 
                    style={{ width: `${item.stamina}%` }} 
                />
            </div>
        )
    }
  ];

  return (
    <main className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-6xl">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <div className="text-xs font-mono text-comets-cyan uppercase tracking-widest mb-2">Database Access</div>
            <h1 className="font-display text-5xl text-white uppercase">Player Registry</h1>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input 
                type="text" 
                placeholder="SEARCH..." 
                className="w-full bg-surface-dark border border-white/10 rounded-sm py-2 pl-10 pr-4 text-white font-mono text-sm focus:border-comets-yellow outline-none uppercase placeholder:text-white/20"
              />
            </div>
            <button className="px-4 py-2 bg-surface-dark border border-white/10 hover:border-white/30 rounded-sm text-white/60 hover:text-white transition-colors">
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        <RetroTable 
            data={PLAYERS} 
            columns={columns} 
            onRowClick={(p) => console.log("View Player", p.name)} 
        />
        
        <div className="mt-8 flex justify-center gap-2 font-mono text-xs text-white/40">
            <span>PAGE 1 OF 42</span>
        </div>

      </div>
    </main>
  );
}
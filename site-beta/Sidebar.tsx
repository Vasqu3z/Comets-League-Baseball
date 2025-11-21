"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Calendar, 
  Users, 
  Activity, 
  Settings, 
  LogOut, 
  ChevronRight,
  Swords
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname(); 

  const menuItems = [
    { name: "Standings", href: "/standings", icon: Trophy, color: "text-comets-yellow" },
    { name: "Schedule", href: "/schedule", icon: Calendar, color: "text-comets-red" },
    { name: "Roster Stats", href: "/leaders", icon: Users, color: "text-comets-blue" },
    { name: "Lineup.exe", href: "/tools/lineup", icon: Activity, color: "text-comets-purple" },
    { name: "Head-to-Head", href: "/tools/compare", icon: Swords, color: "text-comets-cyan" },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-surface-dark border-r border-white/10 relative overflow-hidden group/sidebar">
      <div className="absolute inset-0 scanlines opacity-10 pointer-events-none" />

      <div className="p-6 border-b border-white/10 bg-black/20">
        <div className="text-xs font-mono text-white/30 uppercase tracking-widest mb-2">System Menu</div>
        <div className="font-display text-xl text-white tracking-wider">
          MAIN <span className="text-comets-yellow">DECK</span>
        </div>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-2 px-3">
        {menuItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const isHovered = hoveredItem === item.name;

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="relative block"
            >
              <div 
                className={cn(
                  "relative z-10 flex items-center justify-between px-4 py-4 rounded-md border transition-all duration-200 group",
                  isActive 
                    ? "bg-white/10 border-comets-yellow/50" 
                    : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
                )}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded bg-black/50 transition-colors",
                    isActive || isHovered ? item.color : "text-white/40"
                  )}>
                    <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  </div>
                  
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-ui uppercase tracking-widest text-sm transition-colors",
                      isActive ? "text-white" : "text-white/60 group-hover:text-white"
                    )}>
                      {item.name}
                    </span>
                    {(isActive || isHovered) && (
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-tighter leading-none">
                        Select &gt;
                      </span>
                    )}
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isActive || isHovered ? 1 : 0, x: isActive || isHovered ? 0 : -10 }}
                  className={item.color}
                >
                  <ChevronRight size={16} />
                </motion.div>

                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-comets-yellow rounded-l-md shadow-[0_0_10px_rgba(244,208,63,0.5)]" 
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20 flex gap-2">
        <button className="flex-1 p-3 bg-white/5 hover:bg-white/10 rounded border border-white/5 hover:border-white/20 transition-colors flex justify-center text-white/40 hover:text-white">
          <Settings size={18} />
        </button>
        <button className="flex-1 p-3 bg-white/5 hover:bg-red-500/10 rounded border border-white/5 hover:border-red-500/30 transition-colors flex justify-center text-white/40 hover:text-red-400">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Trophy, Calendar, Users, Activity, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SidebarMobile() {
  const [isOpen, setIsOpen] = useState(false);
  
  const menuItems = [
    { name: "Standings", href: "/standings", icon: Trophy, color: "text-comets-yellow" },
    { name: "Schedule", href: "/schedule", icon: Calendar, color: "text-comets-red" },
    { name: "Roster Stats", href: "/leaders", icon: Users, color: "text-comets-blue" },
    { name: "Lineup.exe", href: "/tools/lineup", icon: Activity, color: "text-comets-purple" },
    { name: "Head-to-Head", href: "/tools/compare", icon: Swords, color: "text-comets-cyan" },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-black/80 border border-white/20 rounded text-white backdrop-blur-md"
      >
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 md:hidden"
            />
            
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-surface-dark border-r border-white/10 z-50 md:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div className="font-display text-xl text-white tracking-wider">
                  SYSTEM <span className="text-comets-yellow">MENU</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
                {menuItems.map((item, i) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center gap-4 p-4 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all"
                  >
                    <div className={cn("p-2 rounded bg-black/50", item.color)}>
                      <item.icon size={24} />
                    </div>
                    <span className="font-ui uppercase tracking-widest text-lg text-white/80 group-hover:text-white">
                      {item.name}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="p-6 border-t border-white/10 text-center">
                <div className="text-xs font-mono text-white/20 uppercase tracking-widest">
                  Comets League System v2.0
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
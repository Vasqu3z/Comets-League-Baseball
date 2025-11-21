"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Trophy, Calendar, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import SidebarMobile from "./SidebarMobile";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Standings", href: "/standings", icon: Trophy },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Stats", href: "/leaders", icon: Users },
    { name: "Lineup.exe", href: "/tools/lineup", icon: Activity },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-comets-yellow rounded-sm flex items-center justify-center font-display text-black text-xl group-hover:scale-110 transition-transform duration-200">
            C
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-display text-lg tracking-wider leading-none text-white">COMETS</span>
            <span className="font-ui text-xs tracking-[0.3em] text-comets-cyan leading-none">LEAGUE</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-surface-light/50 border border-white/5 rounded-full px-2 py-1">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href) && item.href !== "/";
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative px-6 py-2 rounded-full font-ui uppercase tracking-widest text-sm transition-all duration-300 group flex items-center gap-2",
                  isActive ? "text-black" : "text-white/60 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-comets-yellow rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {isActive && <item.icon size={14} />}
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 text-white/60 hover:text-comets-cyan hover:bg-white/10 rounded-full transition-colors">
            <Search size={20} strokeWidth={1.5} />
          </button>
          <button 
            className="md:hidden p-2 text-white hover:text-comets-yellow transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed right-0 top-0 bottom-0 w-3/4 max-w-xs bg-surface-dark border-l border-white/10 p-6 z-50 md:hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="font-display text-2xl text-white">MENU</span>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="text-white/60 hover:text-comets-red" />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.name} 
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 text-xl font-ui uppercase tracking-widest text-white/80 hover:text-comets-yellow hover:pl-4 transition-all duration-300 border-l-2 border-transparent hover:border-comets-yellow"
                >
                  <item.icon size={24} />
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
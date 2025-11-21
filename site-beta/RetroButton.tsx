"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  href?: string;
  children: React.ReactNode;
}

export function RetroButton({ 
  variant = "primary", 
  href, 
  className, 
  children, 
  ...props 
}: RetroButtonProps) {
  
  const baseStyles = "group relative px-8 py-4 font-display text-xl uppercase tracking-wide overflow-hidden transition-all duration-200 rounded-sm inline-block text-center cursor-pointer select-none";
  
  const variants = {
    primary: "bg-comets-yellow text-black hover:scale-105 active:scale-95",
    outline: "border border-white/20 text-white hover:bg-white/5 hover:border-white/50 backdrop-blur-sm"
  };

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {variant === "primary" && (
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(baseStyles, variants[variant], className)}>
        {content}
      </Link>
    );
  }

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props}>
      {content}
    </button>
  );
}

export default RetroButton;
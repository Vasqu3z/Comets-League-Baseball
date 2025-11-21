"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface RetroTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

export default function RetroTable<T extends { id?: string | number }>({ 
  data, 
  columns, 
  onRowClick,
  isLoading 
}: RetroTableProps<T>) {
  
  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center border border-white/10 rounded-xl bg-surface-dark/50 animate-pulse">
        <div className="text-comets-cyan font-ui tracking-widest uppercase animate-pulse">Loading Data...</div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-surface-dark/80 backdrop-blur-sm relative group">
      <div className="absolute -inset-[1px] bg-gradient-to-b from-comets-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-xl" />
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-black/40 relative overflow-hidden">
              <th className="absolute inset-0 scanlines opacity-20 pointer-events-none w-full h-full" colSpan={columns.length} />
              
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={cn(
                    "p-4 font-ui uppercase text-sm tracking-[0.15em] text-comets-yellow/80 font-bold whitespace-nowrap relative z-10",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono text-sm relative z-10">
            {data.map((item, i) => (
              <motion.tr 
                key={item.id || i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                onClick={() => onRowClick && onRowClick(item)}
                className={cn(
                  "border-b border-white/5 hover:bg-white/5 transition-all duration-200 group/row relative",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col, j) => (
                  <td key={j} className={cn("p-4 text-white/80 whitespace-nowrap", col.className)}>
                    <div className="relative z-10">
                      {col.cell 
                        ? col.cell(item, i) 
                        : col.accessorKey 
                          ? (item[col.accessorKey] as React.ReactNode) 
                          : null
                      }
                    </div>
                    {j === 0 && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-comets-cyan opacity-0 group-hover/row:opacity-100 transition-opacity duration-200" />
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="p-12 text-center text-white/30 font-ui uppercase tracking-widest">No Data Found</div>
      )}
    </div>
  );
}
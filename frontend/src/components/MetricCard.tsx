"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
  colorAccent?: "cyan" | "purple" | "green" | "warning" | "danger" | "zinc";
  className?: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  trend,
  colorAccent = "zinc",
  className,
}: MetricCardProps) {
  
  // Custom color themes
  const accents = {
    cyan: "hover:border-brand-cyan/30 shadow-brand-cyan/5",
    purple: "hover:border-brand-purple/30 shadow-brand-purple/5",
    green: "hover:border-brand-success/30 shadow-brand-success/5",
    warning: "hover:border-brand-warning/30 shadow-brand-warning/5",
    danger: "hover:border-brand-danger/30 shadow-brand-danger/5",
    zinc: "hover:border-white/10 shadow-black/5",
  };

  const bgAccents = {
    cyan: "bg-brand-cyan/10 text-brand-cyan",
    purple: "bg-brand-purple/10 text-brand-purple",
    green: "bg-brand-success/10 text-brand-success",
    warning: "bg-brand-warning/10 text-brand-warning",
    danger: "bg-brand-danger/10 text-brand-danger",
    zinc: "bg-white/5 text-zinc-300",
  };

  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative select-none",
        accents[colorAccent],
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {title}
          </span>
          <div className="text-3xl font-extrabold font-outfit text-white tracking-tight">
            {value}
          </div>
        </div>
        
        {/* Dynamic Icon */}
        <div className={cn("p-3 rounded-xl shadow-inner", bgAccents[colorAccent])}>
          {icon}
        </div>
      </div>

      {/* Trend Details */}
      {trend && (
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold select-none">
          <div
            className={cn(
              "flex items-center gap-0.5 rounded px-1.5 py-0.5",
              trend.isPositive
                ? "bg-brand-success/10 text-brand-success"
                : "bg-brand-danger/10 text-brand-danger"
            )}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{trend.value}</span>
          </div>
          <span className="text-zinc-500 font-medium">Since previous analysis</span>
        </div>
      )}
    </div>
  );
}

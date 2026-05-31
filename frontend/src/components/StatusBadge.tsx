"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "NORMAL" | "LOW" | "HIGH" | "CRITICAL" | string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status?.toUpperCase() || "NORMAL";
  
  // Custom theme mappings
  const badges = {
    NORMAL: "text-green-400 bg-green-500/10 border-green-500/20",
    LOW: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    HIGH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20 animate-pulse border-2 border-red-500/40",
  };

  const labels = {
    NORMAL: "Normal",
    LOW: "Low",
    HIGH: "High",
    CRITICAL: "Critical",
  };

  const currentStyle = badges[normalizedStatus as keyof typeof badges] || badges.NORMAL;
  const currentLabel = labels[normalizedStatus as keyof typeof labels] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase select-none",
        currentStyle,
        className
      )}
    >
      {normalizedStatus === "CRITICAL" && (
        <span className="h-1.5 w-1.5 rounded-full bg-brand-danger mr-1.5 animate-ping" />
      )}
      {currentLabel}
    </span>
  );
}

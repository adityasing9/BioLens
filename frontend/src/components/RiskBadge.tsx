"use client";

import React from "react";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  diseaseName: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | string;
  confidence: number;
  details?: string;
  className?: string;
}

export default function RiskBadge({
  diseaseName,
  riskLevel,
  confidence,
  details,
  className,
}: RiskBadgeProps) {
  const level = riskLevel?.toUpperCase() || "LOW";
  
  // Clean up enum tags into human-friendly phrases
  const formatDiseaseName = (tag: string) => {
    return tag
      .replace("_", " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Determine levels properties
  const styles = {
    LOW: {
      text: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
      bar: "bg-green-400",
      icon: CheckCircle,
    },
    MEDIUM: {
      text: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      bar: "bg-amber-400",
      icon: AlertTriangle,
    },
    HIGH: {
      text: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      bar: "bg-red-500",
      icon: Shield,
    },
  };

  const current = styles[level as keyof typeof styles] || styles.LOW;
  const Icon = current.icon;

  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 border shadow-xl relative transition-all duration-300 select-none",
        current.bg,
        className
      )}
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="space-y-0.5">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            Risk Analysis
          </span>
          <h4 className="font-outfit text-base font-bold text-white tracking-tight">
            {formatDiseaseName(diseaseName)}
          </h4>
        </div>
        
        <div className={cn("flex items-center gap-1 text-xs font-bold uppercase tracking-wide", current.text)}>
          <Icon className="h-4 w-4 shrink-0" />
          <span>{level}</span>
        </div>
      </div>

      {/* Progress Bar of confidence */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between items-center text-xs font-medium text-zinc-400">
          <span>Classifier Confidence</span>
          <span className="font-bold text-white">{confidence.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-zinc-800/40 h-2 rounded-full overflow-hidden relative">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", current.bar)}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {/* Medical Context Explanation */}
      {details && (
        <p className="text-zinc-400 text-xs leading-relaxed border-t border-white/5 pt-2.5">
          {details}
        </p>
      )}
    </div>
  );
}

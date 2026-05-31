"use client";

import React, { useEffect, useState } from "react";
import { cn, getGradeColor } from "@/lib/utils";

interface HealthGaugeProps {
  score: number;
  grade: string;
  className?: string;
}

export default function HealthGauge({ score, grade, className }: HealthGaugeProps) {
  const [offset, setOffset] = useState(283); // Circumference of radius 45 circle is 2*PI*45 = 282.74
  
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    // Animate radial fill on mount
    const progressOffset = circumference - (score / 100) * circumference;
    const timeout = setTimeout(() => {
      setOffset(progressOffset);
    }, 150);
    return () => clearTimeout(timeout);
  }, [score, circumference]);

  // Determine active colors based on score value
  const getScoreColors = (val: number) => {
    if (val >= 85) return { stroke: "stroke-brand-cyan", glow: "shadow-brand-cyan/20", bg: "bg-brand-cyan/5" };
    if (val >= 70) return { stroke: "stroke-brand-success", glow: "shadow-brand-success/20", bg: "bg-brand-success/5" };
    if (val >= 50) return { stroke: "stroke-brand-warning", glow: "shadow-brand-warning/20", bg: "bg-brand-warning/5" };
    return { stroke: "stroke-brand-danger", glow: "shadow-brand-danger/20", bg: "bg-brand-danger/5" };
  };

  const colors = getScoreColors(score);

  return (
    <div className={cn("glass rounded-2xl p-6 flex flex-col items-center justify-center relative select-none", className)}>
      <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">Overall BioLens Score</h3>
      
      <div className="relative h-44 w-44 flex items-center justify-center">
        {/* Radial Background & Fill */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-zinc-800 fill-none"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={cn("fill-none transition-all duration-1000 ease-out", colors.stroke)}
            strokeWidth="6.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Central Numeric Indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold tracking-tight font-outfit text-white">
            {score}
          </span>
          <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mt-0.5">
            Out of 100
          </span>
        </div>
      </div>

      {/* Grade Label */}
      <div className="mt-4 text-center">
        <span className="text-xs text-zinc-400 font-medium">Evaluation Grade</span>
        <div className={cn("text-lg font-bold tracking-tight font-outfit uppercase mt-0.5", getGradeColor(grade))}>
          {grade}
        </div>
      </div>
    </div>
  );
}

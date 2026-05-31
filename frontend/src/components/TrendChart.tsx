"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface TrendPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  parameterName: string;
  unit: string;
  color?: string;
  className?: string;
}

export default function TrendChart({
  data,
  parameterName,
  unit,
  color = "#06b6d4",
  className,
}: TrendChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Avoid Recharts SSR hydration mismatches by rendering only on client mount
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-72 glass rounded-2xl animate-pulse flex items-center justify-center text-zinc-500">
        Loading chart visualizer...
      </div>
    );
  }

  // Format date labels nicely
  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={cn("glass rounded-2xl p-5 shadow-xl select-none", className)}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Time-Series Trend
          </h3>
          <span className="text-lg font-bold font-outfit text-white tracking-tight">
            {parameterName.replace("_", " ")}{" "}
            <span className="text-xs text-zinc-500 font-medium">({unit})</span>
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm">
            Not enough data points to plot trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1f1f2e"
                vertical={false}
              />
              
              <XAxis
                dataKey="date"
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
                tickFormatter={formatDateLabel}
              />
              
              <YAxis
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass p-3 rounded-xl border border-white/10 shadow-2xl text-xs space-y-1">
                        <p className="text-zinc-400 font-medium">
                          {new Date(payload[0].payload.date).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )}
                        </p>
                        <p className="text-white font-bold text-sm">
                          {payload[0].value} {unit}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
                activeDot={{ r: 6, stroke: "#0a0a0f", strokeWidth: 2, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

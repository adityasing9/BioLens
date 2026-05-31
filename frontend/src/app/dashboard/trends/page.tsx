"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, RefreshCw, Layers, CheckCircle, ArrowDown, ArrowUp, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Report, TrendPoint, TrendResponse } from "@/types";
import TrendChart from "@/components/TrendChart";

const LAB_PARAMETERS = [
  { value: "HEMOGLOBIN", label: "Hemoglobin" },
  { value: "RBC", label: "Red Blood Cell Count (RBC)" },
  { value: "WBC", label: "White Blood Cell Count (WBC)" },
  { value: "PLATELETS", label: "Platelets" },
  { value: "HBA1C", label: "HbA1c" },
  { value: "BLOOD_SUGAR", label: "Fasting Blood Sugar" },
  { value: "TSH", label: "Thyroid Stimulating Hormone (TSH)" },
  { value: "T3", label: "Triiodothyronine (T3)" },
  { value: "T4", label: "Thyroxine (T4)" },
  { value: "HDL", label: "HDL Cholesterol" },
  { value: "LDL", label: "LDL Cholesterol" },
  { value: "TRIGLYCERIDES", label: "Triglycerides" },
  { value: "CHOLESTEROL", label: "Total Cholesterol" },
  { value: "CREATININE", label: "Serum Creatinine" },
  { value: "URIC_ACID", label: "Uric Acid" },
  { value: "SGOT", label: "SGOT (AST)" },
  { value: "SGPT", label: "SGPT (ALT)" },
];

export default function TrendsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedParam, setSelectedParam] = useState("HEMOGLOBIN");
  const [selectedRange, setSelectedRange] = useState("YEARLY");
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendUnit, setTrendUnit] = useState("g/dL");
  const [chartLoading, setChartLoading] = useState(false);

  // Side-by-side comparisons state
  const [baseReportId, setBaseReportId] = useState("");
  const [compareReportId, setCompareReportId] = useState("");
  const [comparisonResults, setComparisonResults] = useState<{
    improvements: string[];
    deteriorations: string[];
    stable: string[];
  } | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    // Load reports for selectors
    const loadReports = async () => {
      try {
        const res = await api.reports.getReports();
        const list = res.data || [];
        setReports(list);
        
        if (list.length >= 2) {
          // pre-select two reports for comparison
          setBaseReportId(list[1].id); // Older
          setCompareReportId(list[0].id); // Newer
        }
      } catch (err) {
        console.error("Error loading reports for selector:", err);
      }
    };
    
    loadReports();
  }, []);

  const loadTrends = async () => {
    try {
      setChartLoading(true);
      const res = await api.analytics.getTrends(selectedParam, selectedRange);
      
      // Map API points correctly
      const points = (res.data?.trend_points || []).map((p: any) => ({
        date: p.date,
        value: Number(p.value),
      }));

      // Sort points chronologically
      points.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setTrendData(points);
      setTrendUnit(res.data?.unit || "g/dL");
    } catch (err) {
      console.error("Error loading trends:", err);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, [selectedParam, selectedRange]);

  const handleCompare = async () => {
    if (!baseReportId || !compareReportId) return;
    try {
      setCompareLoading(true);
      const res = await api.analytics.getComparison(baseReportId, compareReportId);
      setComparisonResults(res.data);
    } catch (err) {
      console.error("Error running side-by-side comparison:", err);
      alert("An error occurred while comparing the diagnostic reports.");
    } finally {
      setCompareLoading(false);
    }
  };

  // Compute standard summary statistics
  const minVal = trendData.length > 0 ? Math.min(...trendData.map((d) => d.value)) : 0;
  const maxVal = trendData.length > 0 ? Math.max(...trendData.map((d) => d.value)) : 0;
  const avgVal =
    trendData.length > 0
      ? trendData.reduce((acc, d) => acc + d.value, 0) / trendData.length
      : 0;
  const currentVal = trendData.length > 0 ? trendData[trendData.length - 1].value : 0;

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-white tracking-tight flex items-center gap-2">
          Diagnostic Trend Visuals <TrendingUp className="h-6 w-6 text-brand-cyan" />
        </h1>
        <p className="text-zinc-400 text-sm">
          Map your diagnostic parameters over time and compile historical comparisons.
        </p>
      </div>

      {/* Selectors and Time-series chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Dropdown Selectors Column */}
        <div className="lg:col-span-1 glass rounded-2xl p-5 border border-white/5 shadow-xl space-y-4 self-start">
          <h3 className="font-outfit text-sm font-bold text-zinc-300 uppercase tracking-wider mb-2">
            Chart Filters
          </h3>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Target Parameter</label>
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-xs text-zinc-300 transition-all font-semibold"
            >
              {LAB_PARAMETERS.map((p) => (
                <option key={p.value} value={p.value} className="bg-zinc-950 text-white">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Date Range</label>
            <div className="flex flex-col gap-1.5">
              {["WEEKLY", "MONTHLY", "YEARLY"].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all",
                    selectedRange === range
                      ? "text-brand-cyan bg-brand-cyan/10 border-l-2 border-brand-cyan"
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                  )}
                >
                  {range} Range
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Chart Area */}
        <div className="lg:col-span-3 space-y-6">
          {chartLoading ? (
            <div className="h-80 w-full glass rounded-2xl animate-pulse flex items-center justify-center text-zinc-500">
              Generating time-series plot...
            </div>
          ) : (
            <TrendChart
              data={trendData}
              parameterName={selectedParam}
              unit={trendUnit}
            />
          )}

          {/* Core Stats Overview */}
          {trendData.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass rounded-xl p-4 border border-white/5 text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Current Value</span>
                <div className="text-xl font-bold font-outfit text-white mt-1">
                  {currentVal.toFixed(2)} <span className="text-xs font-medium text-zinc-400">{trendUnit}</span>
                </div>
              </div>
              
              <div className="glass rounded-xl p-4 border border-white/5 text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Historical Average</span>
                <div className="text-xl font-bold font-outfit text-white mt-1">
                  {avgVal.toFixed(2)} <span className="text-xs font-medium text-zinc-400">{trendUnit}</span>
                </div>
              </div>

              <div className="glass rounded-xl p-4 border border-white/5 text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Lowest Marker</span>
                <div className="text-xl font-bold font-outfit text-white mt-1">
                  {minVal.toFixed(2)} <span className="text-xs font-medium text-zinc-400">{trendUnit}</span>
                </div>
              </div>

              <div className="glass rounded-xl p-4 border border-white/5 text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Highest Peak</span>
                <div className="text-xl font-bold font-outfit text-white mt-1">
                  {maxVal.toFixed(2)} <span className="text-xs font-medium text-zinc-400">{trendUnit}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Split Side-by-side Reports Comparator */}
      <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl max-w-4xl mx-auto">
        <h3 className="font-outfit text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
          <Layers className="h-5 w-5 text-brand-purple" />
          <span>Side-by-Side Diagnostic Report Comparator</span>
        </h3>
        <p className="text-zinc-400 text-xs mb-6">
          Compare diagnostic parameter shifts from an older reference report (base) to a newer report (compare).
        </p>

        {reports.length < 2 ? (
          <div className="text-center py-10 text-zinc-500 text-sm">
            Please upload at least 2 reports to execute comparisons.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pickers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Base Report (Older Reference)</label>
                <select
                  value={baseReportId}
                  onChange={(e) => setBaseReportId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 outline-none text-xs text-zinc-300 font-semibold"
                >
                  {reports.map((r) => (
                    <option key={r.id} value={r.id} className="bg-zinc-950 text-white">
                      {r.file_name} ({new Date(r.uploaded_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Comparison Report (Newer)</label>
                <select
                  value={compareReportId}
                  onChange={(e) => setCompareReportId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 outline-none text-xs text-zinc-300 font-semibold"
                >
                  {reports.map((r) => (
                    <option key={r.id} value={r.id} className="bg-zinc-950 text-white">
                      {r.file_name} ({new Date(r.uploaded_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Run Button */}
            <div className="text-center">
              <button
                onClick={handleCompare}
                disabled={compareLoading || baseReportId === compareReportId}
                className="px-6 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple/80 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50"
              >
                {compareLoading ? "Running calculations..." : "Run Side-by-Side Comparison"}
              </button>
              {baseReportId === compareReportId && (
                <span className="text-[10px] text-brand-danger block mt-1.5 font-semibold">
                  Please select two distinct reports to compare.
                </span>
              )}
            </div>

            {/* Comparison Outputs */}
            {comparisonResults && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                {/* Improvements */}
                <div className="space-y-3">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <ArrowUp className="h-3 w-3 text-brand-success" />
                    <span>Improvements</span>
                  </span>
                  {comparisonResults.improvements.length === 0 ? (
                    <p className="text-zinc-500 text-xs italic pl-4">No improvements flagged.</p>
                  ) : (
                    <ul className="space-y-2">
                      {comparisonResults.improvements.map((imp, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-start gap-2 bg-brand-success/5 border border-brand-success/15 p-2 rounded-lg leading-relaxed">
                          <CheckCircle className="h-3.5 w-3.5 text-brand-success shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Deteriorations */}
                <div className="space-y-3">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <ArrowDown className="h-3 w-3 text-brand-danger" />
                    <span>Deteriorations</span>
                  </span>
                  {comparisonResults.deteriorations.length === 0 ? (
                    <p className="text-zinc-500 text-xs italic pl-4">No deteriorations flagged.</p>
                  ) : (
                    <ul className="space-y-2">
                      {comparisonResults.deteriorations.map((det, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-start gap-2 bg-brand-danger/5 border border-brand-danger/15 p-2 rounded-lg leading-relaxed">
                          <AlertTriangle className="h-3.5 w-3.5 text-brand-danger shrink-0 mt-0.5" />
                          <span>{det}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Stable */}
                <div className="space-y-3">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Stable / No Shift
                  </span>
                  {comparisonResults.stable.length === 0 ? (
                    <p className="text-zinc-500 text-xs italic pl-4">No stable parameters.</p>
                  ) : (
                    <ul className="space-y-2">
                      {comparisonResults.stable.map((stb, i) => (
                        <li key={i} className="text-xs text-zinc-400 flex items-start gap-2 bg-white/5 border border-white/5 p-2 rounded-lg leading-relaxed">
                          <span>•</span>
                          <span>{stb}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  TrendingUp,
  Shield,
  Activity,
  Calendar,
  Sparkles,
  ArrowRight,
  BrainCircuit,
} from "lucide-react";
import { api } from "@/lib/api";
import { Report, RiskPrediction } from "@/types";
import HealthGauge from "@/components/HealthGauge";
import MetricCard from "@/components/MetricCard";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";

export default function DashboardHome() {
  const [firstName, setFirstName] = useState("Jane");
  const [reports, setReports] = useState<Report[]>([]);
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [risks, setRisks] = useState<RiskPrediction[]>([]);
  const [healthScore, setHealthScore] = useState(91); // Default initial seed
  const [healthGrade, setHealthGrade] = useState("EXCELLENT");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load local first name
    const storedName = localStorage.getItem("user_first_name");
    if (storedName) setFirstName(storedName);

    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // 1. Fetch reports history
        const reportsRes = await api.reports.getReports();
        const reportsList: Report[] = reportsRes.data || [];
        setReports(reportsList);

        if (reportsList.length > 0) {
          // Latest report
          const latest = reportsList[0];
          setLatestReport(latest);
          
          if (latest.health_score) {
            setHealthScore(latest.health_score);
            // Grade from score
            if (latest.health_score >= 85) {
              setHealthGrade("EXCELLENT");
            } else if (latest.health_score >= 70) {
              setHealthGrade("GOOD");
            } else if (latest.health_score >= 50) {
              setHealthGrade("MODERATE");
            } else {
              setHealthGrade("POOR");
            }
          }

          // 2. Fetch risk predictions for latest report
          try {
            const risksRes = await api.risks.getRisksByReport(latest.id);
            setRisks(risksRes.data || []);
          } catch (e) {
            console.error("Error loading risk predictions:", e);
          }
        }
      } catch (err) {
        console.error("Error loading dashboard diagnostics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center text-zinc-500 gap-4">
        <BrainCircuit className="h-10 w-10 text-brand-cyan animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest">Compiling Health Portfolio...</span>
      </div>
    );
  }

  // Count active high risks
  const activeRisksCount = risks.filter((r) => r.risk_level === "HIGH").length;

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-white tracking-tight flex items-center gap-2">
            Hello, {firstName} <Sparkles className="h-5 w-5 text-brand-cyan animate-bounce" />
          </h1>
          <p className="text-zinc-400 text-sm">
            Here is your dynamic biotechnology diagnostics and clinical health analysis summary.
          </p>
        </div>
        
        {/* Quick CTAs */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-black bg-brand-cyan hover:bg-brand-cyan-hover rounded-xl shadow-lg transition-all"
          >
            <Upload className="h-4 w-4" />
            Upload Report
          </Link>
          <Link
            href="/dashboard/trends"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold glass border border-white/10 hover:border-brand-cyan/20 rounded-xl transition-all"
          >
            <TrendingUp className="h-4 w-4" />
            Explore Trends
          </Link>
        </div>
      </div>

      {reports.length === 0 ? (
        /* Empty State */
        <div className="glass rounded-3xl p-12 border border-white/5 text-center max-w-xl mx-auto space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan mx-auto">
            <FileText className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-outfit text-xl font-bold text-white tracking-tight">No medical reports found</h3>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
              Upload a blood panel PDF or image scan to parse diagnostic data and populate your live tracking portfolio.
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple text-white font-bold text-sm shadow-xl"
          >
            <span>Upload Medical Report</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        /* Standard Dashboard Layout */
        <>
          {/* Top Row: MetricCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              title="BioLens Score"
              value={`${healthScore}/100`}
              icon={<Activity className="h-5 w-5" />}
              colorAccent="cyan"
            />
            <MetricCard
              title="Total Uploads"
              value={reports.length}
              icon={<FileText className="h-5 w-5" />}
              colorAccent="purple"
            />
            <MetricCard
              title="Active High Risks"
              value={activeRisksCount}
              icon={<Shield className="h-5 w-5" />}
              colorAccent={activeRisksCount > 0 ? "danger" : "green"}
            />
            <MetricCard
              title="Last Analyzed Ingestion"
              value={latestReport ? new Date(latestReport.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "None"}
              icon={<Calendar className="h-5 w-5" />}
              colorAccent="zinc"
            />
          </div>

          {/* Core Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Overall Health Gauge */}
            <div className="lg:col-span-1">
              <HealthGauge score={healthScore} grade={healthGrade} className="h-full" />
            </div>

            {/* Right: Risk Predictions Overview */}
            <div className="lg:col-span-2 glass rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="font-outfit text-lg font-bold text-white tracking-tight mb-1">
                  ML Clinical Risk Predictions
                </h3>
                <p className="text-zinc-400 text-xs mb-5">
                  Pre-trained predictive models comparing demographics against extracted blood panel parameters.
                </p>
                
                {risks.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-sm">
                    No risk predictions available. Processing parameters...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {risks.slice(0, 4).map((risk) => (
                      <RiskBadge
                        key={risk.id || risk.disease_name}
                        diseaseName={risk.disease_name}
                        riskLevel={risk.risk_level}
                        confidence={Number(risk.confidence_percentage)}
                        details={risk.details}
                      />
                    ))}
                  </div>
                )}
              </div>

              {latestReport && (
                <div className="mt-4 border-t border-white/5 pt-4 text-right">
                  <Link
                    href={`/dashboard/reports/${latestReport.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-cyan hover:underline font-bold"
                  >
                    <span>View full diagnostics breakdown</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Table: Recent Reports list */}
          <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl">
            <h3 className="font-outfit text-lg font-bold text-white tracking-tight mb-4">
              Recent Reports Ingestion History
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-4">Filename</th>
                    <th className="pb-3">Ingested At</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Health score</th>
                    <th className="pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {reports.slice(0, 5).map((report) => (
                    <tr key={report.id} className="hover:bg-white/5 transition-all">
                      <td className="py-3.5 pl-4 font-semibold text-zinc-100 flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-brand-cyan shrink-0" />
                        <span className="truncate max-w-[200px] sm:max-w-md">{report.file_name}</span>
                      </td>
                      <td className="py-3.5 text-zinc-400">
                        {new Date(report.uploaded_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={report.upload_status} />
                      </td>
                      <td className="py-3.5">
                        <span className="font-extrabold text-zinc-100">
                          {report.health_score ? `${report.health_score}/100` : "--"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-right">
                        <Link
                          href={`/dashboard/reports/${report.id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan text-xs font-bold transition-all"
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

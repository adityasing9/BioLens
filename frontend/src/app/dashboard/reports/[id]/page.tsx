"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  Activity,
  AlertTriangle,
  HeartPulse,
  Shield,
  Sparkles,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { ReportDetail, RiskPrediction } from "@/types";
import HealthGauge from "@/components/HealthGauge";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [risks, setRisks] = useState<RiskPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const loadReportDetails = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        // 1. Fetch full report parameters
        const detailRes = await api.reports.getReportById(id);
        setReport(detailRes.data);

        // 2. Fetch risk predictions
        try {
          const risksRes = await api.risks.getRisksByReport(id);
          setRisks(risksRes.data || []);
        } catch (e) {
          console.error("Error loading risks:", e);
        }
      } catch (err: any) {
        console.error("Error loading report:", err);
        setError(err.response?.data?.message || "Failed to load report diagnostic data. It might be processing.");
      } finally {
        setIsLoading(false);
      }
    };

    loadReportDetails();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!id) return;
    setIsPdfDownloading(true);
    try {
      const res = await api.reports.downloadPdf(id);
      
      // Axios request helper returns the blob
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BioLens_Report_${report?.file_name || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF summary:", err);
      alert("An error occurred while generating your report PDF. Please try again.");
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const getCleanParamName = (tag: string) => {
    return tag
      .replace("_", " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center text-zinc-500 gap-4">
        <Loader2 className="h-10 w-10 text-brand-cyan animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest">Ingesting Parameter Arrays...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6 max-w-lg mx-auto text-center py-20 font-sans">
        <div className="h-16 w-16 rounded-2xl bg-brand-danger/10 flex items-center justify-center text-brand-danger mx-auto">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold font-outfit text-white tracking-tight">Report Retrieval Issue</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{error || "The medical report was not found."}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs font-bold hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-semibold transition-all"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Overview
      </Link>

      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold font-outfit text-white tracking-tight flex items-center gap-2 truncate max-w-xl">
            <FileText className="h-8 w-8 text-brand-cyan shrink-0 animate-pulse" />
            <span className="truncate">{report.file_name}</span>
          </h1>
          <div className="flex items-center gap-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <span>Uploaded {new Date(report.uploaded_at).toLocaleDateString("en-US", { dateStyle: "long" })}</span>
            <span>•</span>
            <span>Mime: {report.file_type || "PDF Document"}</span>
          </div>
        </div>

        {/* Download PDF Trigger */}
        <button
          onClick={handleDownloadPdf}
          disabled={isPdfDownloading}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple hover:from-brand-cyan-hover hover:to-brand-cyan text-white font-bold text-sm shadow-xl cursor-pointer disabled:opacity-50"
        >
          {isPdfDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating PDF Summary...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download Printable PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Hand: Health Score and AI Summary Details */}
        <div className="lg:col-span-1 space-y-6">
          <HealthGauge
            score={report.health_score || 0}
            grade={
              report.health_score && report.health_score >= 85
                ? "EXCELLENT"
                : report.health_score && report.health_score >= 70
                ? "GOOD"
                : report.health_score && report.health_score >= 50
                ? "MODERATE"
                : "POOR"
            }
          />
          
          {/* AI Comprehensive Summary Card */}
          <div className="glass rounded-2xl p-6 border border-brand-cyan/20 shadow-xl relative">
            <div className="absolute top-4 right-4 text-brand-cyan animate-pulse">
              <Sparkles className="h-4 w-4" />
            </div>
            
            <h3 className="font-outfit text-base font-bold text-white tracking-tight mb-3 flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-brand-cyan" />
              <span>AI Summary Assessment</span>
            </h3>
            
            <p className="text-zinc-300 text-xs leading-relaxed font-medium">
              {report.ai_summary || "Our medical engine is summarizing findings..."}
            </p>
          </div>
        </div>

        {/* Right Hand: Deep dive Parameter Breakdown Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk predictions grid */}
          {risks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-outfit text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-purple" />
                <span>Predictive Disease Risk Assessment</span>
              </h3>
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
            </div>
          )}

          {/* Parameters Detail Listings */}
          <div className="space-y-4">
            <h3 className="font-outfit text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-cyan" />
              <span>Detailed Lab Parameter Ingestion</span>
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {report.parameters && report.parameters.length === 0 ? (
                <div className="text-center py-10 glass rounded-2xl text-zinc-500 text-sm border border-white/5">
                  No parameters were extracted from the document scan.
                </div>
              ) : (
                report.parameters && report.parameters.map((param) => (
                  <div
                    key={param.parameter_name}
                    className="glass rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Parameter Label and Value */}
                    <div className="space-y-1 sm:max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-outfit text-sm font-bold text-zinc-100">
                          {getCleanParamName(param.parameter_name)}
                        </span>
                        <StatusBadge status={param.status} />
                      </div>
                      <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">
                        Reference Range: {param.reference_range_min} - {param.reference_range_max}{" "}
                        {param.unit}
                      </div>
                    </div>
                    
                    {/* Parameter Value Indicator */}
                    <div className="text-right sm:text-center shrink-0">
                      <div className="text-2xl font-extrabold text-white tracking-tight font-outfit">
                        {param.parameter_value}{" "}
                        <span className="text-xs text-zinc-500 font-bold">{param.unit}</span>
                      </div>
                    </div>
                    
                    {/* Patient-safe explanation */}
                    {param.ai_interpretation && (
                      <p className="text-zinc-400 text-xs sm:max-w-sm border-t sm:border-t-0 sm:border-l border-white/5 pt-3.5 sm:pt-0 sm:pl-5 leading-relaxed">
                        {param.ai_interpretation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Safety compliance disclaimer */}
      <div className="max-w-4xl mx-auto rounded-2xl bg-brand-danger/5 border border-brand-danger/25 p-4 text-center">
        <span className="text-[10px] font-bold text-brand-danger uppercase tracking-widest block mb-1">
          Safety Compliance Medical Disclaimer
        </span>
        <p className="text-zinc-400 text-xs leading-relaxed">
          BioLens AI provides informational analysis based on extracted laboratory report data. It does not provide medical diagnoses, treatment plans, or clinical decisions. Please consult a licensed healthcare professional for medical advice.
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadCloud, CheckCircle, RefreshCw, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Report } from "@/types";
import FileUploader from "@/components/FileUploader";
import StatusBadge from "@/components/StatusBadge";

export default function UploadReportPage() {
  const router = useRouter();
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecentReports = async () => {
    try {
      setIsLoading(true);
      const res = await api.reports.getReports();
      setRecentReports((res.data || []).slice(0, 4));
    } catch (err) {
      console.error("Error loading recent uploads:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentReports();
  }, []);

  const handleUploadSuccess = (reportId: string) => {
    // Refresh the local history logs after a brief period
    setTimeout(() => {
      fetchRecentReports();
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-white tracking-tight flex items-center gap-2">
          Ingest Laboratory Scans <UploadCloud className="h-6 w-6 text-brand-cyan" />
        </h1>
        <p className="text-zinc-400 text-sm">
          Select clinical blood panel files to trigger OpenCV optical scanning and structured medical parsing.
        </p>
      </div>

      {/* Main FileUploader Widget */}
      <div className="py-4">
        <FileUploader onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Compliance Guidelines */}
      <div className="glass rounded-2xl p-5 border border-white/5 shadow-xl max-w-2xl mx-auto flex gap-4 items-start text-xs leading-relaxed text-zinc-400">
        <AlertTriangle className="h-5 w-5 text-brand-warning shrink-0" />
        <div className="space-y-1">
          <span className="font-bold text-zinc-200">Optical Character Recognition Ingestion Warnings</span>
          <p>
            Please guarantee that document scans have high legibility, proper focus alignment, and low distortion. Handwritten files or heavily crinkled papers might limit dual-engine parsing accuracy. The backend binarizer will clean minor skewing and light noise automatically.
          </p>
        </div>
      </div>

      {/* Recent Uploads Audit Table */}
      <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-outfit text-lg font-bold text-white tracking-tight">
            Recent Lab Document Submissions
          </h3>
          <button
            onClick={fetchRecentReports}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>

        {recentReports.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-sm">
            No document submission history found. Use the drag-zone above to upload.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-4">Filename</th>
                  <th className="pb-3">Uploaded At</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-white/5 transition-all">
                    <td className="py-3.5 pl-4 font-semibold text-zinc-100 flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-brand-purple shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-md">{report.file_name}</span>
                    </td>
                    <td className="py-3.5 text-zinc-400">
                      {new Date(report.uploaded_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={report.upload_status} />
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      {report.upload_status === "COMPLETED" ? (
                        <Link
                          href={`/dashboard/reports/${report.id}`}
                          className="inline-flex items-center gap-1 text-xs text-brand-cyan font-bold hover:underline"
                        >
                          <span>Review Diagnostics</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-zinc-500 font-semibold italic">Processing...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

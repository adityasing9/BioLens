"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  FileText,
  ScrollText,
  Activity,
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AdminDashboard, User as UserType, Report, AuditLog } from "@/types";
import StatusBadge from "@/components/StatusBadge";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"metrics" | "users" | "reports" | "logs">("metrics");
  
  // States
  const [metrics, setMetrics] = useState<AdminDashboard | null>(null);
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [logsList, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const verifyAdmin = () => {
    const isLocalAdmin = localStorage.getItem("is_admin") === "true";
    if (!isLocalAdmin) {
      router.push("/dashboard");
    }
  };

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      // Load metrics dashboard
      const mRes = await api.admin.getDashboard();
      setMetrics(mRes.data);

      // Load user list
      const uRes = await api.admin.getUsers();
      setUsersList(uRes.data || []);

      // Load report list
      const rRes = await api.admin.getReports();
      setReportsList(rRes.data || []);

      // Load audit logs list
      const lRes = await api.admin.getAuditLogs();
      setAuditLogs(lRes.data || []);

    } catch (err) {
      console.error("Error loading admin records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifyAdmin();
    loadAdminData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(userId);
      await api.admin.toggleUserStatus(userId);
      
      // Update local state state
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
    } catch (err) {
      console.error("Error toggling user status:", err);
      alert("Failed to adjust user activation status.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter users by search query
  const filteredUsers = usersList.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center text-zinc-500 gap-4">
        <Cpu className="h-10 w-10 text-brand-purple animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest">Opening Secure Core Panel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-white tracking-tight flex items-center gap-2">
            System Governance Console <Shield className="h-6 w-6 text-brand-purple animate-pulse" />
          </h1>
          <p className="text-zinc-400 text-sm">
            Monitor API metrics, manage patient profiles, audit reports, and investigate security logs.
          </p>
        </div>
        <button
          onClick={loadAdminData}
          className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 gap-1 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("metrics")}
          className={cn(
            "px-4 py-3 border-b-2 transition-all",
            activeTab === "metrics"
              ? "text-brand-purple border-brand-purple bg-brand-purple/5"
              : "text-zinc-500 border-transparent hover:text-zinc-300"
          )}
        >
          System Health
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "px-4 py-3 border-b-2 transition-all",
            activeTab === "users"
              ? "text-brand-purple border-brand-purple bg-brand-purple/5"
              : "text-zinc-500 border-transparent hover:text-zinc-300"
          )}
        >
          Patient Governance
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={cn(
            "px-4 py-3 border-b-2 transition-all",
            activeTab === "reports"
              ? "text-brand-purple border-brand-purple bg-brand-purple/5"
              : "text-zinc-500 border-transparent hover:text-zinc-300"
          )}
        >
          Reports Audit
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={cn(
            "px-4 py-3 border-b-2 transition-all",
            activeTab === "logs"
              ? "text-brand-purple border-brand-purple bg-brand-purple/5"
              : "text-zinc-500 border-transparent hover:text-zinc-300"
          )}
        >
          Audit Compliance
        </button>
      </div>

      {/* Tab: System Health Metrics */}
      {activeTab === "metrics" && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Registered Patients</span>
                <div className="text-3xl font-extrabold font-outfit text-white">{metrics.total_users}</div>
              </div>
              <div className="p-3 rounded-xl bg-brand-purple/10 text-brand-purple"><Users className="h-5 w-5" /></div>
            </div>
            
            <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Reports Compiled</span>
                <div className="text-3xl font-extrabold font-outfit text-white">{metrics.total_reports_processed}</div>
              </div>
              <div className="p-3 rounded-xl bg-brand-cyan/10 text-brand-cyan"><FileText className="h-5 w-5" /></div>
            </div>

            <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">OCR Ingestion Rate</span>
                <div className="text-3xl font-extrabold font-outfit text-brand-success">{metrics.ocr_average_accuracy_percent}%</div>
              </div>
              <div className="p-3 rounded-xl bg-brand-success/10 text-brand-success"><Cpu className="h-5 w-5" /></div>
            </div>

            <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">System Errors (24H)</span>
                <div className={cn("text-3xl font-extrabold font-outfit", metrics.system_errors_last_24h > 0 ? "text-brand-danger" : "text-zinc-500")}>
                  {metrics.system_errors_last_24h}
                </div>
              </div>
              <div className={cn("p-3 rounded-xl", metrics.system_errors_last_24h > 0 ? "bg-brand-danger/10 text-brand-danger animate-pulse" : "bg-white/5 text-zinc-500")}>
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Quick Info Alerts */}
          <div className="glass rounded-2xl p-5 border border-white/5 flex gap-4 items-start text-xs leading-relaxed text-zinc-400">
            <CheckCircle className="h-5 w-5 text-brand-success shrink-0" />
            <div className="space-y-1">
              <span className="font-bold text-zinc-200">Ingestion Cluster Health Status</span>
              <p>
                All optical scanning and clinical binarizers are executing normally. Gemini models (flash/pro) are responsive with latency under 1.5 seconds. Relational MySQL transactions hold zero pipeline bottlenecks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Patient Governance */}
      {activeTab === "users" && (
        <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-outfit text-lg font-bold text-white tracking-tight">Registered Patients Catalog</h3>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search patient, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/5 focus:border-brand-purple/50 outline-none text-xs text-zinc-200 placeholder-zinc-500 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-4">Patient Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Joined Date</th>
                  <th className="pb-3">Governance Role</th>
                  <th className="pb-3">Active Status</th>
                  <th className="pb-3 pr-4 text-right">Toggle Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-all">
                    <td className="py-3.5 pl-4 font-semibold text-zinc-100 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px] text-brand-purple">
                        {user.first_name[0] + user.last_name[0]}
                      </div>
                      <span>{user.first_name} {user.last_name}</span>
                    </td>
                    <td className="py-3.5 text-zinc-400">{user.email}</td>
                    <td className="py-3.5 text-zinc-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">
                      {user.email === "admin@biolens.ai" ? (
                        <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-2 py-0.5 rounded-full uppercase">
                          Superadmin
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full uppercase">
                          Patient
                        </span>
                      )}
                    </td>
                    <td className="py-3.5">
                      {user.is_active ? (
                        <span className="text-brand-success text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-xs font-semibold flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" /> Locked
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      {user.email === "admin@biolens.ai" ? (
                        <span className="text-[10px] text-zinc-500 font-semibold italic">Protected</span>
                      ) : (
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          disabled={actionLoading === user.id}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            user.is_active
                              ? "bg-brand-danger/10 hover:bg-brand-danger/25 text-brand-danger border border-brand-danger/15"
                              : "bg-brand-success/10 hover:bg-brand-success/25 text-brand-success border border-brand-success/15"
                          )}
                        >
                          {actionLoading === user.id ? "Loading..." : user.is_active ? "Lock" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Reports Oversight */}
      {activeTab === "reports" && (
        <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl space-y-4">
          <h3 className="font-outfit text-lg font-bold text-white tracking-tight">System-Wide Compiled Diagnostics</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-4">Filename</th>
                  <th className="pb-3">Ingested At</th>
                  <th className="pb-3">OCR Status</th>
                  <th className="pb-3 pr-4 text-right">Score Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {reportsList.map((report) => (
                  <tr key={report.id} className="hover:bg-white/5 transition-all">
                    <td className="py-3.5 pl-4 font-semibold text-zinc-100 flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-brand-cyan shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-md">{report.file_name}</span>
                    </td>
                    <td className="py-3.5 text-zinc-400">
                      {new Date(report.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={report.upload_status} />
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <span className="font-extrabold text-zinc-100">
                        {report.health_score ? `${report.health_score}/100` : "--"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Compliance Audit Logs */}
      {activeTab === "logs" && (
        <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl space-y-4">
          <h3 className="font-outfit text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-brand-purple" />
            <span>Relational Security Audit Index</span>
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-4">Action Method</th>
                  <th className="pb-3">Table Scope</th>
                  <th className="pb-3">Source IP</th>
                  <th className="pb-3">Logged Date</th>
                  <th className="pb-3 pr-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-xs">
                {logsList.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-all">
                    <td className="py-3 pl-4 font-bold text-zinc-200 uppercase tracking-wide">
                      {log.action}
                    </td>
                    <td className="py-3 text-zinc-300 font-semibold">{log.table_name}</td>
                    <td className="py-3 text-zinc-400">{log.ip_address}</td>
                    <td className="py-3 text-zinc-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-zinc-400 leading-normal truncate max-w-sm">
                      {log.details || "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

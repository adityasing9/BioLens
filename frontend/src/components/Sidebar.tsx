"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  FileText,
  TrendingUp,
  MessageSquare,
  Settings,
  Shield,
  Users,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const adminVal = localStorage.getItem("is_admin") === "true";
    setIsAdmin(adminVal);
  }, []);

  const patientLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Upload Report", href: "/dashboard/upload", icon: Upload },
    { name: "Trends Visuals", href: "/dashboard/trends", icon: TrendingUp },
    { name: "AI Assistant", href: "/dashboard/assistant", icon: MessageSquare },
  ];

  const adminLinks = [
    { name: "Admin Console", href: "/dashboard/admin", icon: Shield },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-[calc(100vh-68px)] glass border-r border-white/5 transition-all duration-300 relative",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Collapse Trigger Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-4 -right-3.5 h-7 w-7 rounded-full bg-zinc-900 border border-white/10 hover:border-brand-cyan/40 text-zinc-400 hover:text-white flex items-center justify-center shadow-md transition-all z-40"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Main Sidebar Contents */}
      <div className="flex-1 py-6 px-4 space-y-7 overflow-y-auto">
        {/* Patient Modules */}
        <div className="space-y-2">
          {!collapsed && (
            <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-2">
              Diagnostics
            </span>
          )}
          <nav className="flex flex-col gap-1">
            {patientLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                    isActive
                      ? "text-brand-cyan bg-brand-cyan/10 border-l-2 border-brand-cyan"
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-brand-cyan" : "text-zinc-400 group-hover:text-white")} />
                  {!collapsed && <span className="animate-fade-in">{link.name}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all rounded-md px-2 py-1 bg-zinc-900 text-xs text-white border border-white/10 shadow-xl whitespace-nowrap z-50 pointer-events-none">
                      {link.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Modules */}
        {isAdmin && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            {!collapsed && (
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-2">
                System Governance
              </span>
            )}
            <nav className="flex flex-col gap-1">
              {adminLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                      isActive
                        ? "text-brand-purple bg-brand-purple/10 border-l-2 border-brand-purple"
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-brand-purple" : "text-zinc-400 group-hover:text-white")} />
                    {!collapsed && <span className="animate-fade-in">{link.name}</span>}
                    
                    {/* Tooltip */}
                    {collapsed && (
                      <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all rounded-md px-2 py-1 bg-zinc-900 text-xs text-white border border-white/10 shadow-xl whitespace-nowrap z-50 pointer-events-none">
                        {link.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Settings Footer */}
      <div className="p-4 border-t border-white/5">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all group relative",
            pathname === "/dashboard/settings" && "text-brand-cyan bg-brand-cyan/10"
          )}
        >
          <Settings className="h-5 w-5 shrink-0 group-hover:text-white" />
          {!collapsed && <span className="animate-fade-in">Settings</span>}
          {collapsed && (
            <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all rounded-md px-2 py-1 bg-zinc-900 text-xs text-white border border-white/10 shadow-xl whitespace-nowrap z-50 pointer-events-none">
              Settings
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}

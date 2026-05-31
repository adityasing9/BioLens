"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check JWT access token
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 font-sans">
        <div className="h-10 w-10 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-semibold tracking-widest uppercase">
          Verifying credentials...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-mesh font-sans">
      {/* Top Navbar */}
      <Navbar />
      
      {/* Sidebar + Main Content Grid */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}

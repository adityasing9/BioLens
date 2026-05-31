"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dna, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill out all credentials.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Authenticate with JWT token endpoint
      const loginRes = await api.auth.login({ email, password });
      const { access_token, refresh_token } = loginRes.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      // 2. Query `/me` profile endpoint to fetch first_name, last_name, role details
      const profileRes = await api.auth.getMe();
      const user = profileRes.data;

      localStorage.setItem("user_first_name", user.first_name);
      localStorage.setItem("user_last_name", user.last_name);
      localStorage.setItem("user_email", user.email);
      
      // Determine if user has admin profiles
      const isAdminUser = user.email === "admin@biolens.ai" || !!user.admin_profile;
      localStorage.setItem("is_admin", String(isAdminUser));

      // 3. Redirect to overview dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid email or password combination. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSandboxDemo = () => {
    // Populate credentials for rapid testing
    setEmail("patient@biolens.ai");
    setPassword("Password123!");
  };

  const handleAdminSandboxDemo = () => {
    // Populate credentials for admin testing
    setEmail("admin@biolens.ai");
    setPassword("AdminSecure123!");
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-6 relative font-sans">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/3 h-[250px] w-[250px] rounded-full bg-brand-cyan/5 blur-[80px] pointer-events-none" />
      
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-purple flex items-center justify-center shadow-lg shadow-brand-cyan/20">
              <Dna className="h-6 w-6 text-white" />
            </div>
            <span className="font-outfit text-2xl font-bold tracking-tight text-white">
              BioLens<span className="text-brand-cyan">.AI</span>
            </span>
          </Link>
          <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            Health Intelligence Ingestion
          </span>
        </div>

        {/* Login Form Container */}
        <div className="glass rounded-3xl p-8 border border-white/5 shadow-2xl relative">
          <h2 className="text-2xl font-bold font-outfit text-white tracking-tight mb-2">
            Welcome back
          </h2>
          <p className="text-zinc-400 text-xs mb-6">
            Sign in to track parameters, upload scans, or consult the AI advisor.
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-brand-danger/10 border border-brand-danger/25 text-brand-danger text-xs flex gap-2.5 items-center animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type="email"
                  id="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold text-zinc-400">
                  Account Password
                </label>
                <span className="text-[10px] text-zinc-500 hover:text-brand-cyan hover:underline cursor-pointer">
                  Forgot Password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple hover:from-brand-cyan-hover hover:to-brand-cyan text-white font-bold text-sm shadow-xl shadow-brand-cyan/10 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Sandbox Demos */}
          <div className="mt-6 border-t border-white/5 pt-4 space-y-2">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block text-center">
              Quick Ingestion Sandbox
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleSandboxDemo}
                className="flex-1 py-2 px-3 rounded-lg bg-brand-cyan/5 border border-brand-cyan/10 hover:bg-brand-cyan/10 text-[10px] text-brand-cyan font-bold transition-all text-center"
              >
                Patient Demo
              </button>
              <button
                onClick={handleAdminSandboxDemo}
                className="flex-1 py-2 px-3 rounded-lg bg-brand-purple/5 border border-brand-purple/10 hover:bg-brand-purple/10 text-[10px] text-brand-purple font-bold transition-all text-center"
              >
                Admin Demo
              </button>
            </div>
          </div>

          {/* Registration Referral */}
          <div className="mt-6 text-center text-xs text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-cyan font-bold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

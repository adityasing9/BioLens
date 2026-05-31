"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dna, Mail, Lock, User as UserIcon, Calendar, Phone, ArrowRight, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("MALE");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Standard client validation
    if (!firstName || !lastName || !email || !password || !confirmPassword || !dob) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // Trigger FastAPI auth registration
      await api.auth.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        gender: gender.toUpperCase(),
        phone_number: phoneNumber || undefined,
      });

      setSuccess("Account created successfully! Redirecting to login portal...");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.response?.data?.message || "Registration failed. Please verify your details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-6 relative font-sans">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/3 h-[250px] w-[250px] rounded-full bg-brand-purple/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-lg animate-fade-in my-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-purple flex items-center justify-center shadow-lg shadow-brand-cyan/20">
              <Dna className="h-6 w-6 text-white" />
            </div>
            <span className="font-outfit text-2xl font-bold tracking-tight text-white">
              BioLens<span className="text-brand-cyan">.AI</span>
            </span>
          </Link>
          <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            Patient Identity Management
          </span>
        </div>

        {/* Form Container */}
        <div className="glass rounded-3xl p-8 border border-white/5 shadow-2xl relative">
          <h2 className="text-2xl font-bold font-outfit text-white tracking-tight mb-1">
            Create an account
          </h2>
          <p className="text-zinc-400 text-xs mb-6">
            Ingest reports, secure your diagnostics data, and track medical parameters.
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-brand-danger/10 border border-brand-danger/25 text-brand-danger text-xs flex gap-2.5 items-center animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-brand-success/10 border border-brand-success/25 text-brand-success text-xs flex gap-2.5 items-center">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First and Last Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="first_name" className="text-xs font-semibold text-zinc-400">
                  First Name *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="text"
                    id="first_name"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-all font-medium"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label htmlFor="last_name" className="text-xs font-semibold text-zinc-400">
                  Last Name *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="text"
                    id="last_name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-400">
                Email Address *
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

            {/* Password and Confirm Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-semibold text-zinc-400">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="password"
                    id="password"
                    placeholder="Min 8 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="confirm_password" className="text-xs font-semibold text-zinc-400">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="password"
                    id="confirm_password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Demographics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="dob" className="text-xs font-semibold text-zinc-400">
                  Date of Birth *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="date"
                    id="dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-sm text-zinc-300 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="gender" className="text-xs font-semibold text-zinc-400">
                  Gender *
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-sm text-zinc-300 transition-all font-semibold"
                >
                  <option value="MALE" className="bg-zinc-950 text-white">Male</option>
                  <option value="FEMALE" className="bg-zinc-950 text-white">Female</option>
                  <option value="OTHER" className="bg-zinc-950 text-white">Other</option>
                </select>
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label htmlFor="phone" className="text-xs font-semibold text-zinc-400">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type="tel"
                  id="phone"
                  placeholder="+1 (555) 0199"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple hover:from-brand-cyan-hover hover:to-brand-cyan text-white font-bold text-sm shadow-xl shadow-brand-cyan/15 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Login Referral */}
          <div className="mt-6 text-center text-xs text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-cyan font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Settings, User, Bell, ShieldAlert, KeyRound, Check } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    firstName: "Jane",
    lastName: "Doe",
    email: "patient@biolens.ai",
    dob: "1992-08-24",
    gender: "Female",
    phone: "+15550199",
  });
  
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load local details
    const firstName = localStorage.getItem("user_first_name") || "Jane";
    const lastName = localStorage.getItem("user_last_name") || "Doe";
    const email = localStorage.getItem("user_email") || "patient@biolens.ai";
    const phone = "+1 (555) 0199";
    const dob = "1992-08-24";
    const gender = localStorage.getItem("user_email")?.includes("admin") ? "Male" : "Female";

    setProfile({
      firstName,
      lastName,
      email,
      dob,
      gender,
      phone,
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16 max-w-4xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-white tracking-tight flex items-center gap-2">
          Profile Settings <Settings className="h-6 w-6 text-brand-cyan" />
        </h1>
        <p className="text-zinc-400 text-sm">
          Manage your patient account profile details and notification rules.
        </p>
      </div>

      {/* Grid Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left selector links */}
        <div className="md:col-span-1 glass rounded-2xl p-4 border border-white/5 shadow-xl space-y-1 self-start">
          <button className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-brand-cyan bg-brand-cyan/10 border-l-2 border-brand-cyan flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Personal Profile</span>
          </button>
          
          <button className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Alert Preferences</span>
          </button>

          <button className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span>Security & Keys</span>
          </button>
        </div>

        {/* Right main inputs */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile Form */}
          <form onSubmit={handleSave} className="glass rounded-3xl p-6 border border-white/5 shadow-xl space-y-6">
            <h3 className="font-outfit text-base font-bold text-white tracking-tight flex items-center gap-2 pb-3 border-b border-white/5">
              <span>Personal Demographics</span>
            </h3>

            {success && (
              <div className="p-3.5 rounded-xl bg-brand-success/10 border border-brand-success/20 text-brand-success text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>Account settings saved successfully.</span>
              </div>
            )}

            {/* Read-Only Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">First Name</span>
                <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm text-zinc-300 font-semibold select-all">
                  {profile.firstName}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Last Name</span>
                <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm text-zinc-300 font-semibold select-all">
                  {profile.lastName}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Email Address</span>
              <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm text-zinc-400 font-semibold select-all bg-zinc-900/35 border-dashed">
                {profile.email}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Date of Birth</span>
                <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm text-zinc-300 font-semibold">
                  {profile.dob}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Gender Orientation</span>
                <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm text-zinc-300 font-semibold">
                  {profile.gender}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Contact Phone</span>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-sm text-zinc-200 font-semibold transition-all"
              />
            </div>

            <div className="text-right">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple text-white font-bold text-xs shadow-lg shadow-brand-cyan/15 hover:shadow-brand-cyan/25 transition-all transform hover:-translate-y-0.5"
              >
                Save Profile Adjustments
              </button>
            </div>
          </form>

          {/* Alert Preferences */}
          <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl space-y-4">
            <h3 className="font-outfit text-base font-bold text-white tracking-tight pb-3 border-b border-white/5">
              Notification Rules
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-200">Critical Medical Alerts</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Trigger alerts immediately when parameters enter CRITICAL zones.</div>
                </div>
                <div className="h-5 w-9 rounded-full bg-brand-cyan flex items-center justify-end p-0.5 cursor-pointer">
                  <div className="h-4 w-4 bg-white rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div>
                  <div className="text-xs font-bold text-zinc-200">OCR Extraction Summaries</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Push alerts when the hybrid binarizer and Gemini finish parsing files.</div>
                </div>
                <div className="h-5 w-9 rounded-full bg-brand-cyan flex items-center justify-end p-0.5 cursor-pointer">
                  <div className="h-4 w-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass rounded-3xl p-6 border border-brand-danger/20 shadow-xl space-y-4">
            <h3 className="font-outfit text-base font-bold text-brand-danger tracking-tight flex items-center gap-2 pb-3 border-b border-white/5">
              <ShieldAlert className="h-5 w-5 text-brand-danger shrink-0" />
              <span>Danger Zone Settings</span>
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Deactivating your patient portfolio deactivates all historical report records, parameter indexes, risk assessments, and conversation consultations.
            </p>
            <div>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-brand-danger/10 hover:bg-brand-danger/20 border border-brand-danger/25 text-brand-danger font-bold text-xs transition-all cursor-pointer"
              >
                Deactivate Patient Portfolio
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

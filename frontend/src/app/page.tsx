"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Dna, 
  ArrowRight, 
  Brain, 
  Activity, 
  Shield, 
  Sparkles, 
  Database, 
  TrendingUp, 
  CheckCircle2, 
  Lock, 
  FileText,
  Upload,
  User,
  Heart,
  ChevronRight,
  Palette
} from "lucide-react";

// Themes Config Map for Different Peoples' preferences & accessibilities
const THEMES = {
  clinical: {
    name: "Scandinavian Standard",
    iconColor: "#18778C",
    bgClass: "bg-gradient-mesh",
    textClass: "text-[#4C7687]",
    headingClass: "text-[#0A3F59]",
    cardClass: "bg-white/75 border-[#DDEEEF] text-[#4C7687]",
    btnClass: "from-[#18778C] to-[#175B70] text-white hover:from-[#175B70] hover:to-[#18778C] shadow-[#18778C]/20",
    dna: [
      { left: "#E26D6D", right: "#7CBF94", shadowL: "rgba(226,109,109,0.35)", shadowR: "rgba(124,191,148,0.35)", name: "A-T" }, // Red & Light Green
      { left: "#E5B64E", right: "#8D715B", shadowL: "rgba(229,182,78,0.35)", shadowR: "rgba(141,113,91,0.35)", name: "C-G" },  // Yellow & Brown
      { left: "#7CBF94", right: "#E26D6D", shadowL: "rgba(124,191,148,0.35)", shadowR: "rgba(226,109,109,0.35)", name: "T-A" },
      { left: "#8D715B", right: "#E5B64E", shadowL: "rgba(141,113,91,0.35)", shadowR: "rgba(229,182,78,0.35)", name: "G-C" }
    ],
    badges: {
      NORMAL: "bg-[#7CBF94]/15 text-[#7CBF94] border-[#7CBF94]/25",
      LOW: "bg-[#E5B64E]/15 text-[#E5B64E] border-[#E5B64E]/25",
      HIGH: "bg-[#E26D6D]/15 text-[#E26D6D] border-[#E26D6D]/25",
      CRITICAL: "bg-[#8D715B]/15 text-[#8D715B] border-[#8D715B]/25 animate-pulse"
    },
    styles: {
      bg: "#E7F6F8",
      primary: "#18778C",
      border: "#DDEEEF",
      secondary: "#2F8CA1"
    }
  },
  dark: {
    name: "Nordic Midnight",
    iconColor: "#00F2FE",
    bgClass: "bg-[#0A1118]", // Premium dark midnight
    textClass: "text-[#8CA7B5]",
    headingClass: "text-[#E6F0F5]",
    cardClass: "bg-[#111C24]/85 border-[#1D2E3A] text-[#8CA7B5]",
    btnClass: "from-[#18778C] to-[#2F8CA1] text-white hover:from-[#2F8CA1] hover:to-[#18778C] shadow-[#00F2FE]/15",
    dna: [
      { left: "#00F2FE", right: "#FF007F", shadowL: "rgba(0,242,254,0.35)", shadowR: "rgba(255,0,127,0.35)", name: "A-T" }, // Cyan and Pink neon
      { left: "#7F00FF", right: "#FFCC00", shadowL: "rgba(127,0,255,0.35)", shadowR: "rgba(255,204,0,0.35)", name: "C-G" }, // Purple and Yellow neon
      { left: "#FF007F", right: "#00F2FE", shadowL: "rgba(255,0,127,0.35)", shadowR: "rgba(0,242,254,0.35)", name: "T-A" },
      { left: "#FFCC00", right: "#7F00FF", shadowL: "rgba(255,204,0,0.35)", shadowR: "rgba(127,0,255,0.35)", name: "G-C" }
    ],
    badges: {
      NORMAL: "bg-[#FF007F]/15 text-[#FF007F] border-[#FF007F]/25",
      LOW: "bg-[#FFCC00]/15 text-[#FFCC00] border-[#FFCC00]/25",
      HIGH: "bg-[#00F2FE]/15 text-[#00F2FE] border-[#00F2FE]/25",
      CRITICAL: "bg-[#7F00FF]/15 text-[#7F00FF] border-[#7F00FF]/25 animate-pulse"
    },
    styles: {
      bg: "#0A1118",
      primary: "#00F2FE",
      border: "#1D2E3A",
      secondary: "#18778C"
    }
  },
  colorblind: {
    name: "Red-Green Friendly",
    iconColor: "#2F8CD5",
    bgClass: "bg-gradient-mesh",
    textClass: "text-[#4C7687]",
    headingClass: "text-[#0A3F59]",
    cardClass: "bg-white/75 border-[#DDEEEF] text-[#4C7687]",
    btnClass: "from-[#2F8CD5] to-[#1E5B8C] text-white hover:from-[#1E5B8C] hover:to-[#2F8CD5] shadow-[#2F8CD5]/15",
    dna: [
      { left: "#2F8CD5", right: "#F59E0B", shadowL: "rgba(47,140,213,0.35)", shadowR: "rgba(245,158,11,0.35)", name: "A-T" }, // Blue & Yellow (Optimal for Red-Green)
      { left: "#1E3B70", right: "#FCD34D", shadowL: "rgba(30,59,112,0.35)", shadowR: "rgba(252,211,77,0.35)", name: "C-G" },  // Navy & Light Yellow
      { left: "#F59E0B", right: "#2F8CD5", shadowL: "rgba(245,158,11,0.35)", shadowR: "rgba(47,140,213,0.35)", name: "T-A" },
      { left: "#FCD34D", right: "#1E3B70", shadowL: "rgba(252,211,77,0.35)", shadowR: "rgba(30,59,112,0.35)", name: "G-C" }
    ],
    badges: {
      NORMAL: "bg-[#2F8CD5]/15 text-[#2F8CD5] border-[#2F8CD5]/25",
      LOW: "bg-[#FCD34D]/15 text-[#B45309] border-[#FCD34D]/35",
      HIGH: "bg-[#F59E0B]/15 text-[#B45309] border-[#F59E0B]/25",
      CRITICAL: "bg-[#1E3B70]/15 text-[#1E3B70] border-[#1E3B70]/25 animate-pulse"
    },
    styles: {
      bg: "#E7F6F8",
      primary: "#2F8CD5",
      border: "#DDEEEF",
      secondary: "#1E5B8C"
    }
  },
  tritanopia: {
    name: "Blue-Yellow Friendly",
    iconColor: "#EC4899",
    bgClass: "bg-gradient-mesh",
    textClass: "text-[#4C7687]",
    headingClass: "text-[#0A3F59]",
    cardClass: "bg-white/75 border-[#DDEEEF] text-[#4C7687]",
    btnClass: "from-[#EC4899] to-[#BE185D] text-white hover:from-[#BE185D] hover:to-[#EC4899] shadow-[#EC4899]/15",
    dna: [
      { left: "#EC4899", right: "#14B8A6", shadowL: "rgba(236,72,153,0.35)", shadowR: "rgba(20,184,166,0.35)", name: "A-T" }, // Pink & Teal (Optimal for Blue-Yellow)
      { left: "#9333EA", right: "#F43F5E", shadowL: "rgba(147,51,234,0.35)", shadowR: "rgba(244,63,94,0.35)", name: "C-G" },  // Purple & Red
      { left: "#14B8A6", right: "#EC4899", shadowL: "rgba(20,184,166,0.35)", shadowR: "rgba(236,72,153,0.35)", name: "T-A" },
      { left: "#F43F5E", right: "#9333EA", shadowL: "rgba(244,63,94,0.35)", shadowR: "rgba(147,51,234,0.35)", name: "G-C" }
    ],
    badges: {
      NORMAL: "bg-[#14B8A6]/15 text-[#14B8A6] border-[#14B8A6]/25",
      LOW: "bg-[#9333EA]/15 text-[#9333EA] border-[#9333EA]/25",
      HIGH: "bg-[#EC4899]/15 text-[#EC4899] border-[#EC4899]/25",
      CRITICAL: "bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/25 animate-pulse"
    },
    styles: {
      bg: "#E7F6F8",
      primary: "#EC4899",
      border: "#DDEEEF",
      secondary: "#14B8A6"
    }
  },
  contrast: {
    name: "High Contrast Lab",
    iconColor: "#000000",
    bgClass: "bg-[#FFFFFF]", // Stark white
    textClass: "text-[#000000] font-bold",
    headingClass: "text-[#000000] font-black",
    cardClass: "bg-white border-2 border-black text-black",
    btnClass: "from-[#000000] to-[#000000] text-white hover:bg-black/90 shadow-none border border-black",
    dna: [
      { left: "#000000", right: "#0000FF", shadowL: "rgba(0,0,0,0.1)", shadowR: "rgba(0,0,255,0.1)", name: "A-T" }, // Stark Black & Blue
      { left: "#0000FF", right: "#000000", shadowL: "rgba(0,0,255,0.1)", shadowR: "rgba(0,0,0,0.1)", name: "C-G" },
      { left: "#000000", right: "#0000FF", shadowL: "rgba(0,0,0,0.1)", shadowR: "rgba(0,0,255,0.1)", name: "T-A" },
      { left: "#0000FF", right: "#000000", shadowL: "rgba(0,0,255,0.1)", shadowR: "rgba(0,0,0,0.1)", name: "G-C" }
    ],
    badges: {
      NORMAL: "bg-white text-black border-2 border-black font-extrabold uppercase",
      LOW: "bg-white text-black border-2 border-black font-extrabold uppercase",
      HIGH: "bg-white text-black border-2 border-black font-extrabold uppercase",
      CRITICAL: "bg-black text-white border-2 border-black font-extrabold uppercase"
    },
    styles: {
      bg: "#FFFFFF",
      primary: "#000000",
      border: "#000000",
      secondary: "#333333"
    }
  }
};

// DNA Helix Visualizer Component (Receives themed colors)
interface DNAHelixProps {
  dnaColors: Array<{ left: string; right: string; shadowL: string; shadowR: string; name: string }>;
  themeKey: string;
}

function DNAHelix({ dnaColors, themeKey }: DNAHelixProps) {
  return (
    <div className={`relative w-full h-[450px] flex items-center justify-center overflow-hidden backdrop-blur-md rounded-3xl border shadow-sm p-8 transition-all duration-500 ${
      themeKey === "dark" 
        ? "bg-[#111C24]/40 border-[#1D2E3A]" 
        : themeKey === "contrast"
        ? "bg-white border-2 border-black"
        : "bg-white/40 border-[#DDEEEF]"
    }`}>
      {/* Decorative background grids */}
      <div className={`absolute inset-0 pointer-events-none ${
        themeKey === "dark" 
          ? "bg-[radial-gradient(rgba(0,242,254,0.04)_1.5px,transparent_1.5px)]" 
          : themeKey === "contrast"
          ? ""
          : "bg-[radial-gradient(rgba(24,119,140,0.06)_1.5px,transparent_1.5px)]"
      } [background-size:24px_24px]`} />
      
      {/* Bio Lab Radar rings */}
      <div className={`absolute h-80 w-80 rounded-full border animate-pulse ${
        themeKey === "dark" 
          ? "border-[#00F2FE]/5" 
          : themeKey === "contrast"
          ? "border-black/5"
          : "border-[#18778C]/5"
      }`} />
      <div className={`absolute h-96 w-96 rounded-full border animate-pulse ${
        themeKey === "dark" 
          ? "border-[#00F2FE]/10" 
          : themeKey === "contrast"
          ? "border-black/10"
          : "border-[#18778C]/10"
      }`} style={{ animationDelay: "1s" }} />

      <div className="flex flex-col justify-between h-full py-4 pb-12 relative z-10">
        {[...Array(14)].map((_, i) => {
          const delay = i * -0.25; // negative offset for pre-spun helix
          const colors = dnaColors[i % dnaColors.length];
          return (
            <div key={i} className="relative w-72 h-5 flex items-center justify-center">
              {/* Connector line with custom gradient */}
              <div 
                className="absolute w-40 h-[1.5px] animate-scale-bar" 
                style={{ 
                  animationDelay: `${delay}s`,
                  backgroundImage: `linear-gradient(90deg, ${colors.left}15, ${colors.left}35, ${colors.right}35, ${colors.right}15)`
                }} 
              />
              
              {/* Left Bead */}
              <div 
                className="absolute w-3 h-3 rounded-full animate-orbit-left" 
                style={{ 
                  animationDelay: `${delay}s`,
                  backgroundColor: colors.left,
                  boxShadow: themeKey === "contrast" ? "none" : `0 0 12px ${colors.shadowL}`
                }} 
              />
              
              {/* Center connecting point */}
              <div className={`absolute w-1 h-1 rounded-full z-10 ${
                themeKey === "dark" 
                  ? "bg-[#00F2FE]/20" 
                  : themeKey === "contrast"
                  ? "bg-black/20"
                  : "bg-[#2F8CA1]/20"
              }`} />
              
              {/* Right Bead */}
              <div 
                className="absolute w-3 h-3 rounded-full animate-orbit-right" 
                style={{ 
                  animationDelay: `${delay}s`,
                  backgroundColor: colors.right,
                  boxShadow: themeKey === "contrast" ? "none" : `0 0 12px ${colors.shadowR}`
                }} 
              />
            </div>
          );
        })}
      </div>

      {/* DNA Nucleotide Legend */}
      <div className={`absolute bottom-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[9px] font-bold px-4 py-2 rounded-full border shadow-sm transition-all ${
        themeKey === "dark" 
          ? "bg-[#111C24] border-[#1D2E3A] text-[#8CA7B5]" 
          : themeKey === "contrast"
          ? "bg-white border-2 border-black text-black"
          : "bg-white/70 border-[#DDEEEF] text-[#4C7687]"
      }`}>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#E26D6D]" style={{ backgroundColor: dnaColors[0].left }} /> Adenine</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#7CBF94]" style={{ backgroundColor: dnaColors[0].right }} /> Thymine</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#E5B64E]" style={{ backgroundColor: dnaColors[1].left }} /> Cytosine</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#8D715B]" style={{ backgroundColor: dnaColors[1].right }} /> Guanine</span>
      </div>
    </div>
  );
}

// Sandbox Blood Test Mock Data
const MOCK_PANELS = {
  lipid: {
    title: "Lipid & Cardiovascular Panel",
    tag: "Cardiovascular Risk",
    healthScore: 82,
    grade: "GOOD",
    scoreColor: "#2F8CA1",
    aiSummary: "The laboratory diagnostics extraction reveals a mostly balanced profile with a mild elevation in LDL Cholesterol. Your Hemoglobin and WBC parameters are within clinical optimal standards, but active dietary control is recommended to bring triglycerides into normal limits.",
    parameters: [
      { name: "LDL CHOLESTEROL", value: 148, unit: "mg/dL", range: "0 - 130", status: "HIGH" },
      { name: "HDL CHOLESTEROL", value: 41, unit: "mg/dL", range: "40 - 60", status: "NORMAL" },
      { name: "TRIGLYCERIDES", value: 165, unit: "mg/dL", range: "0 - 150", status: "HIGH" },
      { name: "HEMOGLOBIN", value: 14.5, unit: "g/dL", range: "12.0 - 16.0", status: "NORMAL" },
    ],
    trend: {
      parameter: "LDL Cholesterol",
      unit: "mg/dL",
      points: [
        { date: "Oct 2025", value: 162 },
        { date: "Jan 2026", value: 155 },
        { date: "May 2026", value: 148 }
      ]
    }
  },
  thyroid: {
    title: "Comprehensive Endocrine Thyroid Test",
    tag: "Metabolic Activity",
    healthScore: 68,
    grade: "MODERATE",
    scoreColor: "#E29543",
    aiSummary: "Extracted diagnostics demonstrate a metabolic trend aligned with subclinical thyroid underactivity. A high TSH accompanied by borderline low thyroid hormone (T3 & T4) parameters suggest mild clinical hypothyroid conditions. Iron parameters also warrant review.",
    parameters: [
      { name: "TSH (THYROID STIMULATING HORMONE)", value: 5.8, unit: "uIU/mL", range: "0.4 - 4.0", status: "HIGH" },
      { name: "T3 (TOTAL TRIIODOTHYRONINE)", value: 0.75, unit: "ng/mL", range: "0.8 - 2.0", status: "LOW" },
      { name: "T4 (FREE THYROXINE)", value: 0.85, unit: "ng/dL", range: "0.9 - 1.7", status: "LOW" },
      { name: "HEMOGLOBIN", value: 11.4, unit: "g/dL", range: "12.0 - 16.0", status: "LOW" },
    ],
    trend: {
      parameter: "TSH Hormone",
      unit: "uIU/mL",
      points: [
        { date: "Oct 2025", value: 4.1 },
        { date: "Jan 2026", value: 4.9 },
        { date: "May 2026", value: 5.8 }
      ]
    }
  },
  diabetes: {
    title: "Glycemic & Metabolic Glucose Screen",
    tag: "Diabetic Monitoring",
    healthScore: 56,
    grade: "POOR",
    scoreColor: "#DC5B5B",
    aiSummary: "The diagnostic report indicates a marked elevation in long-term blood glucose parameters, with HbA1c at 6.9% representing diabetic threshold limits. This matches a fasting Blood Sugar of 142 mg/dL. Prompt clinical assessment, dietary carb supervision, and GP consulting is advised.",
    parameters: [
      { name: "HBA1C (GLYCATED HEMOGLOBIN)", value: 6.9, unit: "%", range: "4.0 - 5.6", status: "HIGH" },
      { name: "BLOOD SUGAR (FASTING)", value: 142, unit: "mg/dL", range: "70 - 100", status: "CRITICAL" },
      { name: "PLATELETS", value: 245, unit: "k/uL", range: "150 - 450", status: "NORMAL" },
      { name: "HEMOGLOBIN", value: 13.8, unit: "g/dL", range: "12.0 - 16.0", status: "NORMAL" },
    ],
    trend: {
      parameter: "HbA1c Glucose",
      unit: "%",
      points: [
        { date: "Oct 2025", value: 5.8 },
        { date: "Jan 2026", value: 6.3 },
        { date: "May 2026", value: 6.9 }
      ]
    }
  }
};

export default function LandingPage() {
  const themeKey = "dark";
  const [activePanelKey, setActivePanelKey] = useState<keyof typeof MOCK_PANELS>("lipid");
  
  const theme = THEMES[themeKey];
  const currentPanel = MOCK_PANELS[activePanelKey];

  return (
    <div 
      className={`min-h-screen font-sans overflow-x-hidden relative flex flex-col justify-between selection:bg-[#ABCFD6] selection:text-[#0A3F59] transition-all duration-500 ${theme.bgClass}`}
      style={{ 
        backgroundColor: themeKey === "contrast" ? "#FFFFFF" : themeKey === "dark" ? "#0A1118" : "#E7F6F8"
      }}
    >
      {/* Decorative background glowing spheres (hide on stark contrast) */}
      {themeKey !== "contrast" && (
        <>
          <div className="absolute top-[15%] left-[5%] h-[300px] w-[300px] rounded-full bg-[#ABCFD6]/20 blur-[100px] pointer-events-none" />
          <div className="absolute top-[60%] right-[5%] h-[400px] w-[400px] rounded-full bg-[#2F8CA1]/10 blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Header / Navbar */}
      <header className={`w-full px-6 lg:px-16 py-6 flex items-center justify-between border-b relative z-10 transition-all duration-500 ${theme.cardClass} backdrop-blur-md`}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-md ${
            themeKey === "contrast" ? "bg-black text-white" : "bg-[#18778C]"
          }`}>
            <Dna className="h-6 w-6 text-white animate-pulse" />
          </div>
          <span className={`font-outfit text-2xl font-bold tracking-tight transition-all duration-300 ${
            themeKey === "dark" ? "text-white" : themeKey === "contrast" ? "text-black" : "text-[#0A3F59]"
          }`}>
            BioLens<span className={themeKey === "contrast" ? "text-black underline" : "text-[#18778C]"}>.AI</span>
          </span>
        </Link>
        
        {/* Navigation Middle */}
        <nav className="hidden xl:flex items-center gap-8">
          <a href="#features" className={`text-sm font-semibold transition-all ${
            themeKey === "dark" ? "text-[#8CA7B5] hover:text-white" : themeKey === "contrast" ? "text-black hover:underline" : "text-[#4C7687] hover:text-[#18778C]"
          }`}>Features</a>
          <a href="#sandbox" className={`text-sm font-semibold transition-all ${
            themeKey === "dark" ? "text-[#8CA7B5] hover:text-white" : themeKey === "contrast" ? "text-black hover:underline" : "text-[#4C7687] hover:text-[#18778C]"
          }`}>Interactive Demo</a>
          <a href="#pricing" className={`text-sm font-semibold transition-all ${
            themeKey === "dark" ? "text-[#8CA7B5] hover:text-white" : themeKey === "contrast" ? "text-black hover:underline" : "text-[#4C7687] hover:text-[#18778C]"
          }`}>Pricing</a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className={`px-4 py-2 text-sm font-bold transition-all ${
                themeKey === "dark" ? "text-[#8CA7B5] hover:text-white" : themeKey === "contrast" ? "text-black hover:underline font-extrabold" : "text-[#18778C] hover:text-[#175B70]"
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className={`px-5 py-2 rounded-full text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 bg-gradient-to-r ${theme.btnClass}`}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main SaaS Body Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-12 py-16 relative z-10 flex flex-col justify-start">


        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center py-8 lg:py-16 mb-24">
          
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse-glow ${
              themeKey === "contrast" ? "bg-white border-2 border-black text-black" : "bg-white border-[#DDEEEF] text-[#18778C]"
            }`}>
              <Sparkles className="h-4 w-4" style={{ color: theme.styles.primary }} />
              <span>BioLens AI Clinical Diagnostics Portal</span>
            </div>
            
            <h1 className={`text-5xl lg:text-7xl font-extrabold tracking-tight font-outfit leading-[1.08] transition-all duration-300 ${theme.headingClass}`}>
              Advanced Medical <br />
              <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
                themeKey === "contrast" ? "text-black underline" : `from-[${theme.styles.primary}] via-[${theme.styles.secondary}] to-[#175B70]`
              }`} style={{ backgroundImage: themeKey === "contrast" ? "none" : `linear-gradient(90deg, ${theme.styles.primary}, ${theme.styles.secondary}, #175B70)` }}>
                Intelligence Engine.
              </span>
            </h1>
            
            <p className={`text-lg lg:text-xl max-w-xl leading-relaxed font-light transition-all duration-300 ${theme.textClass}`}>
              Transform raw laboratory reports and genetic profiles into beautiful structured diagnostics summaries, chronological health index trend lines, and clinic-ready RAG-grounded insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/register"
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r font-bold text-base shadow-lg transition-all transform hover:-translate-y-0.5 group ${theme.btnClass}`}
              >
                <span>Upload Report Instantly</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-all" />
              </Link>
              
              <a
                href="#sandbox"
                className={`flex items-center justify-center px-8 py-4 rounded-full border font-bold text-base shadow-sm transition-all transform hover:-translate-y-0.5 ${
                  themeKey === "dark" 
                    ? "bg-[#111C24] border-[#1D2E3A] text-white hover:bg-[#1D2E3A]" 
                    : themeKey === "contrast"
                    ? "bg-white border-2 border-black text-black hover:underline"
                    : "bg-white border-[#DDEEEF] text-[#18778C] hover:text-[#175B70] hover:bg-[#F2FAFB]"
                }`}
              >
                Explore Live Demo
              </a>
            </div>

            <div className={`grid grid-cols-3 gap-6 pt-8 border-t max-w-lg transition-all duration-500 ${
              themeKey === "dark" ? "border-[#1D2E3A]" : themeKey === "contrast" ? "border-2 border-black p-4 bg-white" : "border-[#DDEEEF]"
            }`}>
              <div>
                <h4 className={`text-2xl font-bold font-outfit transition-all duration-300 ${theme.headingClass}`}>15MB</h4>
                <p className={`text-xs ${theme.textClass}`}>Max File Cap</p>
              </div>
              <div className={`px-4 ${
                themeKey === "dark" ? "border-[#1D2E3A] border-x" : themeKey === "contrast" ? "border-black border-x-2" : "border-[#DDEEEF] border-x"
              }`}>
                <h4 className={`text-2xl font-bold font-outfit transition-all duration-300 ${theme.headingClass}`}>99.4%</h4>
                <p className={`text-xs ${theme.textClass}`}>OCR Precision</p>
              </div>
              <div>
                <h4 className={`text-2xl font-bold font-outfit transition-all duration-300 ${theme.headingClass}`}>6 Focus</h4>
                <p className={`text-xs ${theme.textClass}`}>ML Risk Models</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center">
            <DNAHelix dnaColors={theme.dna} themeKey={themeKey} />
          </div>
        </section>

        {/* Clinical Innovation Features Grid */}
        <section id="features" className={`py-12 mb-28 border-t pt-20 transition-all duration-500 ${
          themeKey === "dark" ? "border-[#1D2E3A]" : themeKey === "contrast" ? "border-t-2 border-black" : "border-[#DDEEEF]"
        }`}>
          <div className="text-center space-y-4 mb-16">
            <span className={`font-extrabold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border ${
              themeKey === "dark" 
                ? "bg-[#00F2FE]/10 text-[#00F2FE] border-[#00F2FE]/10" 
                : themeKey === "contrast"
                ? "bg-white text-black border-2 border-black"
                : "bg-[#18778C]/10 text-[#18778C] border-[#18778C]/10"
            }`}>
              Technology Stack Overview
            </span>
            <h2 className={`text-3xl lg:text-5xl font-bold font-outfit transition-all duration-300 ${theme.headingClass}`}>
              Clean Scandinavian Laboratory Engineering
            </h2>
            <p className={`max-w-2xl mx-auto font-light text-base lg:text-lg transition-all duration-300 ${theme.textClass}`}>
              Precision-tuned AI algorithms meet high-legibility interface design to streamline personal and professional medical report analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`rounded-3xl p-8 transition-all duration-300 hover:shadow-lg group text-left relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${theme.cardClass}`}>
              <div>
                <div className="absolute top-0 right-0 h-24 w-24 bg-[#18778C]/5 rounded-bl-full pointer-events-none" />
                <div 
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-all animate-pulse-glow"
                  style={{ 
                    backgroundColor: themeKey === "contrast" ? "#FFFFFF" : `${theme.styles.primary}20`,
                    color: theme.styles.primary,
                    border: themeKey === "contrast" ? "2px solid black" : "none"
                  }}
                >
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className={`text-xl font-bold font-outfit mb-3 transition-all duration-300 ${theme.headingClass}`}>Dual-Engine OCR Ingestion</h3>
                <p className={`text-sm leading-relaxed font-light mb-6 transition-all duration-300 ${theme.textClass}`}>
                  Leverages dynamic OpenCV pre-processing, adaptive thresholds, and combined Tesseract + EasyOCR voting logic to ingest medical records with absolute numeric precision.
                </p>
              </div>
              <div className={`overflow-hidden rounded-2xl border shadow-sm ${
                themeKey === "contrast" ? "border-2 border-black" : "border-white/5"
              }`}>
                <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80" alt="Report scanning illustration" className="w-full h-40 object-cover transform group-hover:scale-105 transition-all duration-500" />
              </div>
            </div>

            <div className={`rounded-3xl p-8 transition-all duration-300 hover:shadow-lg group text-left relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${theme.cardClass}`}>
              <div>
                <div className="absolute top-0 right-0 h-24 w-24 bg-[#2F8CA1]/5 rounded-bl-full pointer-events-none" />
                <div 
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-all animate-pulse-glow"
                  style={{ 
                    backgroundColor: themeKey === "contrast" ? "#FFFFFF" : `${theme.styles.primary}20`,
                    color: theme.styles.primary,
                    border: themeKey === "contrast" ? "2px solid black" : "none"
                  }}
                >
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className={`text-xl font-bold font-outfit mb-3 transition-all duration-300 ${theme.headingClass}`}>Chronological Biomarker Trends</h3>
                <p className={`text-sm leading-relaxed font-light mb-6 transition-all duration-300 ${theme.textClass}`}>
                  Instantly tracks blood panels across years. Generates elegant, clinical-grade time-series visualizations to map the long-term effectiveness of patient health improvements.
                </p>
              </div>
              <div className={`overflow-hidden rounded-2xl border shadow-sm ${
                themeKey === "contrast" ? "border-2 border-black" : "border-white/5"
              }`}>
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" alt="Medical analytics trends" className="w-full h-40 object-cover transform group-hover:scale-105 transition-all duration-500" />
              </div>
            </div>

            <div className={`rounded-3xl p-8 transition-all duration-300 hover:shadow-lg group text-left relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${theme.cardClass}`}>
              <div>
                <div className="absolute top-0 right-0 h-24 w-24 bg-[#175B70]/5 rounded-bl-full pointer-events-none" />
                <div 
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-all animate-pulse-glow"
                  style={{ 
                    backgroundColor: themeKey === "contrast" ? "#FFFFFF" : `${theme.styles.primary}20`,
                    color: theme.styles.primary,
                    border: themeKey === "contrast" ? "2px solid black" : "none"
                  }}
                >
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className={`text-xl font-bold font-outfit mb-3 transition-all duration-300 ${theme.headingClass}`}>Predictive ML Risk Assessment</h3>
                <p className={`text-sm leading-relaxed font-light mb-6 transition-all duration-300 ${theme.textClass}`}>
                  Processes extracted key biomarkers through Scikit-Learn classifiers to predict conditions like diabetes, thyroid dysfunctions, heart diseases, anemia, and liver changes.
                </p>
              </div>
              <div className={`overflow-hidden rounded-2xl border shadow-sm ${
                themeKey === "contrast" ? "border-2 border-black" : "border-white/5"
              }`}>
                <img src="https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=600&q=80" alt="Biomarker risk modeling" className="w-full h-40 object-cover transform group-hover:scale-105 transition-all duration-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Product Showcase Section */}
        <section id="showcase" className={`py-12 mb-28 border-t pt-20 transition-all duration-500 ${
          themeKey === "dark" ? "border-[#1D2E3A]" : themeKey === "contrast" ? "border-t-2 border-black" : "border-[#DDEEEF]"
        }`}>
          <div className="text-center space-y-4 mb-16">
            <span className={`font-extrabold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border ${
              themeKey === "dark" 
                ? "bg-[#00F2FE]/10 text-[#00F2FE] border-[#00F2FE]/10" 
                : themeKey === "contrast"
                ? "bg-white text-black border-2 border-black font-extrabold"
                : "bg-[#18778C]/10 text-[#18778C] border-[#18778C]/10"
            }`}>
              Premium Interface Preview
            </span>
            <h2 className={`text-3xl lg:text-5xl font-bold font-outfit transition-all duration-300 ${theme.headingClass}`}>
              Clinical Workspace & AI Consultation
            </h2>
            <p className={`max-w-2xl mx-auto font-light text-base lg:text-lg transition-all duration-300 ${theme.textClass}`}>
              Explore our dual patient workspace environments: detailed chronological trends dashboards and high-legibility RAG diagnostic health assistant chats.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            {/* Dashboard Workspace Preview */}
            <div className="flex flex-col items-center text-center">
              <div className={`relative group overflow-hidden rounded-3xl border shadow-2xl transition-all duration-500 hover:scale-[1.015] ${
                themeKey === "contrast" ? "border-4 border-black" : "border-white/5"
              }`}>
                <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80" alt="Clinical Ingestion Dashboard" className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 text-left">
                  <h4 className="text-lg font-bold text-white">Dynamic Patient Workspace</h4>
                  <p className="text-xs text-zinc-300">Comprehensive view of parsed biological parameters, color-coded health gauges, and risk factors.</p>
                </div>
              </div>
              <span className={`mt-4 text-sm font-extrabold font-outfit uppercase tracking-wider ${themeKey === "contrast" ? "text-black underline font-black" : theme.headingClass}`}>
                Patient Overview Dashboard
              </span>
            </div>

            {/* AI Assistant Chat Preview */}
            <div className="flex flex-col items-center text-center">
              <div className={`relative group overflow-hidden rounded-3xl border shadow-2xl transition-all duration-500 hover:scale-[1.015] ${
                themeKey === "contrast" ? "border-4 border-black" : "border-white/5"
              }`}>
                <img src="https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=800&q=80" alt="AI RAG Health Assistant" className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 text-left">
                  <h4 className="text-lg font-bold text-white">RAG AI Health Advisor</h4>
                  <p className="text-xs text-zinc-300">Converse directly with Gemini RAG AI, fully grounded by your parsed blood report parameters with complete medical disclaimers.</p>
                </div>
              </div>
              <span className={`mt-4 text-sm font-extrabold font-outfit uppercase tracking-wider ${themeKey === "contrast" ? "text-black underline font-black" : theme.headingClass}`}>
                RAG AI Health Chat Assistant
              </span>
            </div>
          </div>
        </section>

        {/* Interactive Biotech Sandbox Demo */}
        <section id="sandbox" className={`py-16 mb-28 border-t pt-20 transition-all duration-500 ${
          themeKey === "dark" ? "border-[#1D2E3A]" : themeKey === "contrast" ? "border-t-2 border-black" : "border-[#DDEEEF]"
        }`}>
          
          <div className="text-center space-y-4 mb-16">
            <span className={`font-extrabold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border ${
              themeKey === "dark" 
                ? "bg-[#00F2FE]/10 text-[#00F2FE] border-[#00F2FE]/10" 
                : themeKey === "contrast"
                ? "bg-white text-black border-2 border-black font-extrabold"
                : "bg-[#18778C]/10 text-[#18778C] border-[#18778C]/10"
            }`}>
              BioLens Sandbox Live Simulator
            </span>
            <h2 className={`text-3xl lg:text-5xl font-bold font-outfit transition-all duration-300 ${theme.headingClass}`}>
              Explore the Clinical Dashboard
            </h2>
            <p className={`max-w-2xl mx-auto font-light text-base lg:text-lg transition-all duration-300 ${theme.textClass}`}>
              Click a laboratory report category below to witness our structured data extraction, circular health score gauges, and AI clinical summaries update instantly.
            </p>
          </div>

          {/* Sandbox Controls */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {Object.entries(MOCK_PANELS).map(([key, data]) => {
              const isActive = activePanelKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setActivePanelKey(key as keyof typeof MOCK_PANELS)}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform active:scale-95 shadow-sm border ${
                    isActive
                      ? `bg-gradient-to-r ${theme.btnClass} border-transparent shadow-md`
                      : themeKey === "dark"
                      ? "bg-[#111C24] text-[#8CA7B5] border-[#1D2E3A] hover:bg-[#1D2E3A]"
                      : themeKey === "contrast"
                      ? "bg-white text-black border-2 border-black hover:underline font-extrabold"
                      : "bg-white text-[#18778C] border-[#DDEEEF] hover:bg-[#F2FAFB]"
                  }`}
                >
                  {data.title}
                </button>
              );
            })}
          </div>

          {/* Sandbox Ingestion Workspace */}
          <div className={`rounded-3xl border shadow-lg overflow-hidden p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative transition-all duration-500 ${theme.cardClass}`}>
            
            {/* Top Workspace Bar */}
            <div className={`col-span-12 flex flex-wrap items-center justify-between pb-6 border-b gap-4 ${
              themeKey === "dark" ? "border-[#1D2E3A]" : themeKey === "contrast" ? "border-b-2 border-black" : "border-[#DDEEEF]"
            }`}>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#10B981] animate-pulse-dot" />
                <span className={`text-xs font-bold tracking-wider uppercase ${
                  themeKey === "dark" ? "text-white" : themeKey === "contrast" ? "text-black" : "text-[#0A3F59]"
                }`}>Sandbox Ingestion Status: ACTIVE</span>
              </div>
              <span className={`text-xs font-medium px-3.5 py-1.5 rounded-full border ${
                themeKey === "dark" 
                  ? "bg-[#111C24] text-[#8CA7B5] border-[#1D2E3A]" 
                  : themeKey === "contrast"
                  ? "bg-white text-black border-2 border-black"
                  : "bg-[#E7F6F8] text-[#18778C] border-[#DDEEEF]"
              }`}>
                Extracted: <strong>{currentPanel.parameters.length} Key Parameters</strong> • Patient: Female (36)
              </span>
            </div>

            {/* Left Column: Health Gauge & Trends Visualizer */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6">
              
              {/* Circular Health Gauge Box */}
              <div className={`border rounded-2xl p-6 text-center flex flex-col items-center justify-center relative shadow-inner ${
                themeKey === "dark" ? "bg-[#111C24]/40 border-[#1D2E3A]" : themeKey === "contrast" ? "bg-white border-2 border-black" : "bg-[#E7F6F8]/40 border-[#DDEEEF]"
              }`}>
                <span className={`text-xs font-bold uppercase tracking-wider mb-4 block ${theme.textClass}`}>Calculated Health Score</span>
                
                {/* SVG circular gauge */}
                <div className="relative h-40 w-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="65" 
                      className={themeKey === "dark" ? "stroke-[#1D2E3A]" : themeKey === "contrast" ? "stroke-black" : "stroke-[#DDEEEF]"} 
                      strokeWidth="10" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="65" 
                      stroke={themeKey === "contrast" ? "#000000" : currentPanel.scoreColor}
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 65}
                      strokeDashoffset={2 * Math.PI * 65 * (1 - currentPanel.healthScore / 100)}
                      className="transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-extrabold font-outfit`} style={{ color: themeKey === "contrast" ? "#000000" : currentPanel.scoreColor }}>
                      {currentPanel.healthScore}
                    </span>
                    <span className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${theme.textClass}`}>
                      {currentPanel.grade}
                    </span>
                  </div>
                </div>
                
                <p className={`text-xs mt-4 max-w-[220px] ${theme.textClass}`}>
                  Weighted clinical evaluation based on dynamic lab bounds.
                </p>
              </div>

              {/* Dynamic Trend Mini Sparkline */}
              <div className={`border rounded-2xl p-6 flex flex-col justify-between ${
                themeKey === "dark" ? "bg-[#111C24]/40 border-[#1D2E3A]" : themeKey === "contrast" ? "bg-white border-2 border-black" : "bg-[#E7F6F8]/40 border-[#DDEEEF]"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold uppercase tracking-wider ${theme.textClass}`}>Chronological Biotech Trend</span>
                  <div className={`flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded ${
                    themeKey === "contrast" ? "bg-black text-white" : "bg-[#10B981]/10 text-[#10B981]"
                  }`}>
                    <TrendingUp className="h-3 w-3" />
                    <span>Improving</span>
                  </div>
                </div>
                
                <h4 className={`text-sm font-bold font-outfit ${theme.headingClass}`}>{currentPanel.trend.parameter} Profile</h4>
                
                {/* Horizontal simple step chart mock */}
                <div className="flex justify-between items-end h-20 pt-4 px-2 relative">
                  {/* Connection guide line */}
                  <div className={`absolute left-[15%] right-[15%] bottom-[40%] h-[1.5px] border-dashed border-t pointer-events-none ${
                    themeKey === "dark" ? "border-[#1D2E3A]" : themeKey === "contrast" ? "border-black border-2" : "border-[#ABCFD6]"
                  }`} />
                  
                  {currentPanel.trend.points.map((pt, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                      <span className={`text-[10px] font-bold`} style={{ color: theme.styles.primary }}>{pt.value} {currentPanel.trend.unit}</span>
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center" style={{ backgroundColor: theme.styles.primary }} />
                      <span className={`text-[9px] ${theme.textClass}`}>{pt.date}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Ingested Parameters & AI Summary */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              
              {/* Parameters Table Card */}
              <div className={`border rounded-2xl overflow-hidden shadow-sm flex-1 ${
                themeKey === "dark" ? "bg-[#0A1118]/60 border-[#1D2E3A]" : themeKey === "contrast" ? "bg-white border-2 border-black text-black" : "bg-white border-[#DDEEEF]"
              }`}>
                <div className={`px-5 py-3.5 border-b flex justify-between items-center ${
                  themeKey === "dark" ? "bg-[#111C24]/40 border-[#1D2E3A]" : themeKey === "contrast" ? "bg-black text-white" : "bg-[#E7F6F8]/30 border-[#DDEEEF]"
                }`}>
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    themeKey === "contrast" ? "text-white" : theme.headingClass
                  }`}>
                    <FileText className="h-4 w-4" style={{ color: themeKey === "contrast" ? "#FFFFFF" : theme.styles.primary }} />
                    Parsed Biological Parameters
                  </span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                    themeKey === "dark" 
                      ? "bg-[#00F2FE]/10 text-[#00F2FE] border-[#00F2FE]/20" 
                      : themeKey === "contrast"
                      ? "bg-white text-black border-white"
                      : "bg-[#18778C]/10 text-[#18778C] border-[#18778C]/15"
                  }`}>
                    {currentPanel.tag}
                  </span>
                </div>
                
                <div className={`divide-y ${themeKey === "dark" ? "divide-[#1D2E3A]" : themeKey === "contrast" ? "divide-black border-black" : "divide-[#DDEEEF]"}`}>
                  {currentPanel.parameters.map((param, index) => (
                    <div key={index} className={`px-5 py-3.5 flex items-center justify-between transition-all ${
                      themeKey === "dark" ? "hover:bg-[#111C24]/60" : themeKey === "contrast" ? "hover:bg-black/5" : "hover:bg-[#F2FAFB]/60"
                    }`}>
                      <div className="space-y-0.5 text-left">
                        <div className={`text-xs font-bold tracking-tight ${themeKey === "contrast" ? "text-black" : theme.headingClass}`}>{param.name}</div>
                        <div className={`text-[10px] ${theme.textClass}`}>Reference Standard: {param.range} {param.unit}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-extrabold font-outfit ${themeKey === "contrast" ? "text-black" : theme.headingClass}`}>
                          {param.value} <span className={`text-[10px] font-normal ${theme.textClass}`}>{param.unit}</span>
                        </span>
                        
                        <span className={`text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wide uppercase ${
                          theme.badges[param.status as keyof typeof theme.badges]
                        }`}>
                          {param.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RAG AI Diagnostic Summary */}
              <div className={`border rounded-2xl p-5 text-left relative overflow-hidden ${
                themeKey === "dark" 
                  ? "bg-[#111C24]/20 border-[#1D2E3A]" 
                  : themeKey === "contrast"
                  ? "bg-white border-2 border-black"
                  : "bg-[#18778C]/5 border-[#18778C]/20"
              }`}>
                <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: theme.styles.primary }} />
                
                <div className={`flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wider ${
                  themeKey === "contrast" ? "text-black" : theme.headingClass
                }`}>
                  <Brain className="h-4 w-4" style={{ color: theme.styles.primary }} />
                  <span>Clinical RAG-Grounded AI Analysis</span>
                </div>
                
                <p className={`text-xs leading-relaxed font-light ${theme.textClass}`}>
                  {currentPanel.aiSummary}
                </p>
                
                <div className={`mt-3.5 pt-3 border-t flex items-center justify-between ${
                  themeKey === "dark" ? "border-[#1D2E3A]" : themeKey === "contrast" ? "border-black border-t-2" : "border-[#18778C]/10"
                }`}>
                  <span className={`text-[9px] italic flex items-center gap-1 ${theme.textClass}`}>
                    <Heart className="h-3 w-3" />
                    AI Explanations strictly reference parsed lab thresholds.
                  </span>
                  <Link href="/register" className={`text-[10px] font-bold hover:underline flex items-center gap-0.5`} style={{ color: theme.styles.primary }}>
                    Test own report
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

            </div>

          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/register"
              className={`flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base shadow-md transition-all transform hover:-translate-y-0.5 bg-gradient-to-r ${theme.btnClass}`}
            >
              <Upload className="h-5 w-5" />
              <span>Unlock Full Clinical Capabilities (Upload PDF)</span>
            </Link>
          </div>
        </section>

        {/* Pricing Architecture */}
        <section id="pricing" className={`py-12 mb-24 border-t pt-20 transition-all duration-500 ${
          themeKey === "dark" ? "border-[#1D2E3A]" : themeKey === "contrast" ? "border-t-2 border-black" : "border-[#DDEEEF]"
        }`}>
          <div className="text-center space-y-4 mb-16">
            <span className={`font-extrabold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border ${
              themeKey === "dark" 
                ? "bg-[#00F2FE]/10 text-[#00F2FE] border-[#00F2FE]/10" 
                : themeKey === "contrast"
                ? "bg-white text-black border-2 border-black font-extrabold"
                : "bg-[#18778C]/10 text-[#18778C] border-[#18778C]/10"
            }`}>
              Platform Tiers
            </span>
            <h2 className={`text-3xl lg:text-5xl font-bold font-outfit transition-all duration-300 ${theme.headingClass}`}>
              Flexible Subscription Plans
            </h2>
            <p className={`max-w-2xl mx-auto font-light text-base lg:text-lg transition-all duration-300 ${theme.textClass}`}>
              Empowering individual patients, active families, and high-performance clinical research groups with state-of-the-art diagnostics tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Free Tier */}
            <div className={`rounded-3xl p-8 flex flex-col justify-between text-left transition-all duration-300 hover:shadow-md border ${theme.cardClass}`}>
              <div className="space-y-6">
                <div>
                  <h4 className={`font-outfit text-xl font-bold transition-all duration-300 ${theme.headingClass}`}>Basic Patient</h4>
                  <p className={`text-xs font-light ${theme.textClass}`}>Ideal for baseline personal blood report trackings</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold font-outfit transition-all duration-300 ${theme.headingClass}`}>$0</span>
                  <span className={`text-xs ${theme.textClass}`}>/ forever free</span>
                </div>
                
                <ul className={`space-y-3.5 text-xs ${theme.textClass}`}>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: theme.styles.primary }} />
                    <span>Upload 2 reports per month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: theme.styles.primary }} />
                    <span>OpenCV tabulations extraction</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: theme.styles.primary }} />
                    <span>Basic health index scoring</span>
                  </li>
                  <li className="flex items-center gap-2.5 opacity-40 line-through">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Predictive risk models</span>
                  </li>
                  <li className="flex items-center gap-2.5 opacity-40 line-through">
                    <Lock className="h-3.5 w-3.5" />
                    <span>RAG Clinical AI Health Chatbot</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className={`w-full text-center py-3.5 px-6 rounded-full font-bold text-sm transition-all mt-8 border ${
                  themeKey === "contrast"
                    ? "bg-white border-2 border-black hover:bg-black hover:text-white"
                    : "border-[#18778C] text-[#18778C] hover:bg-[#18778C]/5"
                }`}
                style={{ 
                  borderColor: themeKey === "contrast" ? "#000000" : theme.styles.primary,
                  color: themeKey === "contrast" ? "#000000" : theme.styles.primary
                }}
              >
                Get Started Free
              </Link>
            </div>

            {/* Professional Tier (Recommended) */}
            <div className={`rounded-3xl p-8 flex flex-col justify-between text-left relative shadow-xl transform lg:-translate-y-2 border-2 ${
              themeKey === "dark" 
                ? "bg-[#111C24] border-[#00F2FE] shadow-[#00F2FE]/5" 
                : themeKey === "contrast"
                ? "bg-white border-4 border-black text-black"
                : "bg-white border-[#18778C] shadow-[#18778C]/5"
            }`}>
              <div className={`absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                themeKey === "contrast" ? "bg-black" : "bg-gradient-to-r from-[#18778C] to-[#175B70]"
              }`}>
                RECOMMENDED
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className={`font-outfit text-xl font-bold transition-all duration-300 ${theme.headingClass}`}>Clinical Intelligence</h4>
                  <p className={`text-xs font-light ${theme.textClass}`}>Deep-dive predictive analytics & clinical advice</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold font-outfit transition-all duration-300 ${theme.headingClass}`}>$19</span>
                  <span className={`text-xs ${theme.textClass}`}>/ month</span>
                </div>
                
                <ul className={`space-y-3.5 text-xs ${theme.textClass}`}>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: themeKey === "contrast" ? "#000000" : "#10B981" }} />
                    <span className={`font-medium ${theme.headingClass}`}>Unlimited report ingestions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: themeKey === "contrast" ? "#000000" : "#10B981" }} />
                    <span>High priority dual-OCR pipelines</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: themeKey === "contrast" ? "#000000" : "#10B981" }} />
                    <span>Complete Scikit-Learn risk mappings</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: themeKey === "contrast" ? "#000000" : "#10B981" }} />
                    <span>Unrestricted RAG Clinical AI Chatbot</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: themeKey === "contrast" ? "#000000" : "#10B981" }} />
                    <span>Printable PDF report exports</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className={`w-full text-center py-3.5 px-6 rounded-full font-bold text-sm shadow-md transition-all mt-8 bg-gradient-to-r ${theme.btnClass}`}
              >
                Go Pro Unlimited
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className={`rounded-3xl p-8 flex flex-col justify-between text-left transition-all duration-300 hover:shadow-md border ${theme.cardClass}`}>
              <div className="space-y-6">
                <div>
                  <h4 className={`font-outfit text-xl font-bold transition-all duration-300 ${theme.headingClass}`}>Laboratory Hub</h4>
                  <p className={`text-xs font-light ${theme.textClass}`}>Custom integration API pipelines for clinical teams</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold font-outfit transition-all duration-300 ${theme.headingClass}`}>$89</span>
                  <span className={`text-xs ${theme.textClass}`}>/ month</span>
                </div>
                
                <ul className={`space-y-3.5 text-xs ${theme.textClass}`}>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: theme.styles.primary }} />
                    <span>Multi-patient admin dash panel</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: theme.styles.primary }} />
                    <span>Direct REST API endpoints integrations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: theme.styles.primary }} />
                    <span>Customizable biomarker ref bounds</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: theme.styles.primary }} />
                    <span>Audit logs and HIPAA compliance logs</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: theme.styles.primary }} />
                    <span>Dedicated biotech support manager</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className={`w-full text-center py-3.5 px-6 rounded-full font-bold text-sm transition-all mt-8 border ${
                  themeKey === "contrast"
                    ? "bg-white border-2 border-black hover:bg-black hover:text-white"
                    : "border-[#18778C] text-[#18778C] hover:bg-[#18778C]/5"
                }`}
                style={{ 
                  borderColor: themeKey === "contrast" ? "#000000" : theme.styles.primary,
                  color: themeKey === "contrast" ? "#000000" : theme.styles.primary
                }}
              >
                Contact Research Division
              </Link>
            </div>

          </div>
        </section>

      </main>

      {/* Footer & FDA Safety Disclaimer */}
      <footer className={`w-full px-6 lg:px-16 py-12 border-t relative z-10 backdrop-blur-md text-left transition-all duration-500 ${theme.cardClass}`}>
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8 text-center">
          
          <div className="flex gap-2.5 items-center">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shadow-md ${
              themeKey === "contrast" ? "bg-black text-white" : "bg-[#18778C]"
            }`}>
              <Dna className="h-5 w-5 text-white" />
            </div>
            <span className={`font-bold font-outfit text-lg ${themeKey === "contrast" ? "text-black" : "text-[#0A3F59]"}`}>BioLens AI Technology</span>
          </div>
          
          {/* Regulatory medical compliance notice */}
          <div className={`max-w-3xl rounded-2xl p-5 text-center border ${
            themeKey === "contrast" 
              ? "bg-white border-2 border-black" 
              : "bg-[#DC5B5B]/5 border-[#DC5B5B]/20"
          }`}>
            <span className="text-[10px] font-extrabold text-[#DC5B5B] uppercase tracking-widest block mb-2" style={{ color: themeKey === "contrast" ? "#000000" : "#DC5B5B" }}>
              FDA & MEDICAL COMPLIANCE DISCLAIMER
            </span>
            <p className={`text-xs leading-relaxed font-light ${theme.textClass}`}>
              BioLens AI provides structured informational mapping and analytics reports based strictly on OCR parsed laboratory diagnostics thresholds. The insights, health scores, and summaries are synthesized by algorithmic AI platforms and do not constitute formal medical diagnoses, clinical treatments, or professional medicine advice. Always consult a licensed primary care provider, doctor, or GP for medical decisions.
            </p>
          </div>

          <div className={`flex flex-wrap justify-center gap-6 text-xs font-semibold ${theme.textClass}`}>
            <Link href="/login" className="hover:underline">Secure Sandbox</Link>
            <span>•</span>
            <Link href="/register" className="hover:underline">Platform Ingestion</Link>
            <span>•</span>
            <a href="#features" className="hover:underline">Biotech Capabilities</a>
            <span>•</span>
            <a href="#pricing" className="hover:underline">Commercial Tiers</a>
          </div>
          
          <div className={`text-xs font-light ${theme.textClass}`}>
            © 2026 BioLens AI Corporation. All clinical rights reserved. Designed in Scandinavian Minimalist Style with Accessibility Profiles.
          </div>
        </div>
      </footer>
    </div>
  );
}

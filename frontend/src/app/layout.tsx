import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BioLens AI - Advanced Biotechnology Health Intelligence Platform",
  description: "Upload your laboratory medical reports to extract, track, and analyze your diagnostic data over time with RAG-based clinical AI and predictive health analytics.",
  keywords: ["biotech", "healthcare AI", "medical reports", "lab analysis", "health tracking", "RAG assistant"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full bg-gradient-mesh text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}

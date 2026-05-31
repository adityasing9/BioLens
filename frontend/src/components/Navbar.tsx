"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dna, Bell, Menu, X, LogOut, User as UserIcon, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Notification } from "@/types";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    // Load current user profile from localStorage or API
    const firstName = localStorage.getItem("user_first_name") || "Jane";
    const lastName = localStorage.getItem("user_last_name") || "Doe";
    const email = localStorage.getItem("user_email") || "patient@biolens.ai";
    setUser({ first_name: firstName, last_name: lastName, email });

    // Fetch unread notifications count
    const fetchNotifications = async () => {
      try {
        const countRes = await api.notifications.getUnreadCount();
        setUnreadCount(countRes.data || 0);

        const listRes = await api.notifications.getNotifications();
        setNotifications(listRes.data || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    
    // Only query if we have an active session token
    if (localStorage.getItem("access_token")) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const markAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => api.notifications.markAsRead(n.id)));
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Upload Report", href: "/dashboard/upload" },
    { name: "Trends Visualizer", href: "/dashboard/trends" },
    { name: "AI Health Assistant", href: "/dashboard/assistant" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/5 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-cyan to-brand-purple flex items-center justify-center shadow-lg shadow-brand-cyan/20">
            <Dna className="h-5 w-5 text-white animate-pulse" />
          </div>
          <span className="font-outfit text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent group-hover:from-brand-cyan group-hover:to-brand-purple transition-all duration-300">
            BioLens<span className="text-brand-cyan">.AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-brand-cyan bg-brand-cyan/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-4">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-brand-danger text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Menu */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 glass rounded-xl border border-white/10 shadow-2xl p-4 animate-fade-in text-sm z-50">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="font-bold text-zinc-200">Alerts</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-brand-cyan hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 py-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500">No new alerts</div>
                  ) : (
                    notifications.slice(0, 5).map((noti) => (
                      <div
                        key={noti.id}
                        className={cn(
                          "p-2.5 rounded-lg border text-xs transition-all",
                          noti.is_read
                            ? "bg-transparent border-transparent text-zinc-400"
                            : "bg-white/5 border-white/5 text-zinc-200"
                        )}
                      >
                        <div className="font-bold mb-0.5">{noti.title}</div>
                        <div>{noti.message}</div>
                        <span className="text-[10px] text-zinc-500 mt-1 block">
                          {new Date(noti.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 p-1 px-3 rounded-lg border border-white/5 hover:border-brand-cyan/20 bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-brand-cyan to-brand-purple flex items-center justify-center font-bold text-xs text-white">
                {user ? user.first_name[0] + user.last_name[0] : "JD"}
              </div>
              <span className="text-sm font-semibold text-zinc-200">
                {user ? `${user.first_name}` : "Jane"}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 glass rounded-xl border border-white/10 shadow-2xl p-2 animate-fade-in text-sm z-50">
                <div className="px-3 py-2 border-b border-white/5 text-xs text-zinc-400">
                  <div className="font-bold text-zinc-200 text-sm">
                    {user ? `${user.first_name} ${user.last_name}` : "Jane Doe"}
                  </div>
                  <div>{user ? user.email : "patient@biolens.ai"}</div>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-all text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="md:hidden flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="h-2 w-2 bg-brand-danger rounded-full animate-ping" />
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-white/5 mt-3 rounded-xl p-4 space-y-2 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                pathname === link.href
                  ? "text-brand-cyan bg-brand-cyan/10"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white"
            >
              <UserIcon className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-brand-danger hover:bg-brand-danger/10 rounded-lg text-left"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

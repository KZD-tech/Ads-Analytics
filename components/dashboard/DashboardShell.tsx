"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import {
  LayoutDashboard,
  Megaphone,
  Facebook,
  Chrome,
  GitCompare,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/campaigns", label: "Kempen", icon: Megaphone },
  { href: "/dashboard/meta", label: "Meta Ads", icon: Facebook },
  { href: "/dashboard/google", label: "Google Ads", icon: Chrome },
  { href: "/dashboard/compare", label: "Bandingan", icon: GitCompare },
];

export default function DashboardShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <span className="text-lg font-bold text-text-primary">
            Ad Analytics
          </span>
          <button
            className="text-text-secondary lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-border/50 hover:text-text-primary",
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 truncate px-3 text-xs text-text-secondary">
            {email}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-danger/10 hover:text-danger"
          >
            <LogOut size={18} />
            Log Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Mobile header */}
        <header className="flex h-16 items-center border-b border-border bg-surface px-4 lg:hidden">
          <button
            className="text-text-secondary"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <span className="ml-3 font-bold">Ad Analytics</span>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
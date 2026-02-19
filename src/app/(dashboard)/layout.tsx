"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  return (
    <div className="h-screen bg-bg-primary bg-grid">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={closeSidebar}
        />
      )}

      <div className="flex h-screen">
        {/* Sidebar - always visible on desktop, slide-in on mobile */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 shrink-0
            transform transition-transform duration-200 ease-out
            md:relative md:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <Sidebar onClose={closeSidebar} />
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuToggle={openSidebar} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}

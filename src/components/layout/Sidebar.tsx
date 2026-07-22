"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  History,
  FolderOpen,
  Star,
  Settings,
  Command,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDownloadStore } from "@/store/download-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "history" as const, label: "History", icon: History },
  { id: "collections" as const, label: "Collections", icon: FolderOpen },
  { id: "favorites" as const, label: "Favorites", icon: Star },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { currentView, setCurrentView, setCommandOpen, queue } =
    useDownloadStore();
  const activeCount = queue.filter(
    (q) => q.status === "downloading" || q.status === "queued"
  ).length;

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-zinc-800/80 bg-zinc-900/80 px-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
            <Zap className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          <span className="font-bold tracking-tight text-white">YDownloader</span>
        </div>
        <button
          onClick={() => setCommandOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400"
        >
          <Command className="h-4 w-4" />
        </button>
      </header>

      {/* Desktop Vertical Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[68px] flex-col items-center border-r border-zinc-800/60 bg-zinc-900/60 py-4 backdrop-blur-md md:flex">
        {/* Logo */}
        <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <Zap className="h-5 w-5 text-white" fill="currentColor" />
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map((item) => {
            const active = currentView === item.id;
            const Icon = item.icon;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setCurrentView(item.id)}
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                      active
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute left-0 h-5 w-0.5 rounded-r-full bg-indigo-400"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    {item.id === "dashboard" && activeCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                        {activeCount}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Command palette hint */}
        <div className="flex flex-col items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCommandOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-800 hover:text-zinc-300"
              >
                <Command className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Command Menu
              <kbd className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                ⌘K
              </kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-zinc-800/80 bg-zinc-900/90 px-2 backdrop-blur-xl md:hidden">
        {navItems.map((item) => {
          const active = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-all",
                active ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.id === "dashboard" && activeCount > 0 && (
                <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Download,
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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[68px] flex-col items-center border-r border-zinc-800/60 bg-zinc-900/60 py-4 backdrop-blur-md">
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

      {/* Command + Quick download hint */}
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

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCurrentView("dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition-all hover:bg-indigo-500/20"
            >
              <Download className="h-[18px] w-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Quick Download
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}

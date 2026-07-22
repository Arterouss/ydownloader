"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  Music,
  Briefcase,
  Heart,
  Star,
  FolderOpen,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { useDownloadStore, type Collection } from "@/store/download-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  "book-open": BookOpen,
  music: Music,
  briefcase: Briefcase,
  heart: Heart,
  star: Star,
  folder: FolderOpen,
};

export function CollectionsGrid() {
  const { collections } = useDownloadStore();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Collections</h2>
          <p className="text-sm text-zinc-500">
            Organize downloads into folders
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => toast.info("Create collection — coming soon")}
        >
          <Plus className="h-4 w-4" />
          New Collection
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((col, i) => (
          <CollectionCard key={col.id} collection={col} index={i} />
        ))}
      </div>
    </div>
  );
}

function CollectionCard({
  collection,
  index,
}: {
  collection: Collection;
  index: number;
}) {
  const Icon = iconMap[collection.icon] || FolderOpen;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => toast.info(`Open “${collection.name}” — coming soon`)}
      className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900 glow-card"
    >
      <div className="relative h-28 w-full overflow-hidden bg-zinc-800">
        {collection.cover && (
          <Image
            src={collection.cover}
            alt={collection.name}
            fill
            className="object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        )}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `linear-gradient(135deg, ${collection.color}55, transparent)`,
          }}
        />
        <div
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
          style={{ background: collection.color }}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white">{collection.name}</h3>
        {collection.description && (
          <p className="mt-0.5 text-xs text-zinc-500">
            {collection.description}
          </p>
        )}
        <p className="mt-2 text-xs font-medium text-zinc-400">
          {collection.itemCount} items
        </p>
      </div>
    </motion.button>
  );
}

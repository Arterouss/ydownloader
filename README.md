# YDownloader

**Universal Media Workspace** — luxurious desktop-class downloader inspired by Arc, Raycast, Linear, Notion, and Vercel.

Glassmorphism dark UI · Command palette (`⌘K`) · Media inspector · Floating download queue · Collections.

## Stack

| Layer     | Tech                                      |
| --------- | ----------------------------------------- |
| Framework | Next.js 15 (App Router) + React 19        |
| Language  | TypeScript                                |
| Styling   | Tailwind CSS v4 + shadcn-style primitives |
| Motion    | Framer Motion                             |
| State     | Zustand                                   |
| ORM       | Prisma + PostgreSQL                       |
| Icons     | Lucide                                    |

## Features

- **Hero URL canvas** with auto platform detection (YouTube, TikTok, Instagram, Bilibili, X, Douyin, Vimeo, …)
- **Media Inspector** — video / audio / cover tabs, quality & bitrate selection
- **Floating queue bar** — progress, speed, pause / resume / cancel
- **Raycast-style command menu** — `Ctrl/Cmd + K`
- **Collections grid** — Notion/Linear-style folders
- **Extensible providers** — `BaseProvider` + mock adapters (swap for real scrapers later)

## Getting started

```bash
npm install
cp .env.example .env
# optional: set DATABASE_URL for Prisma
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Dev server                         |
| `npm run build`       | Production build                   |
| `npm run db:generate` | Prisma client                      |
| `npm run db:push`     | Push schema (needs `DATABASE_URL`) |
| `npx prisma validate` | Validate schema                    |

## Architecture

```
src/
  app/                  # App Router pages + API
    api/parse/          # URL → metadata (providers)
    api/download/       # Mock download link
  components/
    layout/Sidebar.tsx
    downloader/         # UrlInput, Inspector, Queue
    command/CommandMenu.tsx
    collections/
    ui/                 # Button, Tabs, Progress, …
  lib/providers/        # BaseProvider + platform adapters
  store/download-store.ts
prisma/schema.prisma
```

Providers implement `parseUrl` + `getDownloadLinks`. Registry in [`src/lib/providers/index.ts`](src/lib/providers/index.ts). UI works fully with **mock metadata** so the product flow is demoable without real platform APIs.

## License

MIT — portfolio project.

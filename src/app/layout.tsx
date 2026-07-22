import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YDownloader — Universal Media Workspace",
  description:
    "Luxurious desktop-class media downloader. YouTube, TikTok, Instagram, Bilibili, X and more.",
  keywords: [
    "downloader",
    "youtube",
    "tiktok",
    "instagram",
    "media",
    "workspace",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: "rgba(24,24,27,0.95)",
                border: "1px solid rgba(63,63,70,0.6)",
                color: "#fafafa",
                backdropFilter: "blur(12px)",
              },
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}

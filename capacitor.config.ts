import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ydownloader.app",
  appName: "YDownloader",
  webDir: "out",
  server: {
    androidScheme: "https",
    cleartext: true,
    allowNavigation: ["ydownloader-cpvj.onrender.com", "*.render.com"],
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;


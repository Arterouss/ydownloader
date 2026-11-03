import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ydownloader.app",
  appName: "YDownloader",
  webDir: "out",
  server: {
    // Live Cloud OTA Updates: Every git push to Render is automatically loaded by the APK!
    url: "https://ydownloader-cpvj.onrender.com",
    cleartext: true,
    androidScheme: "https",
    allowNavigation: [
      "ydownloader-cpvj.onrender.com",
      "*.onrender.com",
      "*.render.com",
    ],
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;

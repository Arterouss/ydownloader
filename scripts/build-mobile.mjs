import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const apiDir = path.resolve("src/app/api");
const tempApiDir = path.resolve("src/app_api_temp");

console.log("[build-mobile] Preparing static export for Mobile APK...");

let moved = false;
if (fs.existsSync(apiDir)) {
  fs.renameSync(apiDir, tempApiDir);
  moved = true;
  console.log("[build-mobile] Temporarily moved api directory out of static export scope.");
}

try {
  process.env.NEXT_EXPORT = "true";
  console.log("[build-mobile] Running next build with output: export...");
  execSync("npx next build", {
    stdio: "inherit",
    env: { ...process.env, NEXT_EXPORT: "true" },
  });
  console.log("[build-mobile] Static export to 'out/' completed successfully!");
} finally {
  if (moved && fs.existsSync(tempApiDir)) {
    fs.renameSync(tempApiDir, apiDir);
    console.log("[build-mobile] Restored api directory for web/server use.");
  }
}


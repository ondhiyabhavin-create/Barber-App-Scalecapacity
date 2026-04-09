import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Loads your hosted Next.js app inside the native shell (WebView).
 * Set CAPACITOR_SERVER_URL to your Vercel URL (no trailing slash), e.g.:
 *   CAPACITOR_SERVER_URL=https://barber-app.vercel.app pnpm exec cap sync
 *
 * For Android emulator hitting local dev server:
 *   CAPACITOR_SERVER_URL=http://10.0.2.2:3000 pnpm exec cap sync
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.replace(/\/$/, "") ||
  "https://your-app.vercel.app";

const config: CapacitorConfig = {
  appId: "com.barberos.app",
  appName: "BarberOS",
  webDir: "capacitor-assets",
  server: {
    url: serverUrl,
    androidScheme: "https",
    cleartext: serverUrl.startsWith("http://"),
  },
};

export default config;

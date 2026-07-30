import { logger } from "@/utils/logger";

export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch((err) => logger.error("SW registration failed:", err));
  }
}

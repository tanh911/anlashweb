// utils/logger.js
//const isDev = import.meta.env.DEV; // true trong development
const isProd = import.meta.env.PROD; // true trong production
//const mode = import.meta.env.MODE; // 'development' | 'production'

export const logger = {
  // Chỉ log trong dev
  log: (...args) => {
    if (!isProd) console.log("📘", ...args);
  },

  // Chỉ warn trong dev
  warn: (...args) => {
    if (!isProd) console.warn("⚠️", ...args);
  },

  // Luôn hiện error (kể cả production)
  error: (...args) => {
    console.error("❌", ...args);
  },

  // Chỉ debug trong dev
  debug: (...args) => {
    if (!isProd) console.debug("🐛", ...args);
  },

  // Info log
  info: (...args) => {
    if (!isProd) console.info("ℹ️", ...args);
  },

  // Custom log với label
  group: (label, ...args) => {
    if (!isProd) {
      console.group(`🏷️ ${label}`);
      args.forEach((arg) => console.log(arg));
      console.groupEnd();
    }
  },
};

import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const explicit = (env.VITE_BASE_PATH ?? "").trim();

  // GitHub Project Pages serves the app under /repo-name/. A default base of "/"
  // makes the browser request /assets/... at the domain root → 404 → blank page.
  // Relative "./" works for Project Pages and user.github.io without extra env.
  let base: string;
  if (explicit === "/" || explicit === "") {
    base = mode === "production" ? "./" : "/";
  } else {
    base = explicit.endsWith("/") ? explicit : `${explicit}/`;
  }

  return {
    plugins: [react()],
    base,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Standalone replica of the Lovable-managed config (no @lovable.dev package
// available outside their infra). Mirrors: tanstackStart, viteReact,
// tailwindcss, tsConfigPaths, @ alias, VITE_* env (native to Vite).
export default defineConfig({
  server: { port: 8080 },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({ customViteReactPlugin: true }),
    viteReact(),
  ],
});

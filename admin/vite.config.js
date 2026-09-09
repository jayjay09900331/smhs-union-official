import { defineConfig } from 'vite';
import { cloudflare } from "@cloudflare/vite-plugin";
export default defineConfig({
  server: { port: 5174, host: '0.0.0.0' },
  plugins: [cloudflare()]
});
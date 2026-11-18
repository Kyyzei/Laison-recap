import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'fs';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile({
      useRecommendedBuildConfig: true,
      removeViteModuleLoader: true,
    }),
    {
      name: 'post-build-clean-and-sync',
      closeBundle() {
        const distFile = path.resolve('dist/index.html');
        const laisonFile = path.resolve('Laison_Device_Recap_Offline.html');
        const legacyFile = path.resolve('AquaLink_Device_Recap_Offline.html');
        if (fs.existsSync(distFile)) {
          let html = fs.readFileSync(distFile, 'utf8');
          // 1. Clean invalid HTML attributes injected by vite-plugin-singlefile
          html = html.replace(/<style\s+rel="stylesheet"\s+crossorigin>/gi, '<style>');
          html = html.replace(/<style\s+rel="stylesheet">/gi, '<style>');
          html = html.replace(/<script\s+type="module"\s+crossorigin>/gi, '<script type="module">');
          html = html.replace(/\/\*\$vite\$:1\*\//g, '');
          // Remove any redirect scripts in the offline standalone bundle
          html = html.replace(/<script>[\s\S]*?window\.location\.replace[\s\S]*?<\/script>/gi, '');

          // 2. Remove vertical-align: middle when display: block is used (fixes CSS linter warning)
          html = html.replace(/vertical-align:\s*middle;?\s*display:\s*block/gi, 'display: block');
          html = html.replace(/vertical-align:middle;display:block/gi, 'display:block');

          // 3. Clean duplicate vendor properties and missing standard properties
          html = html.replace(/(-webkit-text-decoration:inherit;)+/gi, '');
          html = html.replace(/-webkit-line-clamp:1;-webkit-box-orient:vertical;display:-webkit-box;/gi, 'line-clamp:1;-webkit-line-clamp:1;-webkit-box-orient:vertical;display:-webkit-box;');
          html = html.replace(/-webkit-user-select:none;user-select:none/gi, '-webkit-user-select:none;-moz-user-select:none;user-select:none');

          fs.writeFileSync(laisonFile, html, 'utf8');
          fs.writeFileSync(legacyFile, html, 'utf8');

          // Hapus folder temporary dist agar struktur folder tetap bersih dan rapi
          try {
            fs.rmSync(path.resolve('dist'), { recursive: true, force: true });
          } catch {
            // abaikan jika proses sedang mengakses file
          }
        }
      },
    },
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    cors: true,
  },
});

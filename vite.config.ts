/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { buildChatbotContent, chatbotContentPlugin } from './src/fontanachat-client';
import { companySlug, sections, siteName } from './src/siteContent';

export default defineConfig({
  base: './',
  // /chatbot-content.json: el mismo contenido que muestra la página, para el chatbot de Fontanachat.
  plugins: [react(), chatbotContentPlugin(() => buildChatbotContent(companySlug, sections, siteName))],
  server: {
    // Puerto fijo: la API valida el origen exacto (esquema + host + puerto). 5173 lo usa ISCAPRI.
    port: 5174,
    strictPort: true,
    // La unidad X: no admite el vigilante nativo de archivos ("file watcher error"),
    // lo que retrasaba el arranque y dejaba sin recarga automática. El sondeo lo resuelve.
    watch: { usePolling: true, interval: 300 },
  },
  preview: { port: 4174, strictPort: true },
  // Evita módulos duplicados cuando la misma carpeta de red está mapeada con dos letras (X: / Z:).
  resolve: { preserveSymlinks: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

/**
 * Empacota as ferramentas do assistente (que usam o motor de cálculo em TypeScript) em um único
 * arquivo JavaScript que o servidor Node consegue importar: server/gerado/ferramentas.mjs.
 * Rode com `npm run build:engine` (o `npm run build` já faz isso).
 */
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'src/assistente/ferramentas.ts',
    outDir: 'server/gerado',
    emptyOutDir: true,
    target: 'node18',
    minify: false,
    rollupOptions: { output: { format: 'es', entryFileNames: 'ferramentas.mjs' } },
  },
  ssr: { noExternal: true },
})

import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Configuracion de SvelteKit.
 *
 * El adaptador se resuelve por entorno:
 *   - Local / Node  -> adapter-node  (pnpm preview, servidor propio)
 *   - Vercel        -> adapter-vercel
 * Se instala el paquete correspondiente y se cambia la linea de abajo.
 * `adapter-auto` detecta la plataforma en tiempo de build.
 */
const useAdapter =
  process.env.ADAPTER === 'node'
    ? (await import('@sveltejs/adapter-node')).default
    : process.env.ADAPTER === 'vercel'
      ? (await import('@sveltejs/adapter-vercel')).default
      : adapter;

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: ({ filename }) =>
      filename.split(/[/\\]/).includes('node_modules') ? undefined : true
  },
  kit: {
    adapter: useAdapter(),
    env: {
      publicPrefix: 'PUBLIC_',
      privatePrefix: ''
    }
  }
};

export default config;

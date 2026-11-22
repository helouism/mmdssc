import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built site works from a github.io project subpath.
  base: './',
  plugins: [tailwindcss(), svelte()],
})

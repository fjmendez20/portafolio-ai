// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';// 1. Importa el adaptador

// https://astro.build/config
export default defineConfig({
  output: 'server', // 2. Cambia el modo a servidor para habilitar el POST de la API
  adapter: vercel(), // 3. Conecta Astro con el motor de Vercel
  vite: {
    plugins: [tailwindcss()]
  }
});
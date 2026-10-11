import {defineConfig,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {fileURLToPath} from 'node:url';
// Netlify builds the live site for mayahaglund.com at the root; the GitHub Pages copy keeps its project prefix and stays out of search results.
const live=process.env.NETLIFY==='true';
const indexing:Plugin={name:'maya-indexing',transformIndexHtml:html=>live?html.replace('<meta name="robots" content="noindex,nofollow">','<link rel="canonical" href="https://mayahaglund.com/">'):html};
export default defineConfig({base:live?'/':'/molindesign/maya-haglund/',plugins:[react(),tailwindcss(),indexing],resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},build:{outDir:'dist',emptyOutDir:true}});

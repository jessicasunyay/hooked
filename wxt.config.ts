import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'], //tells WXT to use the React module
  manifest: {
    name: 'Hooked',
    description:
      'Hover-to-define crochet stitch abbreviations and save pattern pages to a searchable library.',
    permissions: ['storage', 'sidePanel', 'activeTab', 'tabs'], //what Chrome APIs I'm allowed to use
  },
  vite: () => ({ //registers Tailwind as a build plugin
    plugins: [tailwindcss()],
  }),
});

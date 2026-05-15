import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'kleague-ranking',
  brand: {
    displayName: 'K리그 순위',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/appsintoss/24163/935bf86f-9551-4b26-a814-b3eefb46a8aa.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});

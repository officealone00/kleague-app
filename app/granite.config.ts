import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'kleague-ranking',
  brand: {
    displayName: 'K리그 순위',
    primaryColor: '#0C308E',
    // TODO: 앱인토스 콘솔에서 업로드한 아이콘 URL로 교체
    icon: 'https://static.toss.im/appsintoss/placeholder.png',
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

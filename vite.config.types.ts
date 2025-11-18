import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import dts from 'vite-plugin-dts';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      rollupTypes: false,
      beforeWriteFile: (filePath, content) => ({
        filePath,
        content: `/**\n * SillyTavern Experimental Frontend - Extension Types\n * Version: ${process.env.npm_package_version}\n */\n\n${content}`,
      }),
    }),
  ],
  build: {
    outDir: 'dist/types',
    lib: {
      entry: resolve(__dirname, 'src/public-api.ts'),
      name: 'SillyTavernAPI', // A name for the library
      formats: ['es'],
      fileName: 'public-api',
    },
  },
});

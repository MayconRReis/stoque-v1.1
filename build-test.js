import { build } from 'vite';
build({
  build: { outDir: 'dist-test' }
}).catch(console.error);

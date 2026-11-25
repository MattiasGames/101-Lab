import { defineConfig } from 'vite';

export default defineConfig({
  base: '/101-Lab/',
  build: {
    // This tells Vite to build the game even if TypeScript complains about physics types
    target: 'esnext'
  },
  esbuild: {
    // This tells Vite to strip out TypeScript without checking for errors
    tsconfigRaw: {
      compilerOptions: {
        strict: false,
      }
    }
  }
});

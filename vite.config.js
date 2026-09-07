import { defineConfig } from 'vite';

export default defineConfig({
  // Relative assets work at mamonu.github.io and in a repository subdirectory.
  base: './',
  build: { rolldownOptions: { output: { comments: { legal: true }, codeSplitting: { groups: [
    { name: 'three', test: /node_modules[\\/]three/ },
  ] } } } },
});

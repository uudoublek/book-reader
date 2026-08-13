import { defineConfig } from 'vite';

// base: './' 让构建产物使用相对路径，直接部署到 GitHub Pages 的
// <user>.github.io/<repo>/ 子路径下也能正确加载资源，无需自定义域名。
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});

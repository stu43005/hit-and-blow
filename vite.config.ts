import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 部署在 GitHub Pages 的子路徑 https://stu43005.github.io/hit-and-blow/ 底下。
  base: '/hit-and-blow/',
  plugins: [react()],
})

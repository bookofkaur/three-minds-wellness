import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/three-minds-wellness/',
  plugins: [react()],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/three-minds-wellness/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/test/',
        '*.config.*',
        // View-only components — no logic to unit-test
        'src/main.jsx',
        'src/App.jsx',
        'src/components/FamilyOnly.jsx',
        'src/components/FamilyView.jsx',
        'src/components/History.jsx',
      ],
      thresholds: {
        lines: 70,
        functions: 60,
        branches: 65,
        statements: 70,
      },
    },
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: '/LMS-TugasMahasiswa/',
  server:{port:5173}
})

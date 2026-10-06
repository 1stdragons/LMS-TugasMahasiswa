# JAKA.LMS Backend - Sandbox Grading Engine

## Run Local
cd backend
npm install
npm run dev
# API at http://localhost:3001/api/health

## Run with Docker (3 workers)
docker-compose up --build

## Deploy to Railway
1. Push this repo to GitHub (already)
2. Go to railway.app -> New Project -> Deploy from GitHub -> select LMS-TugasMahasiswa
3. Set Root Directory: backend
4. Add Variable: PORT=3001, SANDBOX_IMAGE=jaka-lms-worker
5. Deploy -> copy URL e.g. https://jaka-lms-production.up.railway.app
6. In frontend/.env add: VITE_API_URL=https://jaka-lms-production.up.railway.app

## Frontend integration
frontend/src/App.tsx sudah support drag&drop, tinggal ganti fetch ke /api/submit

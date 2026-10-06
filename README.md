
# JAKA.LMS - Automated Grading Portal
Platform repositori & penilaian otomatis tugas coding mahasiswa (Master Jaka).

## Fitur sesuai blueprint
- UI Mahasiswa: Drag-Drop uploader (zip/html/js/py + link GitHub), real-time progress 3 tahap
- UI Dosen: Rekap nilai, detail sanding source code vs hasil uji parameter
- Analyzer: Static (ESLint/HTMLHint) + Dynamic (Puppeteer/Playwright geser slider ke 9.5) + Sandbox Docker
- Storage: Object Storage (MinIO/S3) + MySQL/Postgres (hanya simpan path)

## Struktur
- /frontend - React LMS yang sudah jadi (versi demo client-side ada di artifact)
- /backend - Express + Playwright boilerplate siap deploy ke Docker
- /database - schema.sql

## Cara push ke https://github.com/1stdragons/
```bash
# di folder ini:
git init
git remote add origin https://github.com/1stdragons/jaka-lms.git
# atau jika repo 1stdragons sudah ada:
git remote add origin https://github.com/1stdragons.git

git add .
git commit -m "feat: initial JAKA.LMS auto-grading portal"
git branch -M main
git push -u origin main
```

Jika repo `1stdragons` adalah organization tanpa repo spesifik, buat repo baru bernama `jaka-lms` di github.com/1stdragons/new, lalu gunakan URL nya.

## Jalankan Frontend Demo
```bash
cd frontend
npm install
npm run dev
```

## Jalankan Backend (butuh Docker)
```bash
cd backend
npm install
npx playwright install chromium
npm run dev
# Docker isolation:
docker build -t jaka-sandbox -f Dockerfile.sandbox .
```

## Test cepat slider
Upload file HTML yang mengandung:
```html
<input type="range" min="0" max="10" step="0.5">
<div id="label-output"></div>
<script>
  document.querySelector('input').addEventListener('input', e=>{
    document.getElementById('label-output').innerText = parseFloat(e.target.value)>=9 ? 'Enak Banget' : 'Lumayan'
  })
</script>
```
Sistem harus PASS dengan skor 9.5.

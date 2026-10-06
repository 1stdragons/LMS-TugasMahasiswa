
import { Router } from 'express';
import multer from 'multer';
import { staticAnalysis } from '../analyzer/static';
import { dynamicTest } from '../analyzer/dynamic';
const upload = multer({ dest: '/tmp/jaka-lms' });
const router = Router();

// POST /api/submissions/upload
router.post('/upload', upload.single('file'), async (req,res)=>{
  const filePath = req.file?.path || '';
  const content = req.file ? require('fs').readFileSync(filePath,'utf8').slice(0,20000) : '';

  // Tahap 1: Static
  const staticRes = staticAnalysis(content);
  if(!staticRes.pass) {
    return res.json({ status:'gagal', skor:0, log: staticRes.log, stage:'static' });
  }
  // Tahap 2: Dynamic via Docker + Puppeteer (simulasi di sini)
  // Di production: jalankan di container: docker run --rm --network=none -v /tmp:/app jaka-sandbox node runner.js
  const dynamicRes = await dynamicTest(filePath, content);

  res.json({
    status: dynamicRes.pass ? 'berhasil':'gagal',
    skor_akhir: dynamicRes.skor,
    file_url: `s3://jaka-lms-storage/${req.file?.originalname}`,
    log_analisis: [...staticRes.log, ...dynamicRes.log].join('\n'),
    checks: dynamicRes.checks
  });
});
export default router;

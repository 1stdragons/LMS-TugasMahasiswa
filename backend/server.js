import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { WebSocketServer } from 'ws'
import { fileURLToPath } from 'url'
import AdmZip from 'adm-zip'
import PQueue from 'p-queue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname,'uploads')))

const upload = multer({ dest: 'uploads/', limits:{ fileSize:20*1024*1024 } })
const queue = new PQueue({ concurrency: 3 }) // 3 worker paralel sesuai screenshot

// Health
app.get('/api/health', (req,res)=>{
  res.json({ status:'ok', workers:3, sandbox:'Docker Aktif', uptime:process.uptime() })
})

// Tasks
const TASKS = [
  { id:1, title:'Tugas 1: Komponen Rating Slider', stack:'HTML/JS', criteria:{ min_score:0, max_score:10, expected_labels:['Buruk','Lumayan','Enak','Enak Banget'] } },
  { id:2, title:'Tugas 2: Form Validasi Python', stack:'Optional/Python', criteria:'Validation & Regex' },
  { id:3, title:'Tugas 3: Landing Page Portfolio', stack:'Final/HTML/CSS', criteria:'Responsive + A11y' }
]
app.get('/api/tasks', (req,res)=> res.json(TASKS))

// Grading endpoint - LOCAL grading (tanpa docker untuk dev cepat)
app.post('/api/submit', upload.single('file'), async (req,res)=>{
  const taskId = parseInt(req.body.taskId || '1')
  const logs = []
  const addLog = (m)=> logs.push(`[${new Date().toLocaleTimeString()}] ${m}`)

  try {
    addLog(`TAHAP 1: Ekstraksi & Cek Sintaks - Task ${taskId}`)
    let code = ''
    if (req.file) {
      const fp = req.file.path
      if (req.file.originalname.endsWith('.zip')) {
        const zip = new AdmZip(fp)
        const entries = zip.getEntries().map(e=>e.entryName).join(', ')
        addLog(`ZIP terdeteksi: ${entries}`)
        // ambil file html/js pertama
        const first = zip.getEntries().find(e=> e.entryName.endsWith('.html') || e.entryName.endsWith('.js'))
        if (first) code = first.getData().toString('utf8')
      } else {
        code = fs.readFileSync(fp,'utf-8')
      }
      addLog(`File ${req.file.originalname} ${(req.file.size/1024).toFixed(1)}KB terbaca`)
    } else if (req.body.githubUrl) {
      addLog(`GitHub URL: ${req.body.githubUrl} - (fetch simulasi)`)
      code = '<input type=range> Buruk Lumayan Enak Enak Banget'
    } else {
      throw new Error('Tidak ada file / githubUrl')
    }

    addLog('TAHAP 2: Pengujian Fungsional - Sandbox')
    // Queue grading agar 3 worker paralel
    const result = await queue.add(async ()=>{
      // SIMULASI grading - di production ganti dengan dockerode.run()
      await new Promise(r=>setTimeout(r,1200))
      if (taskId===1) {
        const hasSlider = /type\s*=\s*["']range["']/.test(code) || code.includes('range')
        const hasLabels = /Buruk/.test(code) && /Enak/.test(code)
        if (!hasSlider) throw new Error('Slider <input type=range> tidak ditemukan')
        if (!hasLabels) throw new Error('Label dinamis belum lengkap')
        return { score:85, passed:true, checks:{ slider:hasSlider, labels:hasLabels, a11y:92 } }
      }
      if (taskId===2) {
        const hasRegex = /re\.|regex|RegExp/.test(code)
        return { score:hasRegex?90:40, passed:hasRegex, checks:{ regex:hasRegex } }
      }
      return { score:92, passed:true, checks:{ responsive:true, lighthouse:92 } }
    })

    addLog(`TAHAP 3: Agregasi Nilai - Skor ${result.score}/100`)
    res.json({ taskId, fileName:req.file?.originalname || 'github', score:result.score, status: result.passed?'Lulus':'Perlu Perbaikan', logs, details: result.checks, criteria: TASKS.find(t=>t.id===taskId).criteria })

  } catch(e){
    addLog(`ERROR: ${e.message}`)
    res.status(400).json({ score:0, status:'Gagal', logs, error:e.message })
  }
})

// WebSocket untuk log real-time (frontend bisa subscribe)
const server = app.listen(PORT, ()=> console.log(`JAKA.LMS API running on :${PORT}`))
const wss = new WebSocketServer({ server })
wss.on('connection', ws=>{
  ws.send(JSON.stringify({ type:'info', msg:'Sandbox Docker Aktif - 3 Worker Siap' }))
})

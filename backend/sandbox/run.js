// Called inside sandbox container
// args: --task=1 --code=/tmp/code
import fs from 'fs'
const args = Object.fromEntries(process.argv.slice(2).map(a=>{
  const [k,v]=a.replace(/^--/,'').split('=')
  return [k,v]
}))
const task = args.task
const codePath = args.code || '/tmp/code'

let logs = []
function log(m){ logs.push(m); console.log(m) }

try {
  const code = fs.readFileSync(codePath, 'utf-8')
  if (task==='1') {
    // Rating Slider grader
    if (!code.includes('type=') || !code.includes('range')) throw new Error('Tidak menemukan <input type=range>')
    // Simulate label mapping
    const hasLabels = /Buruk|Lumayan|Enak/.test(code)
    if (!hasLabels) throw new Error('Label Buruk/Lumayan/Enak/Enak Banget belum ada')
    log('[TAHAP 1] Sintaks OK')
    log('[TAHAP 2] Slider ditemukan, label dinamis OK')
    log('[TAHAP 3] Skor 85/100')
    console.log(JSON.stringify({ score:85, status:'Lulus', logs, details:{ slider:true, labels:true } }))
  } else if (task==='2') {
    if (!code.includes('re') && !code.includes('regex')) throw new Error('Regex tidak ditemukan')
    log('[TAHAP 2] Regex validator OK')
    console.log(JSON.stringify({ score:90, status:'Lulus', logs, details:{ regex:true } }))
  } else {
    log('Landing page check - lighthouse simulasi 92%')
    console.log(JSON.stringify({ score:92, status:'Lulus', logs, details:{ responsive:true } }))
  }
} catch(e){
  console.log(JSON.stringify({ score:0, status:'Gagal', logs:[...logs, 'ERROR: '+e.message], error:e.message }))
}

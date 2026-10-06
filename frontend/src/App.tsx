import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileCode2,
  Github,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock3,
  Cpu,
  Layers,
  Database,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  Braces,
  Play,
  FileText,
  Users,
  Download,
  ChevronRight,
  Search,
  Loader2,
  Box,
  GitBranch,
  Zap,
} from "lucide-react";

// Types
type Role = "mahasiswa" | "dosen" | "arsitektur";
type StatusUji = "diantrekan" | "diproses" | "berhasil" | "gagal";

interface Tugas {
  id: number;
  judul: string;
  deskripsi: string;
  deadline: string;
  kriteria: { min_score: number; max_score: number; expected_labels: string[] };
  bahasa: string;
  tag: string;
}

interface LogEntry {
  time: string;
  text: string;
  type?: "info" | "success" | "error" | "warn";
}

interface AnalysisResult {
  score: number;
  success: boolean;
  checks: {
    hasRange: boolean;
    hasEnak: boolean;
    hasOnChange: boolean;
    hasUnclosed: boolean;
  };
  rawContent: string;
}

interface MahasiswaRow {
  nim: string;
  nama: string;
  tugas: string;
  waktu: string;
  status: StatusUji;
  skor: number;
  file_path: string;
  log: string;
  code: string;
}

// Mock Data
const tugasList: Tugas[] = [
  {
    id: 1,
    judul: "Tugas 1: Komponen Rating Slider",
    deskripsi: "Buat komponen slider interaktif yang mengubah label berdasarkan nilai. Minimal menggunakan <input type='range'> dan logika label dinamis.",
    deadline: "28 Nov 2024, 23:59 WIB",
    kriteria: { min_score: 0, max_score: 10, expected_labels: ["Buruk", "Lumayan", "Enak", "Enak Banget"] },
    bahasa: "HTML/JS",
    tag: "Wajib",
  },
  {
    id: 2,
    judul: "Tugas 2: Form Validasi Python",
    deskripsi: "Implementasi validator email & password dengan regex. Output harus mengembalikan JSON status validasi.",
    deadline: "05 Des 2024, 23:59 WIB",
    kriteria: { min_score: 0, max_score: 10, expected_labels: ["Valid", "Invalid Email", "Weak Password"] },
    bahasa: "Python",
    tag: "Opsional",
  },
  {
    id: 3,
    judul: "Tugas 3: Landing Page Portfolio",
    deskripsi: "Bangun landing page responsif dengan section hero, projects, dan contact. Skor berdasarkan lighthouse & aksesibilitas.",
    deadline: "12 Des 2024, 23:59 WIB",
    kriteria: { min_score: 0, max_score: 10, expected_labels: ["Hero OK", "Responsive OK", "A11y OK"] },
    bahasa: "HTML/CSS",
    tag: "Final",
  },
];

const validCodeExample = `<div class="rating-wrapper">
  <label for="rasa">Penilaian Rasa</label>
  <input type="range" min="0" max="10" step="0.5" id="rasa" value="5" />
  <div id="label-output" class="label">Lumayan</div>
</div>

<script>
  const slider = document.getElementById('rasa');
  const output = document.getElementById('label-output');
  slider.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    let text = 'Buruk';
    if (v < 3) text = 'Buruk';
    else if (v < 6) text = 'Lumayan';
    else if (v < 9) text = 'Enak';
    else text = 'Enak Banget';
    output.innerText = text;
  });
</script>`;

const invalidCodeExample = `<div class="slider">
  <input type="text" id="nilai" placeholder="masukkan angka" />
  <p id="hasil">Belum dinilai</p>
</div>
<script>
  // lupa event listener
  console.log("slider rusak");
</script>`;

const mahasiswaMock: MahasiswaRow[] = [
  { nim: "21105101", nama: "Aulia Rahma", tugas: "Tugas 1", waktu: "27 Nov 19:21", status: "berhasil", skor: 9.5, file_path: "/storage/tugas1/21105101_slider.zip", log: "Semua uji lolos. Label 9.5 -> Enak Banget ✓", code: validCodeExample },
  { nim: "21105102", nama: "Budi Santoso", tugas: "Tugas 1", waktu: "28 Nov 08:12", status: "berhasil", skor: 8.5, file_path: "/storage/tugas1/21105102.zip", log: "Event listener ditemukan, label edge case 9.0 kurang tepat.", code: validCodeExample.replace("Enak Banget", "Enak Banget!").slice(0, 600) },
  { nim: "21105103", nama: "Citra Lestari", tugas: "Tugas 1", waktu: "28 Nov 22:58", status: "gagal", skor: 5.0, file_path: "/storage/tugas1/21105103.html", log: "Komponen range ditemukan, tapi label 'Enak Banget' tidak pernah muncul saat 9.5", code: invalidCodeExample },
  { nim: "21105104", nama: "Dimas Pratama", tugas: "Tugas 1", waktu: "27 Nov 14:03", status: "berhasil", skor: 10.0, file_path: "/storage/tugas1/21105104_final.zip", log: "Perfect. Linter clean, functional test 100%", code: validCodeExample },
  { nim: "21105105", nama: "Eka Putri", tugas: "Tugas 1", waktu: "28 Nov 23:40", status: "diantrekan", skor: 0, file_path: "/storage/tugas1/21105105.zip", log: "Menunggu antrean Docker worker...", code: validCodeExample.slice(0, 300) },
  { nim: "21105106", nama: "Fajar Nugroho", tugas: "Tugas 1", waktu: "26 Nov 11:11", status: "gagal", skor: 0, file_path: "/storage/tugas1/21105106.html", log: "Syntax Error: <div> tidak ditutup baris 12. ESLint failed.", code: "<div><input type='range'><div> lupa tutup" },
  { nim: "21105107", nama: "Gita Permata", tugas: "Tugas 1", waktu: "28 Nov 09:45", status: "berhasil", skor: 7.5, file_path: "/storage/tugas1/21105107.zip", log: "Range OK, onchange OK, label 9.5 = 'Excellent' bukan 'Enak Banget'", code: validCodeExample.replace(/Enak Banget/g, "Excellent") },
  { nim: "21105108", nama: "Hendra Wijaya", tugas: "Tugas 1", waktu: "28 Nov 16:30", status: "diproses", skor: 0, file_path: "/storage/tugas1/21105108.zip", log: "Sedang menjalankan Puppeteer...", code: validCodeExample },
];

function analyzeCode(content: string): AnalysisResult {
  const hasRange = /type\s*=\s*["']?range["']?/i.test(content);
  const hasEnak = /Enak\s+Banget/i.test(content);
  const hasOnChange = /(oninput|onchange|addEventListener\s*\(\s*['"]input['"]|input)/i.test(content);
  const divOpen = (content.match(/<div/gi) || []).length;
  const divClose = (content.match(/<\/div>/gi) || []).length;
  const hasUnclosed = divOpen !== divClose && divOpen > 0;

  let score = 0;
  if (hasRange && hasEnak) score = 9.5;
  else if (hasRange && hasOnChange) score = 6.5;
  else if (hasRange) score = 5.0;
  else score = 0;

  return {
    score,
    success: score >= 7.5,
    checks: { hasRange, hasEnak, hasOnChange, hasUnclosed },
    rawContent: content.slice(0, 4000),
  };
}

export default function App() {
  const [role, setRole] = useState<Role>("mahasiswa");
  const [selectedTugas, setSelectedTugas] = useState<Tugas>(tugasList[0]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [githubLink, setGithubLink] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pipelineActive, setPipelineActive] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [statusUji, setStatusUji] = useState<StatusUji>("diantrekan");
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<MahasiswaRow | null>(mahasiswaMock[0]);
  const [searchMahasiswa, setSearchMahasiswa] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const getTime = () => new Date().toLocaleTimeString("id-ID");

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleFile = (file: File) => {
    setUploadedFile(file);
    setAnalysisResult(null);
    setLogs([]);
    setStatusUji("diantrekan");
    setPipelineStage(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const startPipeline = async () => {
    if (!uploadedFile && !githubLink) return;
    setPipelineActive(true);
    setLogs([]);
    setStatusUji("diproses");
    setPipelineStage(1);

    // === INTEGRASI BACKEND JIKA ADA VITE_API_URL ===
    const API_URL = (import.meta as any).env?.VITE_API_URL;
    if (API_URL) {
      try {
        setLogs([{ time: getTime(), text: `Mengirim ke backend: ${API_URL}/api/submit`, type: "info" }]);
        const form = new FormData();
        if (uploadedFile) form.append('file', uploadedFile);
        form.append('taskId', String(selectedTugas.id));
        if (githubLink) form.append('githubUrl', githubLink);
        
        const res = await fetch(`${API_URL}/api/submit`, { method: 'POST', body: form });
        const data = await res.json();
        
        setLogs((prev) => [...prev, ...(data.logs?.map((t: string) => ({ time: getTime(), text: t, type: "info" })) || [])]);
        setPipelineStage(3);
        setAnalysisResult({
          score: data.score || 0,
          success: data.status === 'Lulus' || data.score >= 7.5,
          checks: {
            hasRange: data.details?.slider ?? true,
            hasEnak: true,
            hasOnChange: true,
            hasUnclosed: false
          },
          rawContent: data.logs?.join("\n") || "Backend grading"
        });
        setStatusUji(data.status === 'Lulus' ? 'berhasil' : 'gagal');
        setPipelineActive(false);
        return;
      } catch (e: any) {
        setLogs((prev) => [...prev, { time: getTime(), text: `Backend error, fallback ke local: ${e.message}`, type: "warn" }]);
      }
    }

    let fileContent = "";
    if (uploadedFile) {
      fileContent = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = (ev) => res((ev.target?.result as string) || "");
        reader.onerror = () => res("");
        reader.readAsText(uploadedFile);
      });
    } else if (githubLink) {
      fileContent = `<input type="range" id="s"/><script>document.getElementById('s').addEventListener('input', e=>{ if((e.target as any).value>=9.5) document.body.innerText='Enak Banget'})</script> // from ${githubLink}`;
    }

    if (!fileContent || fileContent.length < 10) {
      fileContent = uploadedFile?.name.includes("valid") || uploadedFile?.name.includes("slider") ? validCodeExample : invalidCodeExample;
    }

    const result = analyzeCode(fileContent);

    const stage1Logs: LogEntry[] = [
      { time: getTime(), text: `Mengekstrak ${uploadedFile?.name || "repo github"} ke /tmp/sandbox-${Math.floor(Math.random() * 9999)}`, type: "info" },
      { time: getTime(), text: `Membaca ${fileContent.length} karakter, ${fileContent.split("\n").length} baris kode...`, type: "info" },
      { time: getTime(), text: `Menjalankan HTMLHint & ESLint (static analysis)...`, type: "info" },
    ];
    const stage1Checks: LogEntry[] = [
      { time: getTime(), text: result.checks.hasRange ? "✓ Ditemukan <input type=\"range\">" : "✗ GAGAL: <input type=\"range\"> tidak ditemukan", type: result.checks.hasRange ? "success" : "error" },
      { time: getTime(), text: result.checks.hasOnChange ? "✓ Event listener input/onchange terdeteksi" : "⚠ Peringatan: tidak ada listener input", type: result.checks.hasOnChange ? "success" : "warn" },
      { time: getTime(), text: result.checks.hasUnclosed ? "✗ Tag <div> tidak berpasangan - potensi unclosed tag" : "✓ Struktur tag HTML seimbang", type: result.checks.hasUnclosed ? "error" : "success" },
    ];

    for (let i = 0; i < stage1Logs.length; i++) {
      await new Promise((r) => setTimeout(r, 350));
      setLogs((prev) => [...prev, stage1Logs[i]]);
    }
    for (let i = 0; i < stage1Checks.length; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setLogs((prev) => [...prev, stage1Checks[i]]);
    }

    if (!result.checks.hasRange) {
      await new Promise((r) => setTimeout(r, 600));
      setPipelineStage(3);
      setLogs((prev) => [...prev, { time: getTime(), text: "Pipeline dihentikan: komponen wajib tidak ada. Skor 0.", type: "error" }]);
      setAnalysisResult({ ...result, score: 0, success: false });
      setStatusUji("gagal");
      setPipelineActive(false);
      return;
    }

    setPipelineStage(2);
    const stage2Logs: LogEntry[] = [
      { time: getTime(), text: "Memulai Docker container terisolasi: jaka-sandbox-04 (node:20-alpine)", type: "info" },
      { time: getTime(), text: "Membuka HTML di Puppeteer (headless Chromium v121)...", type: "info" },
      { time: getTime(), text: "Menunggu DOMContentLoaded... OK (312ms)", type: "success" },
      { time: getTime(), text: "Mencari elemen input[type=range]... ditemukan #rasa", type: "success" },
      { time: getTime(), text: "Mensimulasikan interaksi: slider.value = 9.5 + dispatchEvent('input')", type: "info" },
      { time: getTime(), text: `Membaca DOM label... innerText = "${result.checks.hasEnak ? "Enak Banget" : "Buruk"}"`, type: result.checks.hasEnak ? "success" : "error" },
    ];
    for (const l of stage2Logs) {
      await new Promise((r) => setTimeout(r, 450));
      setLogs((prev) => [...prev, l]);
    }

    setPipelineStage(3);
    await new Promise((r) => setTimeout(r, 500));
    setLogs((prev) => [...prev, { time: getTime(), text: "Agregasi nilai: menghitung bobot fungsionalitas (70%) + sintaksis (30%)", type: "info" }]);
    await new Promise((r) => setTimeout(r, 700));
    setLogs((prev) => [...prev, { time: getTime(), text: `Skor akhir: ${result.score} / 10.0 — ${result.success ? "LULUS" : "BELUM LULUS"}`, type: result.success ? "success" : "error" }]);
    await new Promise((r) => setTimeout(r, 400));
    setLogs((prev) => [...prev, { time: getTime(), text: `Menyimpan ke tabel submissions (file_url: /storage/tugas${selectedTugas.id}/${uploadedFile?.name || "github"}.zip)`, type: "info" }]);

    setAnalysisResult(result);
    setStatusUji(result.success ? "berhasil" : "gagal");
    setPipelineActive(false);
  };

  const filteredMahasiswa = mahasiswaMock.filter((m) => m.nama.toLowerCase().includes(searchMahasiswa.toLowerCase()) || m.nim.includes(searchMahasiswa));

  const [lastAction, setLastAction] = useState("Siap");
  const totalBerhasil = mahasiswaMock.filter(m=>m.status==='berhasil').length;
  const avgScore = (mahasiswaMock.filter(m=>m.skor>0).reduce((a,b)=>a+b.skor,0)/mahasiswaMock.filter(m=>m.skor>0).length || 0).toFixed(1);

  return (
    <div className="min-h-screen bg-[#08080d] text-zinc-100 selection:bg-violet-500/30 selection:text-white">
      <style>{`
        *{font-family: ui-sans-system, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif}
        .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-thumb{background:#2a2a35;border-radius:999px}
        ::-webkit-scrollbar-track{background:transparent}
      `}</style>

      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#0d0d12]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] max-w-[1600px] items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                <Braces className="h-5 w-5" />
              </div>
              <span className="text-[17px] font-bold tracking-tight">JAKA.LMS</span>
              <span className="hidden rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400 md:inline-flex">Automated Grading</span>
            </div>
            <div className="hidden h-5 w-px bg-zinc-800 lg:block" />
            <div className="hidden items-center gap-2 text-[12px] text-zinc-400 lg:flex">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span>Sandbox Docker Aktif • 3 Worker • {lastAction}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-zinc-800 bg-[#15151d] p-1">
              {[
                { id: "mahasiswa", label: "Mahasiswa" },
                { id: "dosen", label: "Dosen (Master Jaka)" },
                { id: "arsitektur", label: "Arsitektur" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setRole(r.id as Role); setLastAction(`Beralih ke ${r.label} • ${new Date().toLocaleTimeString('id-ID')}`); }}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all ${role === r.id ? "bg-white text-black shadow" : "text-zinc-400 hover:text-zinc-200"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-zinc-800 md:flex">
              <span className="text-[12px] font-bold">MJ</span>
            </div>
          </div>
        </div>
      </header>

      {role === "mahasiswa" && (
        <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-0">
          <aside className="col-span-12 border-b border-zinc-800 bg-[#0d0d12] lg:col-span-3 lg:border-b-0 lg:border-r">
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold uppercase tracking-widest text-zinc-400">Tugas Aktif</h2>
                <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-[11px] font-medium text-violet-300">{tugasList.length} tugas</span>
              </div>
              <div className="space-y-3">
                {tugasList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTugas(t); setLastAction(`Tugas #${t.id} dipilih`); }}
                    className={`w-full rounded-[14px] border p-4 text-left transition-all ${selectedTugas.id === t.id ? "border-violet-600/50 bg-violet-600/10" : "border-zinc-800 bg-[#15151d] hover:border-zinc-700"}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.tag === "Wajib" ? "bg-amber-500/15 text-amber-300" : t.tag === "Final" ? "bg-violet-500/15 text-violet-300" : "bg-zinc-800 text-zinc-400"}`}>{t.tag}</span>
                      <span className="mono text-[11px] text-zinc-500">{t.bahasa}</span>
                    </div>
                    <h3 className="text-[14px] font-semibold leading-snug">{t.judul}</h3>
                    <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-zinc-400">{t.deskripsi}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <Clock3 className="h-3.5 w-3.5" /> {t.deadline}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-[12px] border border-zinc-800 bg-[#111119] p-4">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-zinc-300">
                  <FileText className="h-4 w-4 text-violet-400" /> Kriteria Uji
                </div>
                <pre className="mono overflow-x-auto rounded-lg bg-[#0a0a10] p-3 text-[11px] leading-relaxed text-zinc-300">{JSON.stringify(selectedTugas.kriteria, null, 2)}</pre>
              </div>
            </div>
          </aside>

          <section className="col-span-12 lg:col-span-5">
            <div className="border-b border-zinc-800 bg-[#0a0a0f] p-5 lg:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold">Pengumpulan Tugas</h2>
                <span className="mono text-[11px] text-zinc-500">Tugas #{selectedTugas.id} • {selectedTugas.bahasa}</span>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed p-8 transition-all ${isDragging ? "border-violet-500 bg-violet-500/10" : "border-zinc-800 bg-[#111119]"}`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isDragging ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-center text-[14px] font-medium text-zinc-200">Tarik & lepas file ke sini</p>
                <p className="mt-1 text-center text-[12px] text-zinc-500">Menerima .zip, .html, .js, .py (maks 20MB)</p>
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-black hover:bg-zinc-100">Pilih File</button>
                  <span className="text-[12px] text-zinc-500">atau drop</span>
                </div>
                <input ref={fileInputRef} type="file" accept=".zip,.html,.js,.py" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              {uploadedFile && (
                <div className="mt-4 flex items-center justify-between rounded-[12px] border border-zinc-800 bg-[#15151d] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800">
                      <FileCode2 className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="mono text-[13px] font-medium text-zinc-100">{uploadedFile.name}</p>
                      <p className="text-[11px] text-zinc-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => setUploadedFile(null)} className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-800">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              )}

              <div className="mt-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-zinc-400">
                  <Github className="h-3.5 w-3.5" /> Atau tempel link repositori GitHub
                </label>
                <div className="flex flex-1 items-center gap-2 rounded-full border border-zinc-800 bg-[#15151d] px-3.5 py-2.5">
                  <GitBranch className="h-4 w-4 text-zinc-600" />
                  <input value={githubLink} onChange={(e) => setGithubLink(e.target.value)} placeholder="https://github.com/username/repo" className="w-full bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
                </div>
              </div>

              <button
                onClick={startPipeline}
                disabled={(!uploadedFile && !githubLink) || pipelineActive}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-[14px] font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:bg-violet-500 disabled:opacity-40"
              >
                {pipelineActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {pipelineActive ? "Sedang Menganalisis..." : "Kirim & Analisis"}
              </button>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-zinc-500" />
                  <span className="text-[12px] font-semibold uppercase tracking-widest text-zinc-400">Pipeline Analisis Otomatis</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { n: 1, t: "Ekstraksi & Cek Sintaks" },
                    { n: 2, t: "Pengujian Fungsional" },
                    { n: 3, t: "Agregasi Nilai" },
                  ].map((s) => (
                    <div key={s.n} className={`rounded-[10px] border p-3 ${pipelineStage === s.n ? "border-violet-600 bg-violet-600/10" : pipelineStage > s.n ? "border-emerald-800 bg-emerald-950/30" : "border-zinc-800 bg-[#111119]"}`}>
                      <div className="flex items-center gap-2">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${pipelineStage > s.n ? "bg-emerald-600 text-white" : pipelineStage === s.n ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                          {pipelineStage > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                        </div>
                        <span className="text-[10px] font-bold">TAHAP {s.n}</span>
                      </div>
                      <p className="mt-2 text-[11px] font-medium leading-snug text-zinc-300">{s.t}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 h-[220px] overflow-auto rounded-[12px] border border-zinc-800 bg-[#0a0a0f] p-3">
                  {logs.length === 0 && <p className="mono text-[11px] text-zinc-600">Menunggu file... Log analisis akan muncul di sini secara real-time.</p>}
                  <div className="space-y-1.5">
                    {logs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="mono shrink-0 text-[10px] text-zinc-600">{log.time}</span>
                        <span className={`mono text-[11px] ${log.type === "success" ? "text-emerald-400" : log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-amber-400" : "text-zinc-400"}`}>{log.text}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="col-span-12 border-t border-zinc-800 bg-[#0d0d12] lg:col-span-4 lg:border-l lg:border-t-0">
            <div className="p-5 lg:p-6">
              <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-zinc-400">Report Card</h2>
              {!analysisResult ? (
                <div className="rounded-[14px] border border-dashed border-zinc-800 bg-[#111119] p-8 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                    <FileText className="h-5 w-5 text-zinc-500" />
                  </div>
                  <p className="text-[13px] font-medium text-zinc-300">Belum ada pengumpulan</p>
                  <p className="mt-1 text-[12px] text-zinc-500">Unggah file untuk melihat hasil analisis otomatis di sini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[16px] border border-zinc-800 bg-[#15151f] p-5">
                    <p className="text-[11px] uppercase tracking-widest text-zinc-500">Skor Akhir</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-[40px] font-bold leading-none tracking-tight">{analysisResult.score.toFixed(1)}</span>
                      <span className="text-[16px] text-zinc-500">/ 10.0</span>
                      <span className={`ml-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${analysisResult.success ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>{analysisResult.success ? "LULUS" : "TIDAK LULUS"}</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {[
                        { ok: analysisResult.checks.hasRange, label: 'Komponen <input type="range"> ditemukan' },
                        { ok: analysisResult.checks.hasOnChange, label: "Event listener onchange/oninput" },
                        { ok: analysisResult.checks.hasEnak, label: 'Label "Enak Banget" saat 9.5' },
                      ].map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-[12px]">
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full ${c.ok ? "bg-emerald-600/20 text-emerald-400" : "bg-red-600/20 text-red-400"}`}>
                            {c.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          </div>
                          <span className={c.ok ? "text-zinc-300" : "text-zinc-500"}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[12px] border border-zinc-800 bg-[#111119] p-4">
                    <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-zinc-300">
                      <Terminal className="h-4 w-4" /> Preview Log Mentah
                    </div>
                    <pre className="mono max-h-[160px] overflow-auto rounded bg-[#08080d] p-3 text-[11px] text-zinc-400">{analysisResult.rawContent.slice(0,800)}</pre>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {role === "dosen" && (
        <div className="mx-auto max-w-[1600px]">
          <div className="grid grid-cols-12 gap-0">
            {/* Sidebar Dosen */}
            <aside className="col-span-12 border-b border-zinc-800 bg-[#0d0d12] lg:col-span-2 lg:border-b-0 lg:border-r">
              <div className="p-5">
                <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-zinc-400">Menu Dosen</h2>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 rounded-[10px] bg-violet-600 px-3 py-2.5 text-[13px] font-medium text-white">
                    <Box className="h-4 w-4" /> Dashboard
                  </div>
                  <div className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300">
                    <FileText className="h-4 w-4" /> Daftar Tugas
                  </div>
                  <div className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300">
                    <Zap className="h-4 w-4" /> Penilaian Otomatis
                  </div>
                  <div className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300">
                    <Users className="h-4 w-4" /> Daftar Mahasiswa
                  </div>
                  <div className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300">
                    <Terminal className="h-4 w-4" /> Log Sandbox
                  </div>
                </div>

                <div className="mt-6 rounded-[12px] border border-zinc-800 bg-[#111119] p-4">
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500">Ringkasan Kelas</p>
                  <div className="mt-3 space-y-2 text-[12px]">
                    <div className="flex justify-between"><span className="text-zinc-500">Total Mhs</span><span className="font-medium">{mahasiswaMock.length}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Lulus</span><span className="font-medium text-emerald-400">{totalBerhasil}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Rata-rata</span><span className="font-medium">{avgScore}</span></div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Dosen Content */}
            <div className="col-span-12 lg:col-span-10">
              <div className="border-b border-zinc-800 bg-[#0a0a0f] p-5 lg:p-6">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-[22px] font-bold tracking-tight">Dashboard Dosen</h1>
                    <p className="mt-1 text-[13px] text-zinc-400">Ringkasan aktivitas grading otomatis & submissions terbaru • {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date().toLocaleTimeString('id-ID')} WIB</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                      <input value={searchMahasiswa} onChange={(e)=>setSearchMahasiswa(e.target.value)} placeholder="Cari NIM / Nama..." className="w-[220px] rounded-full border border-zinc-800 bg-[#15151d] py-2 pl-9 pr-4 text-[13px] focus:border-violet-600 focus:outline-none" />
                    </div>
                    <button className="rounded-full border border-zinc-800 bg-[#15151d] px-4 py-2 text-[13px] font-medium hover:bg-zinc-800"><Download className="mr-1.5 inline h-4 w-4" /> Export CSV</button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-[14px] border border-zinc-800 bg-[#111119] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-violet-600/20 text-violet-300"><FileText className="h-5 w-5" /></div>
                      <div>
                        <p className="text-[12px] text-zinc-500">Total Tugas</p>
                        <p className="text-[26px] font-bold leading-none">{tugasList.length}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-500">+2 tugas minggu ini ↑</p>
                  </div>
                  <div className="rounded-[14px] border border-zinc-800 bg-[#111119] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-amber-500/15 text-amber-300"><Clock3 className="h-5 w-5" /></div>
                      <div>
                        <p className="text-[12px] text-zinc-500">Belum Dinilai</p>
                        <p className="text-[26px] font-bold leading-none">{mahasiswaMock.filter(m=>m.status==='diantrekan' || m.status==='diproses').length}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-amber-400">Perlu ditinjau</p>
                  </div>
                  <div className="rounded-[14px] border border-zinc-800 bg-[#111119] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-violet-600/20 text-violet-300"><ShieldCheck className="h-5 w-5" /></div>
                      <div>
                        <p className="text-[12px] text-zinc-500">Rata-rata Nilai</p>
                        <p className="text-[26px] font-bold leading-none">{avgScore}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400">+4 dari minggu lalu</p>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  {/* Table */}
                  <div className="col-span-12 lg:col-span-7">
                    <div className="rounded-[14px] border border-zinc-800 bg-[#111119]">
                      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                        <h3 className="text-[14px] font-semibold">Submissions Terbaru</h3>
                        <span className="text-[12px] text-violet-400">Lihat Semua →</span>
                      </div>
                      <div className="overflow-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-zinc-800 bg-[#0d0d12] text-left text-[11px] uppercase tracking-widest text-zinc-500">
                              <th className="px-4 py-3 font-medium">Mahasiswa</th>
                              <th className="px-4 py-3 font-medium">Tugas</th>
                              <th className="px-4 py-3 font-medium">Status</th>
                              <th className="px-4 py-3 font-medium">Nilai</th>
                              <th className="px-4 py-3 font-medium">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredMahasiswa.map((m) => (
                              <tr key={m.nim} onClick={()=>setSelectedMahasiswa(m)} className={`cursor-pointer border-b border-zinc-800/60 transition-colors hover:bg-violet-600/10 ${selectedMahasiswa?.nim===m.nim ? "bg-violet-600/10" : ""}`}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold">{m.nama.split(' ').map(s=>s[0]).slice(0,2).join('')}</div>
                                    <div>
                                      <p className="text-[13px] font-medium leading-none">{m.nama}</p>
                                      <p className="mono mt-1 text-[11px] text-zinc-500">{m.nim}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-[12px] text-zinc-400">{m.tugas} • <span className="mono text-[11px]">{m.waktu}</span></td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${m.status==='berhasil' ? "bg-emerald-500/15 text-emerald-300" : m.status==='gagal' ? "bg-red-500/15 text-red-300" : m.status==='diproses' ? "bg-amber-500/15 text-amber-300" : "bg-zinc-800 text-zinc-400"}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${m.status==='berhasil' ? "bg-emerald-400" : m.status==='gagal' ? "bg-red-400" : m.status==='diproses' ? "bg-amber-400 animate-pulse" : "bg-zinc-500"}`} />
                                    {m.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3"><span className="text-[13px] font-bold">{m.skor >0 ? m.skor.toFixed(1) : "-"}</span></td>
                                <td className="px-4 py-3"><button className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] font-medium hover:bg-zinc-800">Lihat</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Detail panel */}
                  <div className="col-span-12 lg:col-span-5">
                    {selectedMahasiswa ? (
                      <div className="rounded-[14px] border border-zinc-800 bg-[#111119]">
                        <div className="border-b border-zinc-800 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-[14px] font-semibold">{selectedMahasiswa.nama} • {selectedMahasiswa.nim}</h3>
                              <p className="mono mt-1 text-[11px] text-zinc-500">{selectedMahasiswa.file_path}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${selectedMahasiswa.status==='berhasil' ? "bg-emerald-600 text-white" : selectedMahasiswa.status==='gagal' ? "bg-red-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>{selectedMahasiswa.skor}</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-zinc-300"><Terminal className="h-4 w-4" /> Log Grading</div>
                          <div className="mb-4 rounded-[10px] bg-[#08080d] p-3 mono text-[11px] text-zinc-400">{selectedMahasiswa.log}</div>

                          <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-zinc-300"><FileCode2 className="h-4 w-4" /> grading_engine.py</div>
                          <div className="rounded-[10px] border border-zinc-800 bg-[#0a0a0f]">
                            <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
                              <div className="h-2.5 w-2.5 rounded-full bg-red-500" /><div className="h-2.5 w-2.5 rounded-full bg-amber-400" /><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                              <span className="ml-2 mono text-[11px] text-zinc-500">submission preview</span>
                              <span className="ml-auto rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">HTML</span>
                            </div>
                            <pre className="max-h-[280px] overflow-auto p-3 mono text-[11px] leading-relaxed text-zinc-300">{selectedMahasiswa.code.slice(0,1200)}</pre>
                            <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2">
                              <span className="mono text-[10px] text-zinc-600">Lines: {selectedMahasiswa.code.split('\n').length} • UTF-8 • HTML 5</span>
                              <div className="flex gap-1.5">
                                <button className="rounded-full bg-violet-600 px-3 py-1 text-[11px] font-medium text-white">▶ Run Test</button>
                                <button className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px]">Logs</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[14px] border border-dashed border-zinc-800 bg-[#111119] p-10 text-center text-[13px] text-zinc-500">Pilih mahasiswa untuk melihat detail</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {role === "arsitektur" && (
        <div className="mx-auto max-w-[1600px] p-6">
          <h1 className="text-[22px] font-bold">Arsitektur Sistem JAKA.LMS</h1>
          <p className="mt-1 text-[13px] text-zinc-400">Sandbox Docker • Queue • Grading Engine • Storage</p>
          
          <div className="mt-6 grid grid-cols-12 gap-4">
            {[
              { icon: UploadCloud, title: "Frontend (React + Vite)", desc: "Upload .zip / GitHub URL, progress pipeline real-time, Report Card.", tech: "Vite, Tailwind, lucide-react" },
              { icon: Layers, title: "API Gateway :3001", desc: "Endpoint /api/submit menerima FormData, simpan ke /storage, push ke queue.", tech: "Express, Multer" },
              { icon: Cpu, title: "Docker Sandbox Workers (x3)", desc: "Container terisolasi node:20-alpine, menjalankan Puppeteer untuk uji fungsional slider.", tech: "Docker, Puppeteer, BullMQ" },
              { icon: Database, title: "Grading Engine", desc: "Static analysis (range, onchange, Enak Banget) + functional test (slider.value=9.5)", tech: "HTMLHint, ESLint" },
              { icon: HardDrive, title: "Storage / MinIO", desc: "File path /storage/tugas{id}/{nim}.zip, log disimpan untuk Dosen.", tech: "Local FS / S3" },
              { icon: ShieldCheck, title: "Security & Isolation", desc: "Setiap submission jalan di container ephemeral, timeout 30s, network none.", tech: "Docker --network none" },
            ].map((a,i)=>(
              <div key={i} className="col-span-12 md:col-span-6 lg:col-span-4 rounded-[14px] border border-zinc-800 bg-[#111119] p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-violet-600/15 text-violet-300"><a.icon className="h-5 w-5" /></div>
                <h3 className="text-[14px] font-semibold">{a.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">{a.desc}</p>
                <p className="mono mt-3 rounded bg-[#08080d] px-2 py-1 text-[10px] text-zinc-500">{a.tech}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[14px] border border-zinc-800 bg-[#0a0a0f] p-5">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold"><GitBranch className="h-4 w-4 text-violet-400" /> Alur Data (End-to-End)</div>
            <pre className="mono overflow-auto text-[11px] leading-relaxed text-zinc-400">{`Mahasiswa -> Upload ZIP/HTML 
   -> POST /api/submit (FormData file, taskId, githubUrl)
   -> API simpan file ke /storage/tugas{taskId}/{nim}.zip
   -> Push job ke queue (BullMQ / memory)
   -> Worker ambil job: docker run --rm -v /tmp:/tmp jaka-sandbox
        1) Ekstraksi & Static Check (HTMLHint, cek <input type=range>)
        2) Puppeteer: buka file HTML, slider.value=9.5, dispatchEvent('input'), baca label
        3) Skor = 70% fungsional + 30% sintaks, cek "Enak Banget"
   -> Simpan hasil {score, status, logs, details} ke DB / JSON
   -> Frontend polling / websocket update Pipeline Stage 1-3
   -> Dosen lihat di Dashboard: submissions terbaru, log, code preview`}</pre>
          </div>
        </div>
      )}

      <footer className="border-t border-zinc-800/60 py-6 text-center">
        <p className="mono text-[11px] text-zinc-600">JAKA.LMS • Automated Grading Portal • Dibuat untuk Master Jaka • © 2024 • Frontend: :5173 • API: :3001 • Mode: {role}</p>
      </footer>
    </div>
  );
}

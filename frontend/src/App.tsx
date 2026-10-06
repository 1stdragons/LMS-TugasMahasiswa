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

    let fileContent = "";
    if (uploadedFile) {
      fileContent = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = (ev) => res((ev.target?.result as string) || "");
        reader.onerror = () => res("");
        reader.readAsText(uploadedFile);
      });
    } else if (githubLink) {
      fileContent = `<input type="range" id="s"/><script>document.getElementById('s').addEventListener('input', e=>{ if(e.target.value>=9.5) document.body.innerText='Enak Banget'})</script> // from ${githubLink}`;
    }

    // if zip or unreadable, simulate containing some content based on filename hint
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

    // Simulate streaming
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

    // Stage 2
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

    // Stage 3
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

  return (
    <div className="min-h-screen bg-[#08080d] text-zinc-100 selection:bg-violet-500/30 selection:text-white" style={{ paddingTop: "var(--safe-area-inset-top)" }}>
      <style>{`
        *{font-family: ui-sans-system, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif}
        .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-thumb{background:#2a2a35;border-radius:999px}
        ::-webkit-scrollbar-track{background:transparent}
      `}</style>

      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#0d0d12]/90 backdrop-blur-xl" style={{ top: "var(--safe-area-inset-top)" }}>
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
              <span id="header-feedback">Sandbox Docker Aktif • 3 Worker • {lastAction}</span>
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
                  type="button"
                  aria-pressed={role === r.id}
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

      {/* Mahasiswa UI */}
      {role === "mahasiswa" && (
        <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-0 lg:gap-0">
          {/* Left - Tugas List */}
          <aside className="col-span-12 border-b border-zinc-800 bg-[#0d0d12] lg:col-span-3 lg:border-b-0 lg:border-r">
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold uppercase tracking-widest text-zinc-400">Tugas Aktif</h2>
                <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-[11px] font-medium text-violet-300">{tugasList.length} tugas</span>
              </div>
              <div id="action-feedback" className="mb-3 rounded-full border border-zinc-800 bg-[#15151d] px-3 py-1.5 text-[11px] text-zinc-400">
                <span className="mono">{lastAction}</span>
              </div>
              <div className="space-y-3">
                {tugasList.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    data-tugas-id={t.id}
                    aria-selected={selectedTugas.id === t.id}
                    onClick={(e) => {
                      const now = Date.now();
                      const btn = e.currentTarget as HTMLButtonElement;
                      btn.setAttribute('data-last-click', String(now));
                      btn.setAttribute('aria-selected', 'true');
                      const fb = document.getElementById('action-feedback');
                      if (fb) fb.textContent = `Tugas #${t.id} dipilih: ${t.judul} • ${now}`;
                      const fb2 = document.getElementById('header-feedback');
                      if (fb2) fb2.textContent = `Tugas #${t.id} • ${now}`;
                      setSelectedTugas(t);
                      setLastAction(`Tugas #${t.id} dipilih: ${t.judul} • ${now}`);
                    }}
                    className={`group w-full rounded-[14px] border p-4 text-left transition-all ${selectedTugas.id === t.id ? "border-violet-600/50 bg-violet-600/10 shadow-[0_0_0_1px_rgba(124,58,237,0.2)]" : "border-zinc-800 bg-[#15151d] hover:border-zinc-700 hover:bg-[#1a1a25]"}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${t.tag === "Wajib" ? "bg-amber-500/15 text-amber-300" : t.tag === "Final" ? "bg-violet-500/15 text-violet-300" : "bg-zinc-800 text-zinc-400"}`}>{t.tag}</span>
                      <span className="mono text-[11px] text-zinc-500">{t.bahasa}</span>
                    </div>
                    <h3 className={`text-[14px] font-semibold leading-snug ${selectedTugas.id === t.id ? "text-white" : "text-zinc-100"}`}>{t.judul}</h3>
                    <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-zinc-400">{t.deskripsi}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <Clock3 className="h-3.5 w-3.5" /> {t.deadline}
                    </div>
                    <div className="mt-2 text-[10px] text-zinc-500">ID:{t.id} • klik untuk detail → {selectedTugas.id === t.id ? `✓ aktif ${lastAction.slice(-4)}` : 'pilih'}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-[12px] border border-zinc-800 bg-[#111119] p-4">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-zinc-300">
                  <FileText className="h-4 w-4 text-violet-400" /> Kriteria Uji
                </div>
                <pre className="mono overflow-x-auto rounded-lg bg-[#0a0a10] p-3 text-[11px] leading-relaxed text-zinc-300">{JSON.stringify(selectedTugas.kriteria, null, 2)}</pre>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <div className="h-1 w-1 rounded-full bg-zinc-600" /> Min: {selectedTugas.kriteria.min_score}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <div className="h-1 w-1 rounded-full bg-zinc-600" /> Max: {selectedTugas.kriteria.max_score}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedTugas.kriteria.expected_labels.map((l) => (
                      <span key={l} className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Center - Uploader */}
          <section className="col-span-12 lg:col-span-5 xl:col-span-5">
            <div className="border-b border-zinc-800 bg-[#0a0a0f] p-5 lg:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold">Pengumpulan Tugas</h2>
                <span className="mono text-[11px] text-zinc-500">Tugas #{selectedTugas.id} • {selectedTugas.bahasa}</span>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed p-8 transition-all ${isDragging ? "border-violet-500 bg-violet-500/10" : "border-zinc-800 bg-[#111119] hover:border-zinc-700 hover:bg-[#14141f]"}`}
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

              {/* File Info */}
              {uploadedFile && (
                <div className="mt-4 flex items-center justify-between rounded-[12px] border border-zinc-800 bg-[#15151d] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800">
                      <FileCode2 className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="mono text-[13px] font-medium text-zinc-100">{uploadedFile.name}</p>
                      <p className="text-[11px] text-zinc-500">{(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type || "text/plain"}</p>
                    </div>
                  </div>
                  <button onClick={() => setUploadedFile(null)} className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* GitHub Link */}
              <div className="mt-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-zinc-400">
                  <Github className="h-3.5 w-3.5" /> Atau tempel link repositori GitHub
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-full border border-zinc-800 bg-[#15151d] px-3.5 py-2.5">
                    <GitBranch className="h-4 w-4 text-zinc-600" />
                    <input value={githubLink} onChange={(e) => setGithubLink(e.target.value)} placeholder="https://github.com/username/repo" className="w-full bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={startPipeline}
                disabled={(!uploadedFile && !githubLink) || pipelineActive}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-[14px] font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] transition-all hover:bg-violet-500 disabled:opacity-40 disabled:shadow-none"
              >
                {pipelineActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {pipelineActive ? "Sedang Menganalisis..." : "Kirim & Analisis"}
              </button>

              {/* Progress Indicator */}
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-zinc-500" />
                  <span className="text-[12px] font-semibold uppercase tracking-widest text-zinc-400">Pipeline Analisis Otomatis</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { n: 1, t: "Ekstraksi & Cek Sintaks", icon: Search },
                    { n: 2, t: "Pengujian Fungsional", icon: Cpu },
                    { n: 3, t: "Agregasi Nilai", icon: Zap },
                  ].map((s) => {
                    const active = pipelineStage === s.n;
                    const done = pipelineStage > s.n;
                    return (
                      <div key={s.n} className={`rounded-[10px] border p-3 transition-all ${active ? "border-violet-600 bg-violet-600/10" : done ? "border-emerald-800 bg-emerald-950/30" : "border-zinc-800 bg-[#111119]"}`}>
                        <div className="flex items-center gap-2">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${active ? "bg-violet-600 text-white" : done ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                            {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <s.icon className="h-4 w-4" />}
                          </div>
                          <span className="text-[10px] font-bold">TAHAP {s.n}</span>
                        </div>
                        <p className="mt-2 text-[11px] font-medium leading-snug text-zinc-300">{s.t}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 h-[220px] overflow-auto rounded-[12px] border border-zinc-800 bg-[#0a0a0f] p-3">
                  {logs.length === 0 && <p className="mono text-[11px] text-zinc-600">Menunggu file... Log analisis akan muncul di sini secara real-time.</p>}
                  <div className="space-y-1.5">
                    {logs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="mono shrink-0 text-[10px] text-zinc-600">{log.time}</span>
                        <span className={`mono text-[11px] leading-relaxed ${log.type === "success" ? "text-emerald-400" : log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-amber-400" : "text-zinc-400"}`}>{log.text}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right - Report Card */}
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
                <>
                  <div className="rounded-[16px] border border-zinc-800 bg-gradient-to-b from-[#15151f] to-[#111119] p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-zinc-500">Skor Akhir</p>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className={`text-[40px] font-bold leading-none tracking-tight ${analysisResult.success ? "text-white" : "text-zinc-300"}`}>{analysisResult.score.toFixed(1)}</span>
                          <span className="text-[16px] text-zinc-500">/ 10.0</span>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${statusUji === "berhasil" ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30" : statusUji === "gagal" ? "bg-red-500/15 text-red-300 ring-1 ring-red-500/30" : statusUji === "diproses" ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30" : "bg-zinc-800 text-zinc-400"}`}>{statusUji}</span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-[#0a0a0f] p-3 ring-1 ring-zinc-800">
                        <p className="text-[10px] uppercase text-zinc-500">Fungsionalitas</p>
                        <p className="mt-1 text-[13px] font-semibold text-zinc-200">{analysisResult.checks.hasEnak ? "100%" : analysisResult.checks.hasRange ? "45%" : "0%"}</p>
                      </div>
                      <div className="rounded-lg bg-[#0a0a0f] p-3 ring-1 ring-zinc-800">
                        <p className="text-[10px] uppercase text-zinc-500">Sintaksis</p>
                        <p className="mt-1 text-[13px] font-semibold text-zinc-200">{analysisResult.checks.hasUnclosed ? "60%" : "100%"}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {[
                        { ok: analysisResult.checks.hasRange, label: 'Komponen <input type="range"> ditemukan' },
                        { ok: analysisResult.checks.hasOnChange, label: "Event listener onchange/oninput" },
                        { ok: analysisResult.checks.hasEnak, label: 'Label berubah ke "Enak Banget" saat 9.5' },
                        { ok: !analysisResult.checks.hasUnclosed, label: "Tidak ada tag tidak tertutup" },
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

                  <div className="mt-4 rounded-[12px] border border-zinc-800 bg-[#111119]">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
                      <span className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-300">
                        <AlertTriangle className="h-4 w-4 text-amber-400" /> log_analisis
                      </span>
                      <span className="mono text-[10px] text-zinc-500">TEXT</span>
                    </div>
                    <div className="p-4">
                      <p className="mono text-[11px] leading-relaxed text-zinc-400">
                        {analysisResult.success ? "✅ Semua kriteria lolos. Slider berfungsi sesuai expected_labels. Puppeteer: label 9.5 terdeteksi sebagai 'Enak Banget'." : analysisResult.checks.hasRange ? "❌ Fungsionalitas gagal: label tidak berubah menjadi 'Enak Banget' saat nilai 9.5. Periksa logika if (value >= 9) { label = 'Enak Banget' }." : "❌ Komponen input range tidak ditemukan. Sistem menghentikan pengujian dan mencatat skor 0 dengan log: 'Komponen input range tidak ditemukan'."}
                      </p>
                      <div className="mt-4">
                        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Snippet terdampak</p>
                        <pre className="mono max-h-[200px] overflow-auto rounded-lg bg-[#08080c] p-3 text-[11px] leading-relaxed text-zinc-300 ring-1 ring-zinc-800">
                          {analysisResult.rawContent.slice(0, 600)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[12px] bg-violet-600/10 p-3 ring-1 ring-violet-600/20">
                    <p className="text-[11px] font-medium text-violet-300">Catatan Sistem</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-violet-200/70">File disimpan di Object Storage: <span className="mono text-violet-200">/storage/tugas{selectedTugas.id}/{uploadedFile?.name || "github.zip"}</span>. Database hanya menyimpan path, bukan file mentah.</p>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Dosen UI */}
      {role === "dosen" && (
        <div className="mx-auto max-w-[1600px] p-4 lg:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight">Dashboard Rekapitulasi • Master Jaka</h1>
              <p className="mt-1 text-[13px] text-zinc-400">Kelas IF-211 • {mahasiswaMock.length} mahasiswa • Tugas 1: Rating Slider • Deadline 28 Nov 2024</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-[#15151d] px-3 py-2">
                <Search className="h-4 w-4 text-zinc-500" />
                <input value={searchMahasiswa} onChange={(e) => setSearchMahasiswa(e.target.value)} placeholder="Cari NIM / Nama" className="w-[180px] bg-transparent text-[13px] placeholder:text-zinc-600 focus:outline-none" />
              </div>
              <div className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-2 text-[12px] font-medium text-emerald-300 ring-1 ring-emerald-500/20 md:flex">
                <div className="h-2 w-2 rounded-full bg-emerald-500" /> Auto-grading Aktif
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-7">
              <div className="overflow-hidden rounded-[14px] border border-zinc-800 bg-[#0f0f14]">
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
                  <span className="flex items-center gap-2 text-[13px] font-semibold"><Users className="h-4 w-4 text-zinc-500" /> Daftar Pengumpulan</span>
                  <span className="mono text-[11px] text-zinc-500">{filteredMahasiswa.length} baris • tabel submissions</span>
                </div>
                <div className="overflow-auto">
                  <table className="w-full min-w-[720px]">
                    <thead className="bg-[#111119] text-left text-[11px] uppercase tracking-widest text-zinc-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">NIM</th>
                        <th className="px-4 py-3 font-medium">Nama</th>
                        <th className="px-4 py-3 font-medium">Tugas</th>
                        <th className="px-4 py-3 font-medium">Waktu Kumpul</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Skor</th>
                        <th className="px-4 py-3 font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {filteredMahasiswa.map((m) => (
                        <tr
                          key={m.nim}
                          onClick={() => setSelectedMahasiswa(m)}
                          className={`cursor-pointer transition-colors ${selectedMahasiswa?.nim === m.nim ? "bg-violet-600/10" : "hover:bg-[#15151d]"}`}
                        >
                          <td className="mono px-4 py-3 text-[12px] font-medium text-zinc-300">{m.nim}</td>
                          <td className="px-4 py-3 text-[13px] font-medium text-zinc-100">{m.nama}</td>
                          <td className="px-4 py-3 text-[12px] text-zinc-400">{m.tugas}</td>
                          <td className="mono px-4 py-3 text-[11px] text-zinc-500">{m.waktu}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${m.status === "berhasil" ? "bg-emerald-500/15 text-emerald-300" : m.status === "gagal" ? "bg-red-500/15 text-red-300" : m.status === "diproses" ? "bg-amber-500/15 text-amber-300" : "bg-zinc-800 text-zinc-400"}`}>{m.status}</span>
                          </td>
                          <td className="px-4 py-3 text-[13px] font-semibold text-zinc-200">{m.skor > 0 ? `${m.skor}` : "-"}</td>
                          <td className="px-4 py-3">
                            <button className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-black hover:bg-zinc-200">Lihat</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-[12px] border border-zinc-800 bg-[#111119] p-4">
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500">Rata-rata Kelas</p>
                  <p className="mt-1 text-[22px] font-bold">6.4<span className="text-[14px] font-normal text-zinc-500"> /10</span></p>
                  <p className="mt-1 text-[11px] text-emerald-400">+0.8 dari tugas sebelumnya</p>
                </div>
                <div className="rounded-[12px] border border-zinc-800 bg-[#111119] p-4">
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500">Tepat Waktu</p>
                  <p className="mt-1 text-[22px] font-bold">75%</p>
                  <p className="mt-1 text-[11px] text-zinc-500">6 dari 8 mahasiswa</p>
                </div>
                <div className="rounded-[12px] border border-zinc-800 bg-[#111119] p-4">
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500">Gagal Uji</p>
                  <p className="mt-1 text-[22px] font-bold text-red-300">2</p>
                  <p className="mt-1 text-[11px] text-zinc-500">Perlu tinjauan manual</p>
                </div>
              </div>
            </div>

            {/* Detail Visual */}
            <div className="col-span-12 lg:col-span-5">
              {selectedMahasiswa ? (
                <div className="rounded-[14px] border border-zinc-800 bg-[#0f0f14]">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold">Detail Visual • {selectedMahasiswa.nama}</span>
                      <span className="mono rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{selectedMahasiswa.nim}</span>
                    </div>
                    <button className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#1a1a25] px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800">
                      <Download className="h-3.5 w-3.5" /> Unduh Kode Asli
                    </button>
                  </div>

                  <div className="grid grid-cols-2">
                    {/* Source */}
                    <div className="border-r border-zinc-800">
                      <div className="flex items-center gap-2 border-b border-zinc-800 bg-[#111119] px-4 py-2">
                        <FileCode2 className="h-4 w-4 text-violet-400" />
                        <span className="text-[11px] font-medium text-zinc-300">Source Code Mahasiswa</span>
                      </div>
                      <div className="relative">
                        <pre className="mono h-[420px] overflow-auto p-4 text-[11px] leading-relaxed text-zinc-300">{selectedMahasiswa.code}</pre>
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0f0f14] to-transparent" />
                      </div>
                    </div>
                    {/* Uji */}
                    <div>
                      <div className="flex items-center gap-2 border-b border-zinc-800 bg-[#111119] px-4 py-2">
                        <Cpu className="h-4 w-4 text-emerald-400" />
                        <span className="text-[11px] font-medium text-zinc-300">Hasil Uji Parameter</span>
                      </div>
                      <div className="space-y-3 p-4">
                        {[
                          { label: "Komponen range ditemukan", ok: !selectedMahasiswa.code.includes("type=\"text\""), desc: "Mencari <input type=\"range\">" },
                          { label: "Event listener onchange", ok: selectedMahasiswa.code.includes("addEventListener"), desc: "oninput / onchange" },
                          { label: 'Label berubah ke "Enak Banget" saat 9.5', ok: selectedMahasiswa.code.includes("Enak Banget"), desc: "Puppeteer: value=9.5" },
                          { label: "Tag HTML seimbang", ok: (selectedMahasiswa.code.match(/<div/g) || []).length === (selectedMahasiswa.code.match(/<\/div>/g) || []).length, desc: "HTMLHint" },
                        ].map((c, i) => (
                          <div key={i} className="flex gap-2.5">
                            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.ok ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{c.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}</div>
                            <div>
                              <p className={`text-[12px] font-medium leading-tight ${c.ok ? "text-zinc-200" : "text-zinc-400"}`}>{c.label}</p>
                              <p className="mono mt-0.5 text-[10px] text-zinc-500">{c.desc} • {c.ok ? "✓ lolos" : "✗ gagal"}</p>
                            </div>
                          </div>
                        ))}

                        <div className="mt-4 rounded-lg border border-zinc-800 bg-[#08080c] p-3">
                          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                            <Box className="h-3.5 w-3.5" /> Docker Sandbox Log
                          </div>
                          <div className="mono space-y-1 text-[10px] leading-relaxed text-zinc-500">
                            <p><span className="text-zinc-600">$</span> docker run --rm -m 512m --cpus 0.5 jaka-sandbox</p>
                            <p className="text-emerald-400">✔ container isolated (no network)</p>
                            <p>✔ {selectedMahasiswa.file_path} mounted ro</p>
                            <p className={selectedMahasiswa.status === "gagal" ? "text-red-400" : "text-zinc-400"}>{selectedMahasiswa.log}</p>
                            <p className="text-zinc-600">exit code: {selectedMahasiswa.status === "berhasil" ? "0" : "1"} • 1.2s</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-full bg-zinc-900 px-3 py-2 ring-1 ring-zinc-800">
                          <span className="text-[11px] text-zinc-500">skor_otomatis</span>
                          <span className="mono text-[13px] font-bold text-white">{selectedMahasiswa.skor} / 10</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800 bg-[#111119] px-4 py-2.5">
                    <span className="mono text-[10px] text-zinc-500">file_url: {selectedMahasiswa.file_path} • Object Storage S3</span>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> terisolasi</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-[14px] border border-dashed border-zinc-800 bg-[#0f0f14] p-12 text-center text-zinc-500">Pilih mahasiswa untuk melihat detail visual</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Arsitektur */}
      {role === "arsitektur" && (
        <div className="mx-auto max-w-[1200px] p-4 lg:p-8">
          <div className="mb-8">
            <h1 className="text-[28px] font-bold tracking-tight">Arsitektur Sistem JAKA.LMS</h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-zinc-400">Platform pengumpulan dan analisis otomatis menggunakan pemisahan Object Storage untuk file fisik dan Database Relasional untuk nilai. Semua eksekusi kode mahasiswa dijalankan dalam Docker container terisolasi untuk keamanan.</p>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Schema */}
            <div className="col-span-12 lg:col-span-7">
              <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-widest text-zinc-400"><Database className="h-4 w-4" /> Database Relasional (PostgreSQL)</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  {
                    name: "users",
                    color: "violet",
                    cols: [
                      { k: "id", v: "PK • UUID" },
                      { k: "nama", v: "VARCHAR" },
                      { k: "nim", v: "VARCHAR • UNIQUE" },
                      { k: "role", v: "ENUM('dosen','mahasiswa')" },
                    ],
                  },
                  {
                    name: "tugas",
                    color: "blue",
                    cols: [
                      { k: "id", v: "PK" },
                      { k: "judul", v: "VARCHAR" },
                      { k: "kriteria_uji", v: "JSON" },
                      { k: "deadline", v: "DATETIME" },
                    ],
                  },
                  {
                    name: "submissions",
                    color: "emerald",
                    cols: [
                      { k: "id", v: "PK" },
                      { k: "tugas_id", v: "FK → tugas.id" },
                      { k: "user_id", v: "FK → users.id" },
                      { k: "file_url", v: "VARCHAR • S3 path" },
                      { k: "status_uji", v: "ENUM('diantrekan','diproses','berhasil','gagal')" },
                      { k: "skor_akhir", v: "DECIMAL 3,1" },
                      { k: "log_analisis", v: "TEXT" },
                      { k: "dikirim_pada", v: "TIMESTAMP" },
                    ],
                  },
                ].map((t) => (
                  <div key={t.name} className="rounded-[14px] border border-zinc-800 bg-[#111119]">
                    <div className={`flex items-center justify-between border-b border-zinc-800 px-4 py-3 ${t.color === "violet" ? "bg-violet-600/10" : t.color === "blue" ? "bg-blue-600/10" : "bg-emerald-600/10"}`}>
                      <span className="mono text-[13px] font-bold text-white">{t.name}</span>
                      <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-zinc-400">TABLE</span>
                    </div>
                    <div className="p-3">
                      {t.cols.map((c) => (
                        <div key={c.k} className="flex items-start justify-between gap-2 border-b border-zinc-800/60 py-2 last:border-0">
                          <span className="mono text-[11px] font-medium text-zinc-200">{c.k}</span>
                          <span className="mono text-right text-[10px] text-zinc-500">{c.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[14px] border border-zinc-800 bg-[#0f0f14] p-5">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-semibold"><Layers className="h-4 w-4 text-violet-400" /> Alur Pipeline Analisis</h4>
                <div className="flex items-center gap-2 overflow-auto">
                  {[
                    "Mahasiswa Upload",
                    "Ekstraksi & Cek Sintaks (Static)",
                    "Pengujian Fungsional (Puppeteer)",
                    "Agregasi Nilai & Save",
                  ].map((step, i) => (
                    <React.Fragment key={step}>
                      <div className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] text-zinc-300">{step}</div>
                      {i < 3 && <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-[11px]">
                  <div className="rounded-lg bg-[#08080c] p-3 ring-1 ring-zinc-800"><p className="font-medium text-zinc-300">Static Analysis</p><p className="mt-1 text-zinc-500">ESLint, HTMLHint, cek tag wajib & unclosed.</p></div>
                  <div className="rounded-lg bg-[#08080c] p-3 ring-1 ring-zinc-800"><p className="font-medium text-zinc-300">Dynamic Testing</p><p className="mt-1 text-zinc-500">Headless browser geser slider ke 9.5, baca DOM label.</p></div>
                  <div className="rounded-lg bg-[#08080c] p-3 ring-1 ring-zinc-800"><p className="font-medium text-zinc-300">Sandbox</p><p className="mt-1 text-zinc-500">Docker container 512MB, tanpa network, read-only FS.</p></div>
                </div>
              </div>
            </div>

            {/* Storage & Security */}
            <div className="col-span-12 space-y-6 lg:col-span-5">
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-widest text-zinc-400"><HardDrive className="h-4 w-4" /> Object Storage vs Relasional</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[14px] border border-blue-900/50 bg-blue-950/20 p-4">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-300"><HardDrive className="h-5 w-5" /></div>
                    <p className="text-[13px] font-semibold text-blue-200">Object Storage (S3 / MinIO)</p>
                    <p className="mono mt-2 text-[11px] leading-relaxed text-blue-200/60">/storage/tugas1/nim_nama.zip<br />/storage/tugas1/21105101_slider.zip</p>
                    <p className="mt-3 text-[11px] text-blue-200/70">Menyimpan file fisik .zip/.html mentah. Tidak membebani baris database.</p>
                  </div>
                  <div className="rounded-[14px] border border-zinc-800 bg-[#111119] p-4">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300"><Database className="h-5 w-5" /></div>
                    <p className="text-[13px] font-semibold text-zinc-200">Relational DB</p>
                    <p className="mono mt-2 text-[11px] leading-relaxed text-zinc-500">file_url VARCHAR<br />skor_otomatis DECIMAL<br />status_uji ENUM</p>
                    <p className="mt-3 text-[11px] text-zinc-500">Hanya menyimpan path / URL, skor, log. Performa tetap ringan.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[14px] border border-amber-900/30 bg-amber-950/10 p-5">
                <h4 className="flex items-center gap-2 text-[13px] font-semibold text-amber-200"><ShieldCheck className="h-4 w-4" /> Keamanan: Docker Isolation</h4>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 ring-1 ring-zinc-800"><Box className="h-5 w-5 text-zinc-400" /></div>
                    <div>
                      <p className="text-[12px] font-medium text-zinc-200">Host Server (JAKA.LMS)</p>
                      <p className="mono text-[10px] text-zinc-500">Ubuntu 22.04 • Node 20 • PostgreSQL</p>
                    </div>
                  </div>
                  <div className="ml-4 border-l border-dashed border-zinc-700 pl-6">
                    <div className="rounded-lg border border-amber-800/30 bg-[#1a1505] p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                        <p className="mono text-[11px] font-medium text-amber-200">jaka-sandbox-04 (isolated)</p>
                      </div>
                      <div className="mono mt-2 space-y-1 text-[10px] text-amber-200/60">
                        <p>• --network=none (tanpa internet)</p>
                        <p>• --read-only --tmpfs /tmp:rw,noexec</p>
                        <p>• --memory 512m --cpus 0.5</p>
                        <p>• seccomp + AppArmor profile</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2 rounded bg-black/40 px-2 py-1.5">
                        <Terminal className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="mono text-[10px] text-zinc-400">Kode mahasiswa dieksekusi di sini → jika berbahaya, container hancur, host aman.</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-amber-200/60">Penting: Karena kode mahasiswa dijalankan di server, isolasi Docker mencegah kode berbahaya merusak server utama. Setiap submission mendapat container fresh yang dihapus setelah 30 detik.</p>
              </div>

              <div className="rounded-[14px] border border-zinc-800 bg-[#111119] p-4">
                <p className="text-[12px] font-medium text-zinc-300">Stack Simulasi Frontend</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["React + TypeScript", "Tailwind CSS", "FileReader API", "ESLint (simulasi)", "Puppeteer (simulasi)", "Framer Motion (CSS)"].map((s) => (
                    <span key={s} className="rounded-full border border-zinc-800 bg-[#0a0a0f] px-2.5 py-1 text-[11px] text-zinc-400">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-zinc-800/60 py-6 text-center">
        <p className="mono text-[11px] text-zinc-600">JAKA.LMS • Automated Grading Portal • Dibuat untuk Master Jaka • Semua analisis berjalan di sisi klien (simulasi backend) • © 2024</p>
      </footer>
    </div>
  );
}

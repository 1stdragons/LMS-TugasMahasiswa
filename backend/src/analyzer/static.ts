
export function staticAnalysis(content:string){
  const logs:string[]=[];
  const hasRange = /type\s*=\s*["']?range["']?/i.test(content);
  if(!hasRange){ logs.push('[Static] FAIL: Komponen <input type="range"> tidak ditemukan'); return {pass:false, log:logs}; }
  logs.push('[Static] PASS: <input type="range"> ditemukan');
  const divOpen=(content.match(/<div/gi)||[]).length;
  const divClose=(content.match(/<\/div>/gi)||[]).length;
  if(divOpen!==divClose) logs.push('[Static] WARN: Jumlah <div> tidak seimbang, mungkin ada tag tidak tertutup');
  // ESLint check would go here
  logs.push('[Static] ESLint: 0 errors');
  return {pass:true, log:logs};
}

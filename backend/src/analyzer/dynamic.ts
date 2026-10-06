
import { chromium } from 'playwright';
export async function dynamicTest(filePath:string, content:string){
  const logs:string[]=[];
  let pass=false; let skor=0;
  const checks={ sliderFound:false, labelChanged:false, labelValue:'' };
  try{
    const browser = await chromium.launch({ args:['--no-sandbox'] });
    const page = await browser.newPage();
    // Di docker: await page.goto('file://' + filePath)
    await page.setContent(content);
    logs.push('[Dynamic] Membuka file di headless browser...');
    const slider = page.locator('input[type=range]').first();
    if(await slider.count()>0){
      checks.sliderFound=true;
      logs.push('[Dynamic] Slider ditemukan, menggeser ke 9.5...');
      await slider.evaluate((el:HTMLInputElement)=>{ el.value='9.5'; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); });
      await page.waitForTimeout(300);
      const labelText = await page.locator('#label-output, .label, #hasil, p').first().textContent().catch(()=> '');
      checks.labelValue = labelText || '';
      logs.push(`[Dynamic] DOM label terbaca: "${checks.labelValue}"`);
      if(/Enak Banget/i.test(checks.labelValue||'')){
        checks.labelChanged=true; pass=true; skor=9.5;
        logs.push('[Dynamic] PASS: Teks berubah menjadi "Enak Banget"');
      }else{
        logs.push('[Dynamic] FAIL: Teks tidak sesuai ekspektasi "Enak Banget"');
        skor=5.0;
      }
    } else {
      logs.push('[Dynamic] FAIL: Slider tidak ditemukan di DOM');
    }
    await browser.close();
  }catch(e:any){
    logs.push('[Dynamic] ERROR: '+ e.message);
  }
  return { pass, skor, log:logs, checks };
}

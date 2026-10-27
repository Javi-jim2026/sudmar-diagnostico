const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=createServer(async(req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{
  const bytes=await readFile(file);
  const mime=file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.png')?'image/png':'text/plain';
  res.writeHead(200,{'Content-Type':mime});res.end(bytes);
 }catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    S.tipoServicio='levantamiento_instalacion';
    S.cliente='Encargado';
    S.empresa='Cliente demostración';
    S.responsable='Ing. Javier Jiménez';
    S.instalacion={acompanantes:'Ing. Daniel Hernández'};
    render();nav(1);
  });
  await page.locator('#li-anchoLocal').fill('5.2');
  await page.locator('#li-anchoTta').fill('1.0');
  await page.evaluate(()=>nav(1));
  await page.locator('#li-voltaje').fill('220');
  await page.locator('#li-corrienteL1').fill('120');
  await page.locator('#li-corrienteL2').fill('115');
  await page.locator('#li-corrienteL3').fill('119');
  await page.locator('#li-genAts').fill('45');
  await page.locator('#li-redAts').fill('60');
  await page.locator('#li-atsCarga').fill('25');
  assert.match(await page.locator('#li-vista-calculo').innerText(),/kW/);
  assert.match(await page.locator('#li-vista-calculo').innerText(),/Alternativas automáticas por tramo/);
  assert.match(await page.locator('#li-vista-calculo').innerText(),/Liquidtight/);
  assert.match(await page.locator('#li-vista-calculo').innerText(),/60 kW/);
  await page.evaluate(()=>nav(1));
  assert.equal(await page.locator('#li-inst-local').count(),0);
  await page.evaluate(()=>openGallery('inst_local','gen'));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/9hkAAAAASUVORK5CYII=','base64');
  await page.locator('#gal-input').setInputFiles({name:'sitio.png',mimeType:'image/png',buffer:png});
  await page.locator('.li-photo .parte-foto img').first().waitFor({timeout:15000});
  await page.evaluate(()=>nav(1));
  assert.match(await page.locator('#content').innerText(),/Propuesta de instalación/);
  await page.evaluate(()=>nav(1));
  assert.match(await page.locator('#content').innerText(),/Generar levantamiento técnico/);
  assert.equal(await page.locator('#canvasTec').count(),0);
  const report=await page.evaluate(()=>liReporteInstalacionHtml());
  assert.match(report,/Ing. Daniel Hernández/);
  assert.match(report,/Alternativas automáticas por tramo/);
  assert.match(report,/45/);
  assert.match(report,/data:image/);
  assert.doesNotMatch(report,/Firmas de responsabilidad/);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{S.tipoServicio='levantamiento_instalacion';step=3;render();});
  assert.equal(await page.locator('#li-corrienteL1').inputValue(),'120');
  assert.equal(await page.locator('#li-genAts').inputValue(),'45');
  await page.evaluate(()=>{step=4;render();});
  await page.locator('.li-photo .parte-foto img').first().waitFor({timeout:15000});
  assert.deepEqual(errors,[]);
  console.log('Levantamiento instalación: móvil, cálculo, fotos, PDF y borrador OK');
 }finally{await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exitCode=1;server.close();});

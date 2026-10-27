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
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{S.tipoServicio='levantamiento';S.tipoEquipo='gen';step=3;render();});
  assert.equal(await page.locator('.registro-partes').count(),1);
  await page.locator('.parte-agregar').click();
  await page.locator('#parte-nombre-0').fill('Filtro de combustible');
  await page.locator('#parte-codigo-0').fill('P-4567');
  assert.match(await page.evaluate(()=>partesReporte()),/P-4567/);
  await page.evaluate(()=>openGallery('parte_'+S.partesRegistro[0].id,'gen'));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/9hkAAAAASUVORK5CYII=','base64');
  await page.locator('#gal-input').setInputFiles({name:'filtro.png',mimeType:'image/png',buffer:png});
  await page.locator('.parte-foto img').first().waitFor({timeout:10000});
  assert.match(await page.evaluate(()=>partesReporte()),/data:image\//);
  await page.waitForTimeout(600);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{step=3;render();});
  assert.equal(await page.locator('#parte-codigo-0').inputValue(),'P-4567');
  await page.locator('.parte-foto img').first().waitFor({timeout:10000});
  await page.evaluate(()=>{S.tipoServicio='diagnostico';step=3;render();});
  assert.equal(await page.locator('.registro-partes').count(),1);
  console.log('Mobile capture, part numbers, photos and draft recovery OK');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});

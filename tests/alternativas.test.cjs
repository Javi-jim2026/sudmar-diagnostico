const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('alternativas-instalacion.js','utf8');
const make=()=>{
 const context=vm.createContext({});
 vm.runInContext("const S={instalacion:{}};function liEsc(s){return String(s)};function liNum(s){return Number(s)}; function liValue(k){return S.instalacion[k]};function liN(k){return Number(S.instalacion[k])};function liCalcular(){return {ok:true,voltage:220,pf:0.8,iDem:120,iGen:150}}",context);
 vm.runInContext(source,context);
 return context;
};
function evalOpts(c,amp,setsLength=50){
 return vm.runInContext('acGenerateRoute('+JSON.stringify({name:'Planta → ATS',amp,length:setsLength,voltage:220,fp:0.8,sistema:'3f4h',tempFactor:1,groupFactor:1,caidaMax:3,material:'cobre'})+')',c);
}
test('para 50 A jamás propone conductores paralelos menores a 1/0 AWG',()=>{
 const c=make(),x=evalOpts(c,50,10);
 assert.equal(x.error,'');
 const one=x.options.find(o=>o.sets===1);
 assert.ok(one);
 assert.equal(one.calibre,'6 AWG'); // 4 conductores portadores, criterio conservador.
 for(const opt of x.options.filter(o=>o.sets>1))assert.match(opt.calibre,/(?:[1-4]\/0 AWG|kcmil)/);
 assert.ok(x.options.some(o=>o.sets===2));
});
test('opciones 1,2,3 en paralelo para 280 A, con juego completo por tubería',()=>{
 const c=make(),x=evalOpts(c,280,20);
 assert.deepEqual(Array.from(x.options.map(o=>o.sets)).sort(),[1,2,3]);
 const two=x.options.find(o=>o.sets===2);
 assert.ok(two.calibre!=='8 AWG');
 assert.equal(two.neutros,2);
 assert.equal(two.pe,2);
 assert.equal(two.phases,6);
 assert.equal(two.condPerRaceway,5);
 assert.ok(two.capacity>=280);
});
test('EMT/LA cumplen límites de ocupación: 40% para más de dos cables',()=>{
 const c=make(),x=evalOpts(c,50,10).options[0];
 assert.ok(x.emt);
 assert.ok(x.lfmc);
 assert.ok(x.emt.fill<=.40);
 assert.ok(x.lfmc.fill<=.40);
 const fill=vm.runInContext('acFill(["1",26.6],[12,12])',c);
 assert.equal(fill.limit,.31);
});
test('ducto metálico se preselecciona hasta 20%; charola sólo 1/0+ con cable adecuado',()=>{
 const c=make(),x=evalOpts(c,50,10);
 assert.ok(x.options[0].duct.fill<=.2);
 assert.match(x.options.find(o=>o.sets===2).tray.status,/mm de ancho|Fuera del catálogo/);
 assert.match(x.options.find(o=>o.sets===1).tray.status,/No automático/);
});
test('caída de tensión aumenta con distancia, no acepta alternativa si excede el límite',()=>{
 const c=make();
 const short=evalOpts(c,120,15),long=evalOpts(c,120,180);
 assert.ok(short.options[0].drop<=3&&long.options[0].drop<=3);
 assert.ok(long.options[0].areaCu>short.options[0].areaCu);
 const impossible=vm.runInContext('acGenerateRoute('+JSON.stringify({name:'X',amp:5000,length:1000,voltage:120,fp:.8,sistema:'3f4h',tempFactor:1,groupFactor:1,caidaMax:.1,material:'cobre'})+')',c);
 assert.ok(impossible.error);
});
test('no inventa calibre para aluminio',()=>{
 const c=make();
 const opt=vm.runInContext('acGenerateRoute('+JSON.stringify({name:'Y',amp:100,length:20,voltage:220,fp:.8,sistema:'3f4h',tempFactor:1,groupFactor:1,caidaMax:3,material:'aluminio'})+')',c);
 assert.equal(opt.options.length,0);
 assert.match(opt.error,/aluminio/);
});
test('el reporte automatizado incluye las tres rutas, material y aviso de ingeniería',()=>{
 const c=make();
 vm.runInContext("Object.assign(S.instalacion,{sistema:'3f4h',redAts:'30',genAts:'50',atsCarga:'40',tempFactor:'0.92',agrupFactor:'1',caidaMax:'3',material:'cobre'})",c);
 const html=vm.runInContext('liOpcionesAutomaticas()',c);
 assert.match(html,/Acometida normal/);
 assert.match(html,/Generador/);
 assert.match(html,/ATS → cargas/);
 assert.match(html,/EMT/);
 assert.match(html,/Liquidtight/);
 assert.match(html,/Ducto/);
 assert.match(html,/Charola/);
 assert.match(html,/310-10/);
 assert.doesNotMatch(html,/no aprobado por OpenAI/);
});

test('resistencia de referencia convertida correctamente: 8 AWG ≈ 2.66 Ω/km a 75 °C',()=>{
 const c=make();
 const r=vm.runInContext('AC_CABLES[0][4]',c);
 const x=vm.runInContext('AC_CABLES[0][5]',c);
 assert.ok(Math.abs(r-0.81*3.280839895)<.002);
 assert.ok(Math.abs(x-0.052*3.280839895)<.002);
 const drop=vm.runInContext('acVoltageDrop(AC_CABLES[0],50,100,1,true,.8,220)',c);
 assert.ok(drop>8 && drop<9.5,'100 m, 8 AWG, 50 A da una caída alta, no ~4%: '+drop);
});
test('con tramo largo se aumenta calibre por impedancia AC correctamente convertida',()=>{
 const c=make();
 const short=evalOpts(c,50,5);
 const long=evalOpts(c,50,100);
 assert.equal(short.options.find(o=>o.sets===1).calibre,'6 AWG');
 assert.notEqual(long.options.find(o=>o.sets===1).calibre,'6 AWG');
 assert.ok(long.options.find(o=>o.sets===1).drop<=3);
});

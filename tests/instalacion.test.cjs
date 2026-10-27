const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('levantamiento-instalacion.js','utf8');
const html=fs.readFileSync('index.html','utf8');
function ctx(){const c=vm.createContext({});vm.runInContext("const S={instalacion:{},tipoServicio:'levantamiento_instalacion',responsable:'Ing. Ejemplo',cliente:'Contacto',empresa:'Cliente',fecha:'2026-10-27',fG:{},ticket:'2800'};function guardarEstado(){};function render(){};function headerHtml(){return '<header>SUDMAR</header>'};function footerHtml(){return '<footer>SUDMAR</footer>'}",c);vm.runInContext(src,c);return c;}
function data(c,values){vm.runInContext('Object.assign(S.instalacion,'+JSON.stringify(values)+')',c);return vm.runInContext('liCalcular()',c);}
test('principal calcula kW 3F, kVA, factor de demanda, crecimiento, disponibilidad y ATS',()=>{
 const c=ctx();let v=data(c,{sistema:'3f4h',voltaje:'220',corrienteL1:'120',corrienteL2:'115',corrienteL3:'118'});
 assert.equal(v.ok,true);
 assert.ok(Math.abs(v.kwBase-36.58)<0.10,JSON.stringify(v));
 assert.ok(Math.abs(v.kwPro-54.87)<0.15);
 assert.equal(v.escalon,60);
 assert.match(v.hilos,/3F \+ N \+ PE = 5/);
 assert.equal(v.tramos.length,3);
 assert.ok(v.avisos.some(x=>x.includes('factores')));
});
test('1F+N propone número de hilos apropiado, sin confundir con 3F',()=>{
 const c=ctx();let v=data(c,{sistema:'1f2h',voltaje:'127',corrienteL1:'30',corrienteL2:'',corrienteL3:''});
 assert.equal(v.ok,true);assert.ok(Math.abs(v.kvaBase-3.81)<0.01);assert.match(v.hilos,/3 conductores/);
});
test('kW y kVA admiten captura directa y nunca suman ambas entradas',()=>{
 const c=ctx();let v=data(c,{criterio:'kw',potenciaKw:'50',potenciaKva:'100',voltaje:'220',fp:'0.8'});
 assert.equal(v.ok,true);assert.equal(v.kwBase,50);assert.equal(v.kvaBase,62.5);
});
test('evita resultados con datos insuficientes o PF inválido',()=>{
 const c=ctx();let v=data(c,{criterio:'corriente',corrienteL1:'',fp:'0.80'});assert.equal(v.ok,false);
 v=data(c,{corrienteL1:'200',fp:'0'});assert.equal(v.ok,false);
 assert.match(vm.runInContext('liResultados()',c),/Factor de potencia/);
});
test('rutas, calibres, advertencias de protección y caída aproximada',()=>{
 const c=ctx();let v=data(c,{voltaje:'220',corrienteL1:'45',corrienteL2:'45',corrienteL3:'45',genAts:'50',redAts:'25',atsCarga:'70',tempFactor:'0.90',agrupFactor:'0.80'});
 assert.equal(v.ok,true);
 assert.equal(v.tramos.length,3);
 assert.ok(v.tramos.every(t=>t.calibre));
 assert.ok(v.tramos.every(t=>Number.isFinite(t.drop)));
 assert.ok(v.avisos.some(x=>x.includes('neutro')||x.includes('Neutro')));
 v=data(c,{material:'aluminio'});assert.match(v.tramos[0].calibre,/Por diseñar/);
});
test('levantamiento tiene 6 pasos, sin firmas ni pruebas de carga obligatorias',()=>{
 assert.match(html,/id:'levantamiento_instalacion'/);
 assert.match(html,/renderInstalacionPaso2\(\)/);
 assert.match(html,/renderInstalacionPaso3\(\)/);
 assert.match(html,/renderInstalacionPaso4\(\)/);
 assert.match(html,/renderInstalacionPaso5\(\)/);
 assert.match(html,/renderInstalacionFinal\(\)/);
 assert.match(html,/S\.tipoServicio!=='levantamiento_instalacion'/);
});
test('reporte independiente conserva responsables, acompañantes, dimensiones y ninguna firma',()=>{
 const c=ctx();data(c,{sistema:'3f4h',corrienteL1:'120',corrienteL2:'120',corrienteL3:'120',voltaje:'220',anchoLocal:'3.2',acompanantes:'Daniel y Enrique',genAts:'45'});
 const report=vm.runInContext('liReporteInstalacionHtml()',c);
 assert.match(report,/Daniel y Enrique/);
 assert.match(report,/3\.2/);assert.match(report,/Planta → ATS/);
 assert.match(report,/Propuesta eléctrica preliminar/);
 assert.doesNotMatch(report,/Firmas de responsabilidad|firma del cliente|canvasTec/);
});
test('datos especiales se escapan antes de generar HTML',()=>{
 const c=ctx();data(c,{acompanantes:'<script>alert(1)</script>',cargasCriticas:'<img onerror=alert(1)>'});
 const report=vm.runInContext('liReporteInstalacionHtml()',c);
 assert.doesNotMatch(report,/<script>alert/);
 assert.doesNotMatch(report,/<img onerror/);
 assert.match(report,/&lt;script&gt;/);
});

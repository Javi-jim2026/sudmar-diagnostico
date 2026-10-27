const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const src=fs.readFileSync('componentes-registro.js','utf8');
function setup(servicio='levantamiento'){
 const ctx=vm.createContext({});
 vm.runInContext("const S={tipoServicio:"+JSON.stringify(servicio)+",partesRegistro:[],fG:{}}; function render(){};function guardarEstado(){};function programarGuardadoFotos(){};",ctx);
 vm.runInContext(src,ctx);
 return ctx;
}
test('se compilan los scripts inline del formulario sin errores de sintaxis',()=>{
 let count=0;
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
   if(/\bsrc\s*=/.test(m[1]))continue;
   new vm.Script(m[2]); count++;
 }
 assert.ok(count>=2);
});
test('levantamiento aparece como tipo de servicio y no exige checklist ni foto de placa',()=>{
 assert.match(html,/id:'levantamiento'/);
 assert.match(html,/S\.tipoServicio === 'levantamiento'\) return \[\]/);
 assert.match(html,/S\.tipoServicio!=='levantamiento'/);
 assert.match(html,/partesSeccion\(\)/);
 assert.match(html,/partesReporte\(\)/);
});
test('texto sin fotografía y múltiples piezas se documentan y escapan correctamente',()=>{
 const ctx=setup('mantenimiento');
 vm.runInContext("partesNuevo();partesCampo(0,'nombre','Filtro de aceite');partesCampo(0,'parte','<ABC&123>');partesNuevo();partesCampo(1,'nombre','Filtro combustible');partesCampo(1,'parte','P-002');",ctx);
 const output=vm.runInContext("partesReporte()",ctx);
 assert.match(output,/Filtro de aceite/);
 assert.match(output,/&lt;ABC&amp;123&gt;/);
 assert.match(output,/Filtro combustible/);
 assert.match(output,/P-002/);
 assert.doesNotMatch(output,/<ABC&123>/);
 assert.match(vm.runInContext("partesSeccion()",ctx),/Tomar foto/);
});
test('una foto sin número de parte también queda incluida en el reporte',()=>{
 const ctx=setup();
 vm.runInContext("partesNuevo();S.fG['parte_'+S.partesRegistro[0].id]=['data:image/jpeg;base64,YWJj'];",ctx);
 const htmlReport=vm.runInContext("partesReporte()",ctx);
 assert.match(htmlReport,/data:image\/jpeg;base64,YWJj/);
 assert.match(htmlReport,/No registrado \(ver fotografía\)/);
});
test('eliminar una referencia también elimina su fotografía asociada',()=>{
 const ctx=setup();
 vm.runInContext("partesNuevo();S.fG['parte_'+S.partesRegistro[0].id]=['data:image/jpeg;base64,YWJj'];partesQuitar(0);",ctx);
 assert.equal(vm.runInContext("S.partesRegistro.length",ctx),0);
 assert.equal(vm.runInContext("Object.keys(S.fG).length",ctx),0);
});
test('los servicios habituales muestran el registro sin cambiar la gestión de tickets',()=>{
 assert.match(html,/\['levantamiento','mantenimiento','diagnostico','reparacion','garantia'\]/);
 assert.doesNotMatch(html,/supabase\.co\/rest\/v1/);
});

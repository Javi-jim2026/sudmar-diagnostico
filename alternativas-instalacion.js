// Alternativas de conductores y canalizaciones: PRE-DIMENSIONAMIENTO, no ingeniería ejecutiva.
// Referencias: NOM-001-SEDE-2012 310-10(h), 310-15(b)(3)(a), Cap.10 tabla 1, 376-22, 392-22.
// Diámetros y R/X: Southwire SIMpull Cu THHN/THWN-2 (referencia de fabricante); LFMC: Electri-Flex LA.
// Southwire especifica R/X en Ω/1000 ft; el catálogo interno utiliza Ω/km (factor 3.280839895).
// No se calculan costos sin cotizaciones, ni se certifica instalación; confirmar material exacto y terminales.
const AC_CABLES=[
  // Calibre, ampacidad Cu 75C, Cu 90C, diámetro exterior mm, resistencia AC ohm/km, reactancia ohm/km, índice relativo Cu (mm²)
  ['8 AWG',50,55,5.51,2.6575,0.1706,8.37],['6 AWG',65,75,6.43,1.6732,0.1673,13.3],
  ['4 AWG',85,95,8.18,1.0499,0.1575,21.2],['3 AWG',100,115,8.89,0.8333,0.1542,26.7],
  ['2 AWG',115,130,9.75,0.6594,0.1476,33.6],['1 AWG',130,145,11.20,0.5217,0.1509,42.4],
  ['1/0 AWG',150,170,12.19,0.4167,0.1444,53.5],['2/0 AWG',175,195,13.31,0.3346,0.1411,67.4],
  ['3/0 AWG',200,225,14.58,0.2592,0.1378,85.0],['4/0 AWG',230,260,15.93,0.2067,0.1345,107.2],
  ['250 kcmil',255,290,17.37,0.1739,0.1345,127],['300 kcmil',285,320,19.13,0.1476,0.1345,152],
  ['350 kcmil',310,350,20.40,0.1280,0.1312,177],['400 kcmil',335,380,21.54,0.1148,0.1312,203],
  ['500 kcmil',380,430,23.65,0.0886,0.1280,253],['600 kcmil',420,475,26.16,0.0787,0.1280,304],
  ['750 kcmil',475,535,28.75,0.0623,0.1247,380],['1000 kcmil',545,615,32.54,0.0525,0.1214,507]
];
const AC_EMT=[['½″',15.8],['¾″',20.9],['1″',26.6],['1¼″',35.1],['1½″',40.9],['2″',52.5],['2½″',69.4],['3″',85.2],['3½″',97.4],['4″',110.1]];
const AC_LFMC=[['½″',15.8],['¾″',20.8],['1″',26.4],['1¼″',35.1],['1½″',40],['2″',51.3],['2½″',63],['3″',78],['3½″',88.9],['4″',101.6]];
const AC_DUCTS=[[50,50],[75,50],[100,50],[100,75],[100,100],[150,50],[150,75],[150,100],[200,100],[200,150],[300,100],[300,150],[300,200],[400,150],[400,200],[500,200],[600,200]];
const AC_TRAYS=[100,150,200,250,300,400,450,500,600,750,900];
const acArea=d=>Math.PI*(d/2)**2;
function acDerating(n){return n<=3?1:n<=6?.80:n<=9?.70:n<=20?.50:n<=30?.45:n<=40?.40:.35;}
function acWires(sistema){return {'3f4h':{phases:3,neutral:1,pe:1},'3f3h':{phases:3,neutral:0,pe:1},'1f2h':{phases:1,neutral:1,pe:1},'1f3h':{phases:2,neutral:1,pe:1}}[sistema]||null;}
function acFill(pipe,list){const area=acArea(pipe[1]),sum=list.reduce((a,b)=>a+acArea(b),0);const frac=list.length===1?.53:list.length===2?.31:.40;return {area,sum,fill:sum/area,limit:frac,valid:sum<=area*frac};}
function acConduit(lists,catalog){return catalog.map(([size,id])=>({size,id,...acFill([size,id],lists)})).find(x=>x.valid)||null;}
function acDuct(allDiameters){
 const area=allDiameters.reduce((s,d)=>s+acArea(d),0);
 const duct=AC_DUCTS.find(([w,h])=>area<=.2*w*h);
 return duct?{width:duct[0],height:duct[1],fill:area/(duct[0]*duct[1]),area}:null;
}
function acTray(diameters,eligible){
 if(!eligible)return {status:'No automático: verificar aprobación para charola y Art. 392'};
 // Aproximación geométrica de una sola capa. La aplicación de 392-22 puede ser distinta según calibre/cable/tipo.
 const total=diameters.reduce((a,b)=>a+b,0);
 const ancho=AC_TRAYS.find(w=>w>=total);
 return ancho?{status:ancho+' mm de ancho, preliminar por una capa; confirmar 392-22/392-80 y ficha Charofit',ancho,total}: {status:'Fuera del catálogo geométrico: ingeniería de charola'};
}
function acVoltageDrop(cable,amp,length,sets,phase,fp,voltage){
 if(!(Number.isFinite(length)&&length>=0&&voltage>0))return NaN;
 const cos=fp>0&&fp<=1?fp:.8,sin=Math.sqrt(1-cos*cos);
 const r=cable[4]/sets,x=cable[5]/sets; // Valores R/X en Ω/km, no Ω/1000 pies.
 // R/X de fabricante; disposición paralela y circuito final se confirman en ingeniería.
 return (phase?Math.sqrt(3):2)*amp*(r*cos+x*sin)*(length/1000)/voltage*100;
}
function acGenerateRoute({name,amp,length,voltage,fp,sistema,tempFactor,groupFactor,caidaMax,material}){
 const wiring=acWires(sistema);
 if(!wiring||!(amp>0)||!(voltage>0))return {name,options:[],error:'Datos eléctricos insuficientes'};
 if(material!=='cobre')return {name,options:[],error:'Para aluminio se requiere una tabla específica de ampacidad, R/X y diámetro exterior'};
 const phase=sistema.startsWith('3f'),conductors=wiring.phases+wiring.neutral+wiring.pe;
 const nCurrent=wiring.phases+wiring.neutral; // Neutro contado conservadoramente como conductor portador de corriente.
 const correction=(tempFactor>0&&tempFactor<=1?tempFactor:1)*(groupFactor>0&&groupFactor<=1?groupFactor:1);
 const alternatives=[];
 for(let sets=1;sets<=3;sets++){
  const opts=[];
  for(let idx=0;idx<AC_CABLES.length;idx++){
   if(sets>1&&idx<6)continue; // paralelos de potencia >= 1/0 AWG, salvo excepciones no modeladas.
   const cable=AC_CABLES[idx];
   const thermal=acDerating(nCurrent)*correction;
   const corrected=Math.min(cable[1],cable[2]*thermal);
   const capacity=corrected*sets;
   if(capacity+1e-9<amp)continue;
   const drop=acVoltageDrop(cable,amp,length,sets,phase,fp,voltage);
   if(Number.isFinite(length)&&length>=0&&!(Number.isFinite(drop)&&drop<=caidaMax))continue;
   // Cada juego completo se instala en su propio conduit, incluido PE. PE se modela
   // igual a fase SOLAMENTE para ocupación conservadora; debe dimensionarse por 250-122.
   const od=Array(conductors).fill(cable[3]);
   const emt=acConduit(od,AC_EMT),lfmc=acConduit(od,AC_LFMC);
   const allOD=Array(conductors*sets).fill(cable[3]);
   const duct=acDuct(allOD);
   const tray=acTray(allOD,idx>=6);
   const lengthFactor=Number.isFinite(length)&&length>0?length:1;
   const copperProxy=conductors*sets*cable[6]*lengthFactor;
   opts.push({sets,calibre:cable[0],ampSet:corrected,capacity,drop,conductors,emt,lfmc,duct,tray,areaCu:copperProxy,od:cable[3],neutros:wiring.neutral*sets,phases:wiring.phases*sets,pe:sets,derating:thermal,condPerRaceway:conductors});
  }
  if(opts.length)alternatives.push(opts[0]); // Menor calibre que satisface térmica y caída para cada número de juegos.
 }
 alternatives.sort((a,b)=>a.areaCu-b.areaCu||a.sets-b.sets);
 return {name,options:alternatives,error:alternatives.length?'':'No hay alternativa dentro del catálogo 8 AWG–1000 kcmil; revisar potencia, caída, factores o ingeniería especial'};
}
function acRoutePlans(){
 const c=liCalcular();
 if(!c.ok)return {error:'Completa las mediciones para generar alternativas'};
 const sys=liValue('sistema'), voltage=c.voltage,fp=c.pf;
 const correctionTemp=liN('tempFactor'),correctionGroup=liN('agrupFactor');
 const validTemp=correctionTemp>0&&correctionTemp<=1, validGroup=correctionGroup>0&&correctionGroup<=1;
 const caida=liN('caidaMax');
 const routes=[['Acometida normal → ATS','redAts',Math.max(c.iDem*1.25,c.iDem)],['Generador → ATS','genAts',c.iGen],['ATS → cargas','atsCarga',c.iDem*1.25]];
 const res=routes.map(([name,key,amp])=>acGenerateRoute({name,amp,length:liN(key),voltage,fp,sistema:sys,tempFactor:correctionTemp,groupFactor:correctionGroup,caidaMax:caida>0&&caida<=10?caida:3,material:liValue('material')}));
 return {routes:res,base:c,certified:false,missingCorrections:!validTemp||!validGroup,missingLength:routes.some(([,k])=>!(liN(k)>0))};
}
function acF(n,d=1){return Number.isFinite(n)?n.toFixed(d):'Pendiente';}
function liOpcionesAutomaticas(){
 const plan=acRoutePlans();
 if(plan.error)return '<p class="li-note">'+liEsc(plan.error)+'</p>';
 let out='<div class="li-option-panel"><h3>Alternativas automáticas por tramo</h3><p><b>Referencias:</b> cobre Cu THHN/THWN-2 (Southwire), terminales hasta 75 °C, ambientación base 30 °C, neutro contado como portador de corriente por seguridad y PE del mismo diámetro para ocupación conservadora. Cada juego paralelo utiliza su propio conduit.</p>';
 if(plan.missingCorrections)out+='<p class="li-note">Faltan factores de temperatura o agrupamiento: se usó 1.00 solo para explorar. <b>La selección no está validada.</b></p>';
 if(plan.missingLength)out+='<p class="li-note">Faltan distancias: sin ellas no puede verificarse la caída de tensión, por lo que las alternativas no están liberadas.</p>';
 for(const route of plan.routes){
  out+='<section class="li-option-route"><h4>'+liEsc(route.name)+'</h4>';
  if(route.error){out+='<p>'+liEsc(route.error)+'</p></section>';continue;}
  out+='<div class="li-tablewrap"><table><thead><tr><th>Arreglo</th><th>Capacidad corregida</th><th>Conduit EMT</th><th>Liquidtight LA</th><th>Ducto metálico</th><th>Charola tipo malla</th><th>Caída</th></tr></thead><tbody>';
  for(let i=0;i<route.options.length;i++){
   const op=route.options[i];
   out+='<tr><td><b>'+(i===0?'Menor sección Cu · ':'')+op.sets+' juego(s) de '+liEsc(op.calibre)+'</b><small>'+op.phases+' fase(s), '+op.neutros+' neutro(s), '+op.pe+' PE; '+op.sets+' tubería(s)</small></td>'+
    '<td>'+acF(op.capacity)+' A<br><small>'+acF(op.ampSet)+' A por conductor</small></td>'+
    '<td>'+(op.emt?op.sets+' × '+op.emt.size+' ('+acF(100*op.emt.fill)+' %)':'Requiere mayor diámetro')+'</td>'+
    '<td>'+(op.lfmc?op.sets+' × '+op.lfmc.size+' ('+acF(100*op.lfmc.fill)+' %)':'Fuera de catálogo')+'</td>'+
    '<td>'+(op.duct?op.duct.width+' × '+op.duct.height+' mm ('+acF(op.duct.fill*100)+' %)':'Revisión específica')+'</td>'+
    '<td>'+liEsc(op.tray.status)+'</td><td>'+acF(op.drop,2)+' %</td></tr>';
  }
  out+='</tbody></table></div><p class="li-note">El calibre del PE y neutro, las terminaciones, la puesta a tierra, el interruptor, la longitud real, los accesorios y el catálogo exacto requieren revisión de ingeniería.</p></section>';
 }
 return out+'<p class="li-note"><b>Normativa:</b> NOM-001-SEDE-2012 arts. 310-10(h), 310-15, 350, 358, 376, 392 y capítulo 10. Las charolas tienen reglas específicas de tendido/ampacidad: su ancho geométrico no constituye validación normativa. Ductos calculados al 20% interior teórico (medidas comerciales sujetas a fabricante). Liquidtight de referencia Electri-Flex tipo LA (diámetro interior mínimo). Sin costo: se ordena por volumen teórico de cobre, no precio instalado.</p></div>';
}

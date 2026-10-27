// Levantamiento de instalación de planta: captura local y estimación NO ejecutiva.
const LI_DEFAULTS={
 sistema:'3f4h',voltaje:'220',frecuencia:'60',fp:'0.80',criterio:'corriente',demandaPct:'100',
 reservaPct:'20',ocupacionMaxPct:'80',corrienteL1:'',corrienteL2:'',corrienteL3:'',
 potenciaKw:'',potenciaKva:'',cargasCriticas:'',cargaMayorMotorKw:'',tipoArranque:'',simultaneidad:'',
 continuidadPct:'100',tempFactor:'',agrupFactor:'',material:'cobre',instalacion:'',caidaMax:'3',
 genAts:'',redAts:'',atsCarga:'',distControl:'',tipoCanalizacion:'',cortocircuito:'',
 anchoLocal:'',largoLocal:'',altoLocal:'',anchoPlanta:'',largoPlanta:'',altoPlanta:'',
 accesoAncho:'',accesoAlto:'',pesoSoportado:'',anchoTta:'',altoTta:'',fondoTta:'',
 frenteServicio:'',lateralServicio:'',anchoRuta:'',restriccionRuta:'',
 altitude:'',tempAmbiente:'',exterior:'',ventilacion:'',extraccion:'',escape:'',
 combustible:'',autonomia:'',acustica:'',base:'',tierra:'',neutro:'',control:'',
 proteccion:'',interrupcion:'',seguridad:'',pendientes:'',notas:'',acompanantes:''
};
function liData(){if(!S.instalacion || typeof S.instalacion!=='object')S.instalacion={};return S.instalacion;}
function liValue(k){const d=liData();return d[k]===undefined?LI_DEFAULTS[k]??'':d[k];}
function liEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','<':'&lt;'}[c]));}
function liNum(v){if(v===null||v===undefined||String(v).trim()==='')return NaN;const n=Number(v);return Number.isFinite(n)?n:NaN;}
function liN(k){return liNum(liValue(k));}
function liFmt(n,d=1){return Number.isFinite(n)?n.toLocaleString('es-MX',{maximumFractionDigits:d,minimumFractionDigits:d}):'—';}
function liField(k,label,unit='',placeholder='',type='text'){
 const id='li-'+k,v=liEsc(liValue(k));
 return '<div class="field li-field"><label class="label" for="'+id+'">'+liEsc(label)+(unit?' ('+liEsc(unit)+')':'')+'</label><input class="input" id="'+id+'" type="'+type+'" '+(type==='number'?'min="0" step="any" inputmode="decimal" ':'')+'placeholder="'+liEsc(placeholder)+'" value="'+v+'" oninput="liSet(\''+k+'\',this.value)"></div>';
}
function liSelect(k,label,opts){
 return '<div class="field li-field"><label class="label" for="li-'+k+'">'+liEsc(label)+'</label><select id="li-'+k+'" class="input select" onchange="liSet(\''+k+'\',this.value)">'+opts.map(p=>'<option value="'+liEsc(p[0])+'" '+(liValue(k)===p[0]?'selected':'')+'>'+liEsc(p[1])+'</option>').join('')+'</select></div>';
}
function liText(k,label,placeholder=''){
 return '<div class="field"><label class="label" for="li-'+k+'">'+liEsc(label)+'</label><textarea class="input" id="li-'+k+'" rows="3" placeholder="'+liEsc(placeholder)+'" oninput="liSet(\''+k+'\',this.value)">'+liEsc(liValue(k))+'</textarea></div>';
}
function liSet(key,value){
 if(!(key in LI_DEFAULTS))return;
 liData()[key]=String(value);
 guardarEstado();
 if(['sistema','voltaje','fp','criterio','demandaPct','reservaPct','ocupacionMaxPct','corrienteL1','corrienteL2','corrienteL3','potenciaKw','potenciaKva','continuidadPct','genAts','redAts','atsCarga','material','tempFactor','agrupFactor','caidaMax'].includes(key)){
  const target=document.getElementById('li-vista-calculo');
  if(target)target.innerHTML=liResultados();
 }
}
function liSection(title,body){return '<section class="li-section"><h3>'+liEsc(title)+'</h3>'+body+'</section>';}
function liRow(fields){return '<div class="li-row">'+fields.join('')+'</div>';}
function renderInstalacionPaso2(){
 return '<div class="section-title">Levantamiento de espacios e instalación</div><div class="section-sub">Mide el lugar, ruta de acceso y espacio para grupo electrógeno y tablero de transferencia. Unidades en metros.</div>'+
 liSection('1 · Espacio disponible para planta',liRow([liField('anchoLocal','Ancho disponible','m','2.5','number'),liField('largoLocal','Largo disponible','m','5.0','number'),liField('altoLocal','Altura libre','m','2.8','number')])+
 liRow([liField('anchoPlanta','Ancho estimado de planta','m','1.5','number'),liField('largoPlanta','Largo estimado de planta','m','3.0','number'),liField('altoPlanta','Alto estimado de planta','m','2.0','number')])+
 liRow([liField('frenteServicio','Espacio frontal de mantenimiento','m','0.9','number'),liField('lateralServicio','Espacio lateral de mantenimiento','m','0.8','number'),liField('pesoSoportado','Capacidad del piso (si conocida)','kg/m²','','number')]))+
 liSection('2 · Accesos y maniobras',liRow([liField('accesoAncho','Ancho mínimo de paso','m','','number'),liField('accesoAlto','Altura mínima de paso','m','','number'),liField('anchoRuta','Ancho disponible para maniobra','m','','number')])+liText('restriccionRuta','Restricciones de ingreso','Rampas, elevadores, curvas, obstáculos, izaje o montacargas.'))+
 liSection('3 · Ubicación de tablero de transferencia (TTA/ATS)',liRow([liField('anchoTta','Ancho del espacio','m','','number'),liField('altoTta','Alto del espacio','m','','number'),liField('fondoTta','Profundidad del espacio','m','','number')]))+
 liSection('4 · Condiciones ambientales y obra civil',liRow([liField('altitude','Altitud del sitio','m s. n. m.','','number'),liField('tempAmbiente','Temperatura ambiente máxima','°C','','number')])+
 liSelect('exterior','Ubicación',[['','Sin definir'],['interior','Interior'],['exterior','Exterior'],['azotea','Azotea']])+
 liText('base','Base, anclaje, nivelación y drenaje','Espacio, losa, capacidad estructural, acceso para mantenimiento.')+
 liText('ventilacion','Ventilación y entrada de aire frío','Sección de rejillas, entradas de aire, recirculación y ruta de ventilación.')+
 liText('extraccion','Extracción de aire caliente','Salida de radiador, ducto, contrapresión estimada y distancia.')+
 liText('escape','Salida de gases de escape','Ruta, altura, distancias a aberturas, aislamiento y contra presión.')+
 liText('combustible','Combustible y almacenamiento','Tipo, ubicación de tanque, recorridos, bombeo, contención.')+
 liField('autonomia','Autonomía objetivo','h','','number')+
 liText('acustica','Restricciones acústicas y vecindad','Uso del edificio, horarios, ruido, acceso de personal.') );
}
function renderInstalacionPaso3(){
 return '<div class="section-title">Mediciones eléctricas y cableado</div><div class="section-sub">Registra datos reales si están disponibles. Los resultados son orientativos y no sustituyen el cálculo de ingeniería eléctrica.</div>'+
 liSection('1 · Alimentación y cargas',liRow([
 liSelect('sistema','Sistema eléctrico',[['3f4h','3 fases + neutro (3F+N)'],['3f3h','3 fases sin neutro (3F)'],['1f2h','1 fase + neutro (1F+N)'],['1f3h','Monofásico 3 hilos (2L+N)']]),
 liField('voltaje','Voltaje nominal','V','220','number'),liField('frecuencia','Frecuencia','Hz','60','number')])+
 liRow([liSelect('criterio','Dato base',[['corriente','Corriente medida / prevista'],['kw','Potencia activa (kW)'],['kva','Potencia aparente (kVA)']]),
 liField('fp','Factor de potencia (0 a 1)','','0.80','number'),liField('demandaPct','Factor de demanda / coincidencia','%','100','number')])+
 liRow([liField('corrienteL1','Corriente L1','A','','number'),liField('corrienteL2','Corriente L2','A','','number'),liField('corrienteL3','Corriente L3','A','','number')])+
 liRow([liField('potenciaKw','Carga total','kW','','number'),liField('potenciaKva','Carga total','kVA','','number')])+
 liText('cargasCriticas','Relación de cargas críticas','Iluminación, bombeo, elevadores, TI, refrigeración, HVAC y cargas no críticas.')+
 liRow([liField('cargaMayorMotorKw','Motor de mayor potencia','kW','','number'),liSelect('tipoArranque','Arranque de motores',[['','Por definir'],['directo','Directo a línea'],['estrella','Estrella-triángulo'],['suave','Arrancador suave'],['vfd','Variador de frecuencia'],['mixto','Mixto']])])+
 liText('simultaneidad','Secuencia de arranque / transitorios','Cargas escalonadas, picos de arranque, no lineales, UPS, soldadoras o variadores.'))+
 liSection('2 · Criterios de propuesta preliminar',liRow([liField('reservaPct','Crecimiento previsto','%','20','number'),liField('ocupacionMaxPct','Utilización objetivo del generador','%','80','number'),liField('continuidadPct','Porcentaje de carga continua','%','100','number')])+
 liText('interrupcion','Continuidad requerida','Transferencia abierta/cerrada, tiempos máximos de interrupción, criticidad.'))+
 liSection('3 · Distancias medidas del cableado',liRow([liField('redAts','Acometida / red normal → ATS','m','','number'),liField('genAts','Generador → ATS','m','','number'),liField('atsCarga','ATS → tablero de cargas','m','','number')])+
 liField('distControl','Generador → ATS (control / arranque)','m','','number')+
 liSelect('material','Material de conductor',[['cobre','Cobre'],['aluminio','Aluminio (sin calibre automático)']])+
 liText('tipoCanalizacion','Canalización y ruta','Charola, conduit, tubería subterránea, número de circuitos y ocupación.')+
 liSelect('instalacion','Método de instalación',[['','Pendiente'],['tuberia','Canalización cerrada'],['charola','Charola ventilada'],['enterrada','Subterránea'],['aire','Al aire / aparente']])+
 liRow([liField('tempFactor','Factor correctivo por temperatura (si calculado)','','Ej. 0.91','number'),liField('agrupFactor','Factor adicional por agrupamiento (si aplica)','','Ej. 0.80','number'),liField('caidaMax','Caída de tensión objetivo por tramo','%','3','number')])+
 liField('cortocircuito','Corriente de cortocircuito disponible','kA','','number'))+
 '<div id="li-vista-calculo">'+liResultados()+'</div>';
}
function renderInstalacionPaso4(){
 return '<div class="section-title">ATS, control, seguridad y evidencias</div><div class="section-sub">Completa las condiciones necesarias para presupuestar y validar una instalación segura.</div>'+
 liSection('Transferencia y protecciones',liText('neutro','Neutro: continuidad y transferencia','Indica si el neutro debe conmutarse; valida esquema de puesta a tierra de ambos suministros.')+
 liText('tierra','Sistema de puesta a tierra','Electrodos, impedancia, equipotencialidad y conductor de protección.')+
 liText('proteccion','Protecciones e interruptores','Corrientes y capacidad interruptiva, coordinación/selectividad, estado de tableros.')+
 liText('control','Señales de control ATS ↔ planta','Arranque remoto, alarmas, comunicación, monitorización y canalización de control.'))+
 liSection('Riesgos y pendientes',liText('seguridad','Seguridad y permisos','Protección contra incendio, ventilación, combustible, autorizaciones, obra civil, señalización.')+
 liText('pendientes','Datos pendientes por confirmar','Curvas de arranque, cortocircuito de acometida, factores de corrección, planos y visita adicional.')+
 liText('notas','Observaciones y recomendaciones','Condiciones de instalación, acceso, operación futura y restricciones.'))+
 liSection('Fotografías de referencia (opcionales)',liFoto('inst_local','Sitio y espacio para planta')+liFoto('inst_ats','Ubicación del ATS')+liFoto('inst_acometida','Acometida eléctrica y tablero principal')+liFoto('inst_cargas','Cargas y canalizaciones'));
}
function liFoto(key,label){
 const fotos=Array.isArray(S.fG?.[key])?S.fG[key]:[];
 return '<div class="li-photo"><strong>'+liEsc(label)+'</strong><div class="parte-fotobotones"><button type="button" onclick="openCamera(\''+key+'\',\'gen\')">📷 Tomar</button><button type="button" onclick="openGallery(\''+key+'\',\'gen\')">📁 Galería</button></div>'+
 (fotos.length?'<div class="parte-fotos">'+fotos.map((s,i)=>'<div class="parte-foto"><img alt="Fotografía de sitio" src="'+liEsc(s)+'"><button type="button" onclick="liQuitarFoto(\''+key+'\','+i+')">✕</button></div>').join('')+'</div>':'<p class="parte-nota">No es obligatorio adjuntar fotografías.</p>')+'</div>';
}
function liQuitarFoto(k,i){if(Array.isArray(S.fG?.[k]))S.fG[k].splice(i,1);programarGuardadoFotos();render();}
function liAmpacidades(){
 // Referencias aproximadas Cu/75 °C; no sustituyen tabla aplicable y correcciones.
 return [
  ['12 AWG',20,6.56],['10 AWG',30,4.12],['8 AWG',50,2.60],['6 AWG',65,1.64],
  ['4 AWG',85,1.03],['3 AWG',100,0.818],['2 AWG',115,0.649],['1 AWG',130,0.515],
  ['1/0 AWG',150,0.409],['2/0 AWG',175,0.324],['3/0 AWG',200,0.257],['4/0 AWG',230,0.204],
  ['250 kcmil',255,0.172],['300 kcmil',285,0.144],['350 kcmil',310,0.123],
  ['400 kcmil',335,0.108],['500 kcmil',380,0.086],['600 kcmil',420,0.072],
  ['750 kcmil',475,0.057],['1000 kcmil',545,0.043]
 ];
}
function liCalcular(){
 const fase=String(liValue('sistema')).startsWith('3f');
 const v=liN('voltaje'),fp=liN('fp'),d=liN('demandaPct'),res=liN('reservaPct'),oc=liN('ocupacionMaxPct');
 const continu=liN('continuidadPct'),caida=liN('caidaMax');
 const errs=[],avisos=[];
 if(!(v>0))errs.push('Captura un voltaje nominal válido.');
 if(!(fp>0&&fp<=1))errs.push('Factor de potencia entre 0 y 1.');
 if(!(d>0&&d<=100))errs.push('Factor de demanda entre 0 y 100%.');
 if(!(res>=0&&res<=100))errs.push('Crecimiento previsto entre 0 y 100%.');
 if(!(oc>0&&oc<=100))errs.push('Utilización del generador entre 0 y 100%.');
 if(!(continu>=0&&continu<=100))errs.push('Porcentaje de carga continua entre 0 y 100%.');
 const iMed=[liN('corrienteL1'),liN('corrienteL2'),liN('corrienteL3')].filter(n=>Number.isFinite(n)&&n>=0);
 let kva=NaN,kw=NaN,iBase=NaN,criterio=liValue('criterio');
 if(criterio==='corriente'){
  if(iMed.length) iBase=Math.max(...iMed);
  else errs.push('Registra al menos una corriente medida o cambia el dato base.');
  if(fase&&iMed.length<3)avisos.push('Medición trifásica incompleta: se empleó la corriente máxima registrada. Medir las tres fases.');
  if(iBase>=0&&v>0)kva=(fase?Math.sqrt(3):1)*v*iBase/1000;
  if(kva>=0&&fp>0)kw=kva*fp;
 }else if(criterio==='kw'){
  kw=liN('potenciaKw');if(!(kw>0))errs.push('Captura los kW de la carga.');
  if(kw>0&&fp>0){kva=kw/fp;iBase=kva*1000/((fase?Math.sqrt(3):1)*v);}
 }else{
  kva=liN('potenciaKva');if(!(kva>0))errs.push('Captura los kVA de la carga.');
  if(kva>0&&fp>0){kw=kva*fp;iBase=kva*1000/((fase?Math.sqrt(3):1)*v);}
 }
 if(errs.length||!(kw>0)||!(iBase>0))return {ok:false,errs:[...new Set(errs.length?errs:['Faltan datos suficientes para calcular la demanda.'])],avisos};
 const kwDem=kw*d/100, kvaDem=kva*d/100, iDem=iBase*d/100;
 const kwPro=kwDem*(1+res/100)/(oc/100), kvaPro=kwPro/.8;
 const iGen=kvaPro*1000/((fase?Math.sqrt(3):1)*v);
 const cargaCont=iDem*(1+0.25*continu/100);
 const generadores=[10,15,20,25,30,40,50,60,75,80,100,125,150,175,200,250,300,350,400,450,500,550,600,650,700,750,800,900,1000,1125,1250,1500,1750,2000,2250,2500,3000,3500,4000];
 const escalon=generadores.find(n=>n>=kwPro);
 const atsList=[30,60,100,150,200,225,250,300,400,600,800,1000,1200,1600,2000,2500,3000,3200,4000];
 const ats=atsList.find(n=>n>=Math.max(iGen,cargaCont));
 const sys=liValue('sistema'),hilos=({ '3f4h':'3F + N + PE = 5 conductores físicos', '3f3h':'3F + PE = 4 conductores físicos', '1f2h':'1F + N + PE = 3 conductores físicos','1f3h':'2L + N + PE = 4 conductores físicos' })[sys]||'Por definir';
 const routes=[['Acometida → ATS','redAts',cargaCont],['Planta → ATS','genAts',iGen],['ATS → cargas','atsCarga',cargaCont]];
 const material=liValue('material'),ft=liN('tempFactor'),fg=liN('agrupFactor');
 const corTemp=ft>0&&ft<=1?ft:1,corAgr=fg>0&&fg<=1?fg:1,limite=caida>0&&caida<=10?caida:3;
 const correccionConfirmada=ft>0&&ft<=1&&fg>0&&fg<=1;
 if(!correccionConfirmada)avisos.push('Faltan factores de temperatura y/o agrupamiento: se tomó 1.00 solo para orientación; el calibre no está validado.');
 if(material!=='cobre')avisos.push('No se calcula calibre de aluminio automáticamente: requiere tabla y terminales compatibles.');
 if(liNum(liValue('cargaMayorMotorKw'))>0)avisos.push('Verificar arranque del mayor motor, caída transitoria de tensión, respuesta del regulador y escalonamiento.');
 if(sys==='1f3h')avisos.push('En sistema monofásico de tres hilos, confirmar tensión línea-línea y reparto de cargas; el cálculo se aproxima a una sola potencia de línea.');
 avisos.push('El neutro y PE requieren dimensionamiento independiente conforme al sistema de tierras, protecciones y cargas no lineales; PE nunca se conmuta en ATS.');
 const tramos=routes.map(([nombre,key,amp])=>{
  const metros=liN(key),longitud=metros>=0?metros:NaN;
  if(material!=='cobre')return {nombre,metros:longitud,corriente:amp,calibre:'Por diseñar (Al)',drop:NaN,reason:'material no verificado'};
  const pos=liAmpacidades().find(([,a,r])=>{
   const caída=Number.isFinite(longitud)?(fase?Math.sqrt(3):2)*amp*r*1.22*(longitud/1000)/v*100:0;
   return amp<=a*corTemp*corAgr && (!Number.isFinite(longitud)||caída<=limite);
  });
  if(!pos)return {nombre,metros:longitud,corriente:amp,calibre:'Requiere conductores en paralelo o ingeniería específica',drop:NaN,reason:'fuera de tabla'};
  const drop=Number.isFinite(longitud)?(fase?Math.sqrt(3):2)*amp*pos[2]*1.22*(longitud/1000)/v*100:NaN;
  return {nombre,metros:longitud,corriente:amp,calibre:pos[0],drop,reason:'Cu/75 °C, ampacidad y caída resistiva estimadas'};
 });
 return {ok:true,kwBase:kw,kvaBase:kva,kwDem,kvaDem,iDem,kwPro,kvaPro,iGen,ats,escalon,hilos,tramos,avisos,correccionConfirmada,pf:fp,voltage:v};
}
function liResultados(){
 const c=liCalcular();
 if(!c.ok)return '<div class="li-result"><strong>Propuesta eléctrica preliminar</strong><p>'+c.errs.map(liEsc).join(' ')+'</p><p>El informe conservará los datos capturados, incluso si aún no permiten un cálculo.</p></div>';
 const big='<div class="li-kpis"><div><span>Demanda estimada</span><strong>'+liFmt(c.kwDem)+' kW</strong></div><div><span>Propuesta mínima orientativa</span><strong>'+liFmt(c.kwPro)+' kW</strong></div><div><span>Capacidad orientativa</span><strong>'+liFmt(c.kvaPro)+' kVA</strong></div><div><span>ATS aproximado</span><strong>'+(c.ats||'Fuera de catálogo')+' A</strong></div></div>';
 const tramos='<div class="li-tablewrap"><table><thead><tr><th>Tramo</th><th>Longitud</th><th>Corriente</th><th>Calibre tentativo</th><th>Caída resistiva</th></tr></thead><tbody>'+c.tramos.map(t=>'<tr><td>'+liEsc(t.nombre)+'</td><td>'+liFmt(t.metros)+' m</td><td>'+liFmt(t.corriente)+' A</td><td>'+liEsc(t.calibre)+'</td><td>'+liFmt(t.drop,2)+' %</td></tr>').join('')+'</tbody></table></div>';
 return '<div class="li-result"><strong>Propuesta preliminar de ingeniería (NO apta para compra ni instalación directa)</strong>'+big+
 '<p>Escalón comercial orientativo: <b>'+(c.escalon||'Fuera de lista')+' kW</b> · Corriente nominal estimada del generador: <b>'+liFmt(c.iGen)+' A</b> · Red de conductores: <b>'+liEsc(c.hilos)+'</b>.</p>'+
 liOpcionesAutomaticas()+'<p class="li-note">Comparación por rutas y arreglos bajo hipótesis del catálogo Cu THHN/THWN-2; aun requiere liberación por ingeniería: ampacidad real, caída total, terminales, protección, cortocircuito, neutro, PE y condiciones de obra.</p>'+
 '<ul>'+c.avisos.map(a=>'<li>'+liEsc(a)+'</li>').join('')+'</ul></div>';
}
function renderInstalacionPaso5(){
 return '<div class="section-title">Propuesta de instalación</div><div class="section-sub">Vista de cálculo y pendientes. Revisa los datos antes de entregar el documento.</div>'+liResultados()+
 liSection('Revisión de ingeniería pendiente','<p>Por validar: potencia de arranque, curva de carga, capacidad interruptiva, neutro y puesta a tierra, método de canalización, derating, caída total, altitud, temperatura, ventilación, extracción, combustible, acústica y obra civil.</p>'+
 '<p>La transferencia deberá proteger ambos suministros y evitar paralelismo accidental, salvo ingeniería específica aprobada.</p>');
}
function renderInstalacionFinal(){
 return '<div class="section-title">Generar levantamiento técnico</div><div class="section-sub">Reporte sin firmas. Incluye responsable, acompañantes y condiciones para la ingeniería de instalación.</div>'+
 liSection('Personal de la visita','<p><b>Responsable:</b> '+liEsc(S.responsable||'No registrado')+'</p><p><b>Acompañantes:</b> '+liEsc(liValue('acompanantes')||'No registrados')+'</p>')+
 liSection('Observaciones finales',liText('pendientes','Pendientes para ingeniería definitiva','Confirmar datos de carga, condiciones de instalación y planos.'))+
 liResultados()+
 '<button type="button" class="parte-agregar" onclick="generarReporte(\'documental\')">📄 Ver reporte y guardar como PDF</button><p class="parte-nota">Se abre un documento imprimible. Selecciona «Guardar como PDF» desde la ventana de impresión del dispositivo.</p>';
}
function liReportRows(keys){
 return '<div class="sb"><div class="li-reportgrid">'+keys.map(k=>'<div class="li-reportitem"><strong>'+liEsc(k[1])+'</strong><span>'+liEsc(liValue(k[0])||'No registrado')+(k[2]?' '+liEsc(k[2]):'')+'</span></div>').join('')+'</div></div>';
}
function liFotosReporte(){
 const photos=[['inst_local','Sitio para planta'],['inst_ats','Espacio de transferencia'],['inst_acometida','Acometida normal'],['inst_cargas','Tablero de cargas']].flatMap(([k,label])=>(S.fG?.[k]||[]).map(src=>({src,label})));
 return photos.length?'<h2>Evidencias fotográficas</h2><div class="sb">'+photos.map(p=>'<div class="report-block" style="margin:10px 0"><b>'+liEsc(p.label)+'</b><img class="photo-large" src="'+liEsc(p.src)+'" style="display:block;width:100%;max-height:400px;object-fit:contain" alt="Fotografía del sitio"></div>').join('')+'</div>':'';
}
function liReporteInstalacionHtml(){
 const c=liCalcular();
 const datos=[
  ['anchoLocal','Ancho de área','m'],['largoLocal','Largo de área','m'],['altoLocal','Altura libre','m'],
  ['anchoPlanta','Ancho de planta','m'],['largoPlanta','Largo de planta','m'],['altoPlanta','Alto de planta','m'],
  ['frenteServicio','Acceso frontal','m'],['lateralServicio','Acceso lateral','m'],
  ['accesoAncho','Ancho de acceso','m'],['accesoAlto','Altura de acceso','m'],
  ['anchoTta','Espacio ATS ancho','m'],['altoTta','Espacio ATS alto','m'],['fondoTta','Espacio ATS fondo','m'],
  ['altitude','Altitud','m s. n. m.'],['tempAmbiente','Temperatura ambiente','°C'],['exterior','Ubicación','']
 ];
 const electrico=[
  ['sistema','Sistema',''],['voltaje','Voltaje','V'],['frecuencia','Frecuencia','Hz'],
  ['fp','FP de cálculo',''],['corrienteL1','L1','A'],['corrienteL2','L2','A'],['corrienteL3','L3','A'],
  ['potenciaKw','Carga indicada','kW'],['potenciaKva','Carga indicada','kVA'],['demandaPct','Factor demanda','%'],
  ['reservaPct','Crecimiento','%'],['ocupacionMaxPct','Uso objetivo','%'],['continuidadPct','Carga continua','%'],
  ['cargaMayorMotorKw','Motor mayor','kW'],['tipoArranque','Arranque',''],['cortocircuito','Corto disponible','kA'],
  ['redAts','Acometida → ATS','m'],['genAts','Planta → ATS','m'],['atsCarga','ATS → cargas','m'],
  ['distControl','Cable de control','m'],['tipoCanalizacion','Canalización',''],['material','Conductor',''],
  ['tempFactor','Corrección térmica',''],['agrupFactor','Corrección agrupación','']
 ];
 const textRows=[
  ['cargasCriticas','Cargas críticas'],['simultaneidad','Motores, arranques y simultaneidad'],
  ['base','Base y obra civil'],['ventilacion','Ventilación'],['extraccion','Extracción de aire caliente'],['escape','Escape'],['combustible','Combustible'],['acustica','Ruido'],
  ['restriccionRuta','Accesos y maniobras'],['neutro','Neutro'],['tierra','Puesta a tierra'],['proteccion','Protecciones'],['control','Control/ATS'],['interrupcion','Continuidad'],['seguridad','Seguridad y permisos'],['notas','Observaciones'],['pendientes','Pendientes']
 ];
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Levantamiento instalación '+liEsc(S.ticket||'SUDMAR')+'</title><style>'+
 'body{font-family:Arial,sans-serif;color:#0a2240;background:#fff;font-size:12px;line-height:1.5;margin:0}.page{max-width:840px;margin:auto;padding:0 20px 35px}h1{font-size:19px}h2{font-size:15px;border-bottom:2px solid #17689a;padding-bottom:5px;margin:24px 0 12px}h3{font-size:12px;margin:10px 0}.datos-grid,.li-reportgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.li-reportitem{border:1px solid #dce5ee;padding:7px 10px;overflow-wrap:anywhere}.li-reportitem strong{display:block;color:#607483;font-size:10px}.li-reportitem span{display:block}.li-nota{border:1px solid #f2c78b;background:#fff8ef;padding:10px;margin:12px 0}.li-tablewrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;border:1px solid #dce5ee;padding:6px 7px;font-size:10px}th{background:#0a2240;color:white}.li-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.li-kpis div{padding:8px;border:1px solid #dce5ee}.li-kpis span{display:block;font-size:10px}.li-kpis strong{font-size:15px}.li-result{margin:10px 0}.li-result ul{padding-left:20px}.li-note{font-size:11px;color:#92400e}.photo-large{max-width:100%}.report-block{break-inside:avoid}.no-print{background:#0a2240;display:flex;gap:8px;padding:12px;position:sticky;top:0}.no-print button{background:#1a5fa8;color:#fff;border:0;border-radius:8px;padding:10px;flex:1}@media print{.no-print{display:none}.page{max-width:none}h2{break-after:avoid}.report-block,.li-reportitem{break-inside:avoid}}@media(max-width:540px){.li-reportgrid,.datos-grid{grid-template-columns:1fr}}'+
 '</style></head><body><div class="no-print"><button onclick="window.print()">Guardar como PDF / imprimir</button><button onclick="window.close()">Cerrar</button></div><div class="page">'+
 headerHtml()+'<h1>LEVANTAMIENTO TÉCNICO PARA INSTALACIÓN DE PLANTA DE EMERGENCIA</h1>'+
 '<h2>Datos generales</h2><div class="li-reportgrid"><div class="li-reportitem"><strong>Folio</strong><span>'+liEsc(S.ticket||'No indicado')+'</span></div><div class="li-reportitem"><strong>Empresa</strong><span>'+liEsc(S.empresa==='otro'?S.empresaOtra:S.empresa)+'</span></div><div class="li-reportitem"><strong>Fecha</strong><span>'+liEsc(S.fecha)+'</span></div><div class="li-reportitem"><strong>Sitio</strong><span>'+liEsc(S.sitio||S.ubicacion||'No indicado')+'</span></div><div class="li-reportitem"><strong>Responsable</strong><span>'+liEsc(S.responsable||'No indicado')+'</span></div><div class="li-reportitem"><strong>Acompañantes</strong><span>'+liEsc(liValue('acompanantes')||'No registrados')+'</span></div></div>'+
 '<h2>Dimensiones y condiciones del sitio</h2>'+liReportRows(datos)+
 '<h2>Mediciones, cargas y distancias</h2>'+liReportRows(electrico)+
 '<h2>Propuesta eléctrica preliminar</h2><div class="li-nota">ESTIMACIÓN PRELIMINAR: No equivale a memoria de cálculo, ingeniería ejecutiva ni aprobación de conductor, ATS o planta. Debe verificarse contra la NOM-001-SEDE aplicable, especificaciones de fabricantes y condiciones reales.</div>'+
 (c.ok?liResultados():'<p>No existen datos suficientes para proponer potencia y calibres. '+liEsc(c.errs.join(' '))+'</p>')+
 '<h2>Condiciones de instalación y pendientes</h2><div class="sb">'+textRows.filter(([k])=>String(liValue(k)).trim()).map(([k,label])=>'<div class="report-block" style="margin:8px 0"><b>'+liEsc(label)+'</b><div>'+liEsc(liValue(k)).replace(/\n/g,'<br>')+'</div></div>').join('')+'</div>'+
 liFotosReporte()+footerHtml()+'</div></body></html>';
}
function generarReporteInstalacion(tipo,destino){
 const html=liReporteInstalacionHtml();
 if(destino==='drive'){guardarYCompartir(html,tipo);return;}
 const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),win=window.open(url,'_blank');
 if(!win){URL.revokeObjectURL(url);showAlert('Permite ventanas emergentes para visualizar el reporte PDF.');return;}
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}

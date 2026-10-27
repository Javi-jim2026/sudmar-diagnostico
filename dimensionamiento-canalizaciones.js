// Comparador de alimentadores – estudio conceptual; no sustituye memoria de cálculo ni NOM.
// Base de Cu THHN/THWN-2 (área aproximada exterior, cap. 9 Tabla 5) y ampacidad Cu 75°C Tabla 310-15(b)(16).
const DA_WIRES=[
 // Calibre, ampacidad 75°C, resistencia aproximada Ω/km, área exterior mm², diámetro exterior mm.
 ['12 AWG',20,6.56,8.581,3.302],['10 AWG',30,4.12,13.61,4.166],
 ['8 AWG',50,2.60,23.61,5.486],['6 AWG',65,1.64,32.71,6.452],
 ['4 AWG',85,1.03,53.16,8.23],['3 AWG',100,0.818,62.77,8.941],
 ['2 AWG',115,0.649,74.71,9.754],['1 AWG',130,0.515,100.8,11.33],
 ['1/0 AWG',150,0.409,119.7,12.34],['2/0 AWG',175,0.324,143.4,13.51],
 ['3/0 AWG',200,0.257,172.8,14.83],['4/0 AWG',230,0.204,208.8,16.31],
 ['250 kcmil',255,0.172,256.1,18.06],['300 kcmil',285,0.144,297.3,19.46]
];
const DA_CONDUIT={
 'EMT':[['½',15.8],['¾',20.9],['1',26.6],['1¼',35.1],['1½',40.9],['2',52.5],['2½',69.4],['3',85.2],['3½',97.4],['4',110.1]],
 'LFMC (liquidtight metálico)':[['½',16.1],['¾',21.1],['1',26.8],['1¼',35.4],['1½',40.3],['2',51.6],['2½',63.3],['3',78.4],['3½',89.4],['4',102.1]]
};
const DA_DUCTOS=[['2 × 2"',51,51],['3 × 3"',76,76],['4 × 4"',102,102],['4 × 6"',102,152],['6 × 6"',152,152],['6 × 8"',152,203],['8 × 8"',203,203],['10 × 10"',254,254]];
const DA_TRAY_WIDTH=[100,150,200,300,450,600,750,900];
const DA_PARALLEL_MIN_INDEX=8;
function daTramos(){
 const c=liCalcular();
 if(!c.ok)return {ok:false,errors:c.errs||[]};
 return {ok:true,calc:c,rutas:c.tramos.map((t,i)=>({
  id:i,nombre:t.nombre,metros:t.metros,corriente:t.corriente,
 }))};
}
function daNcc(){
 const system=liValue('sistema');
 // Conservador: neutro se cuenta portador en 3F+N por posible contenido armónico no lineal.
 return system==='3f4h'?4:system==='3f3h'?3:system==='1f3h'?3:2;
}
function daAgrupacion(n){
 if(n<=3)return 1;
 if(n<=6)return .8;
 if(n<=9)return .7;
 if(n<=20)return .5;
 if(n<=30)return .45;
 if(n<=40)return .4;
 return .35;
}
function daConduitTotalArea(gauge,sys){
 const phases=String(sys).startsWith('3f')?3:sys==='1f3h'?2:1;
 const neutral=['3f4h','1f2h','1f3h'].includes(sys)?1:0;
 // Neutral y protección del mismo calibre que las fases únicamente como reserva geométrica conservadora.
 return {cantidad:phases+neutral+1,phase:phases,neutral,pe:1,area:(phases+neutral+1)*gauge[3]};
}
function daFillConduit(area,quantity,type){
 const limit=quantity===1?.53:quantity===2?.31:.40;
 const pipes=DA_CONDUIT[type]||[];
 const selected=pipes.map(([nombre,d])=>({nombre,diametro:d,disponible:Math.PI*d*d/4*limit,ocupacion:area/(Math.PI*d*d/4)*100})).find(t=>t.disponible+1e-8>=area);
 return selected?{...selected,limit:limit*100}:null;
}
function daWireOptions(amps,meters,system,voltage,ft=1,fa=1,dropLimit=3,material='cobre'){
 if(material!=='cobre'||!(amps>0)||!(voltage>0))return [];
 const factor=daAgrupacion(daNcc())*ft*fa;
 if(!(factor>0&&factor<=1))return [];
 const times=Number.isFinite(meters)&&meters>=0?meters:null;
 const options=[];
 for(let sets=1;sets<=4;sets++){
  const ampPer=amps/sets;
  const first=sets>1?DA_PARALLEL_MIN_INDEX:0;
  for(let wi=first;wi<DA_WIRES.length;wi++){
   const wire=DA_WIRES[wi];
   const correctedAmpacity=wire[1]*factor;
   if(correctedAmpacity<ampPer)continue;
   const drop=times===null?null:((String(system).startsWith('3f')?Math.sqrt(3):2)*ampPer*wire[2]*1.22*times/1000/voltage*100);
   if(drop!==null&&drop>dropLimit)continue;
   const group=daConduitTotalArea(wire,system);
   const emt=daFillConduit(group.area,group.cantidad,'EMT');
   const lfmc=daFillConduit(group.area,group.cantidad,'LFMC (liquidtight metálico)');
   const areaCombined=group.area*sets;
   const duct=DA_DUCTOS.find(x=>x[1]*x[2]*.20>=areaCombined);
   const ductArea=duct?duct[1]*duct[2]:null;
   // Solo guía geométrica. Para charola validar tipo de cable, artículo 392-22 y ampacidad 392-80.
   const canTray=wi>=DA_PARALLEL_MIN_INDEX&&wi<=11;
   const trayDia=canTray?group.cantidad*wire[4]*sets:null;
   const tray=trayDia!==null?DA_TRAY_WIDTH.find(w=>w>=trayDia):null;
   options.push({
    sets,calibre:wire[0],ampacidadCable:correctedAmpacity,ampacidadTotal:correctedAmpacity*sets,
    amperiosPorConductor:ampPer,corrienteObjetivo:amps,longitud:times,
    areaPorJuego:group.area,areaConductorTotal:areaCombined,metalesTotal:sets*group.cantidad,
    areaMetalComparacion:wire[3]*sets*group.phase,numeroPorFase:sets,
    conductoresPorJuego:group.cantidad,numeroNeutros:group.neutral*sets,numeroTierra:sets,
    numeroFases:group.phase*sets,drop,voltageEnd:drop===null?null:voltage*(1-drop/100),
    emt,lfmc,duct:duct?{nombre:duct[0],ocupacion:areaCombined/ductArea*100}:null,
    tray:tray?{ancho:tray,sumaDiametros:trayDia}:null,
    groupFactor:daAgrupacion(daNcc()),ft,fa,
    requiresReview:true
   });
   break; // Primero que cumple por ampacidad y caída de tensión para cada número de juegos.
  }
 }
 return options.sort((a,b)=>a.areaConductorTotal-b.areaConductorTotal||a.sets-b.sets);
}
function daComparar(){
 const t=daTramos();
 if(!t.ok)return {ok:false,errors:t.errors};
 const sys=liValue('sistema'),v=liN('voltaje'),ft=liN('tempFactor'),fa=liN('agrupFactor'),m=liValue('material'),caida=liN('caidaMax');
 // Si falta un factor, se muestra un resultado hipotético explícitamente sin liberar el proyecto.
 const corregidos=Number.isFinite(ft)&&ft>0&&ft<=1&&Number.isFinite(fa)&&fa>0&&fa<=1;
 const multiplierTemp=Number.isFinite(ft)&&ft>0&&ft<=1?ft:1,multiplierAgr=Number.isFinite(fa)&&fa>0&&fa<=1?fa:1;
 const maxDrop=Number.isFinite(caida)&&caida>0&&caida<=10?caida:3;
 const routes=t.rutas.map(route=>{
  const list=daWireOptions(route.corriente,route.metros,sys,v,multiplierTemp,multiplierAgr,maxDrop,m);
  const id='da_elegida_'+route.id;
  const saved=Number(liData()[id]),index=Number.isInteger(saved)&&saved>=0&&saved<list.length?saved:0;
  return {...route,options:list,elegida:list[index]||null,elegidaIndex:index};
 });
 return {ok:true,routes,validado:corregidos,sys,v,dropLimit:maxDrop,material:m,calc:t.calc};
}
function daCambioOption(route,index){
 const r=daComparar();if(!r.ok)return;
 const group=r.routes[route];
 if(!group||index<0||index>=group.options.length)return;
 liData()['da_elegida_'+route]=String(index);
 guardarEstado();
 const out=document.getElementById('da-tabla-opciones');
 if(out)out.innerHTML=daMarkup();
}
function daOptionDetails(o){
 const fmt=x=>x===null||x===undefined?'Pendiente':liFmt(x,2);
 const e=liEsc;
 return '<div class="da-details">'+
 '<div><b>'+o.sets+' juego(s)</b> · '+o.calibre+' Cu · '+o.numeroPorFase+' conductor(es) por fase</div>'+
 '<div>'+o.conductoresPorJuego+' cables por juego (incluye neutro y PE completos) · '+o.sets+' canalización(es) independiente(s) para los juegos en paralelo</div>'+
 '<div>Ampacidad corregida por cable: '+fmt(o.ampacidadCable)+' A · Total: '+fmt(o.ampacidadTotal)+' A · Corriente por juego: '+fmt(o.amperiosPorConductor)+' A</div>'+
 '<div>EMT: '+(o.emt?e(o.emt.nombre)+'" (ocupación '+fmt(o.emt.ocupacion)+'%)':'Fuera de catálogo')+
 ' · Liquidtight LFMC: '+(o.lfmc?e(o.lfmc.nombre)+'" (ocupación '+fmt(o.lfmc.ocupacion)+'%)':'Fuera de catálogo')+'</div>'+
 '<div>Ducto metálico 20%: '+(o.duct?e(o.duct.nombre)+' (ocupación '+fmt(o.duct.ocupacion)+'%)':'Requiere sección superior / fabricante')+
 ' · Charola malla: '+(o.tray?'Ancho orientativo ≥'+o.tray.ancho+' mm (sin separación adicional)':'Validación específica Art. 392')+'</div>'+
 '<div>Caída estimada: '+fmt(o.drop)+'% · Voltaje calculado al extremo: '+fmt(o.voltageEnd)+' V</div>'+
 '</div>';
}
function daMarkup(){
 const r=daComparar();
 if(!r.ok)return '<div class="li-result"><b>Faltan datos de carga para comparar arreglos.</b></div>';
 const msg=r.validado?'Factores de corrección capturados.':'Factores de temperatura/agrupamiento incompletos: resultados hipotéticos con 1.00 en los campos faltantes.';
 return '<section class="li-result da-result"><h3>Comparador automático de conductores y canalizaciones</h3>'+
 '<p><b>Cu THHN/THWN-2 a 75 °C</b> · Máximo '+liFmt(r.dropLimit,1)+'% de caída por tramo · Paralelos únicamente desde 1/0 AWG. Selección orientativa, NO liberada para construcción.</p>'+
 '<p class="li-note">'+liEsc(msg)+'</p>'+
 (r.material!=='cobre'?'<p>No hay tabla verificada para aluminio. Selecciona cobre si deseas ver alternativas; aluminio permanece pendiente de ingeniería.</p>':
 r.routes.map(route=>'<article class="da-route">'+
 '<h4>'+liEsc(route.nombre)+' · '+liFmt(route.corriente,1)+' A · '+(Number.isFinite(route.metros)?liFmt(route.metros,1)+' m':'Longitud pendiente')+'</h4>'+
 (route.options.length?'<label class="label" for="da-select-'+route.id+'">Arreglo / cantidad de juegos</label><select class="input select" id="da-select-'+route.id+'" onchange="daCambioOption('+route.id+',Number(this.value))">'+
 route.options.map((o,i)=>'<option value="'+i+'" '+(i===route.elegidaIndex?'selected':'')+'>'+o.sets+' juego(s) × '+liEsc(o.calibre)+' — '+liFmt(o.areaConductorTotal,0)+' mm² aislado total</option>').join('')+
 '</select>'+daOptionDetails(route.elegida):'<p>Con los datos actuales no se encontró un arreglo dentro de la tabla y límite de caída. Requiere diseño particular.</p>')+
 '</article>').join(''))+
 '<div class="li-note">La comparación por menor sección total de cable aislado NO equivale a menor costo. PE, neutro, protecciones, número de circuitos activos, instalación, cortocircuito, calibre permitido en terminales, curvas, distancia real y restricciones del fabricante requieren confirmación. Charola: analizar artículos 392-10, 392-22 y 392-80; no todos los cables sueltos son aptos.</div></section>';
}
function daMarkupReport(){
 const c=daComparar();
 if(!c.ok)return '<h2>Alternativas de cableado</h2><div class="sb">No hay datos suficientes para comparar arreglos.</div>';
 return '<h2>Alternativas preliminares de cable y canalización</h2><div class="sb"><p>Conductores Cu THHN/THWN-2, sección y calibre de referencia; paralelo de potencia solo ≥1/0 AWG (NOM-001-SEDE, 310-10(h)). No constituye aprobación para compra o instalación.</p>'+
 (!c.validado?'<p style="color:#a25c00"><b>NO VALIDADO:</b> faltan factores de corrección de instalación.</p>':'')+
 c.routes.map(route=>'<div class="report-block" style="border:1px solid #dbe3ef;padding:10px;margin:10px 0">'+
 '<b>'+liEsc(route.nombre)+'</b><div>Corriente base: '+liFmt(route.corriente,1)+' A · Longitud: '+liFmt(route.metros,1)+' m</div>'+
 (route.elegida?daOptionDetails(route.elegida):'<p>Sin solución tabulada; pendiente de estudio.</p>')+
 '</div>').join('')+
 '<p>Las dimensiones de EMT/LFMC son mínimos por ocupación geométrica y no suponen factibilidad de tendido. El ducto rectangular usa un 20% de sección interior. La charola de malla requiere verificación reglamentaria independiente. Neutro y PE se reservaron provisionalmente del mismo calibre por juego; verificar protección, armónicos y puesta a tierra.</p></div>';
}

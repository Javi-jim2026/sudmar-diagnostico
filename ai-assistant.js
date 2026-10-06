// Asistente de redacción SUDMAR - comparte backend seguro con Service Platform
const SUDMAR_AI_BASE='https://dakmaopqemivlcuiyxix.supabase.co';
const SUDMAR_AI_KEY='sb_publishable_RIVwhx5SMuHhDGMnONzBZQ_awSbzdSW';

function aiProtectedTerms(text){
  const terms=new Set([S.modeloEquipo,S.serieEquipo,S.marcaMotor,S.modeloMotor,S.serieMotor,S.marcaAlt,S.modeloAlt,S.serieAlt].filter(Boolean));
  const unit=/\b\d+(?:[.,]\d+)?\s?(?:VCA|VDC|VAC|V|kW|kVA|Hz|RPM|A|Ah|bar|psi|°C|mm|cm|kg|L|%)\b/gi;
  for(const m of String(text||'').matchAll(unit))terms.add(m[0]);
  const code=/\b(?=[A-Z0-9/_-]{3,}\b)(?=[A-Z0-9/_-]*\d)[A-Z0-9][A-Z0-9/_-]*\b/g;
  for(const m of String(text||'').matchAll(code))terms.add(m[0]);
  return [...terms].slice(0,80);
}

async function callWritingAssistant(mode,text){
  const response=await fetch(SUDMAR_AI_BASE+'/functions/v1/sudmar-text-assistant',{
    method:'POST',
    headers:{'Content-Type':'application/json',apikey:SUDMAR_AI_KEY,Authorization:'Bearer '+SUDMAR_AI_KEY,'X-SUDMAR-CLIENT':'service-platform'},
    body:JSON.stringify({mode,text,protectedTerms:aiProtectedTerms(text)})
  });
  let body={};try{body=await response.json();}catch(e){}
  if(!response.ok)throw new Error(body&&body.error?body.error:'No se pudo generar la propuesta');
  if(!body||!body.text)throw new Error('La IA no devolvió una propuesta');
  return String(body.text).trim();
}

function getAIField(ref){
  if(ref.startsWith('fallaDesc|')){const k=ref.split('|')[1];return (S.fallaDesc&&S.fallaDesc[k])||'';}
  return String(S[ref]||'');
}
function setAIField(ref,val){
  if(ref.startsWith('fallaDesc|')){const k=ref.split('|')[1];if(!S.fallaDesc)S.fallaDesc={};S.fallaDesc[k]=val;}else S[ref]=val;
  guardarEstado();render();
}
function contextoConfirmadoIA(ref){
  const fallas=[];
  for(const [k,v] of Object.entries(S.checks||{})){if(v==='mal'){const d=S.fallaDesc&&S.fallaDesc[k];if(d)fallas.push(d);}}
  const actual=getAIField(ref);const datos=[];
  if(S.modeloEquipo)datos.push('Modelo de equipo: '+S.modeloEquipo);
  if(S.serieEquipo)datos.push('Serie: '+S.serieEquipo);
  if(S.estatus)datos.push('Estatus: '+S.estatus);
  if(fallas.length)datos.push('Hallazgos confirmados: '+fallas.join('; '));else if(S.hallazgos)datos.push('Hallazgos confirmados: '+S.hallazgos);
  return (actual?actual+'\n\n':'')+datos.join('\n');
}

async function abrirAsistente(ref,mode){
  let base=getAIField(ref).trim();
  if(mode==='technical')base=contextoConfirmadoIA(ref).trim();
  if(!base)return showAlert('⚠️ Escribe primero una idea o registra hallazgos para que la IA pueda trabajar sin inventar datos');
  const overlay=document.createElement('div');
  overlay.id='ai-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.58);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px';
  const card=document.createElement('div');
  card.style.cssText='background:#fff;border-radius:14px;max-width:520px;width:100%;max-height:88vh;overflow:auto;padding:18px';
  card.innerHTML='<div style="font-size:16px;font-weight:800;color:#0a2240;margin-bottom:5px">'+(mode==='technical'?'💡 Sugerencia de redacción técnica':'✨ Mejorar redacción')+'</div><div style="font-size:12px;color:#64748b;margin-bottom:12px">La propuesta no sustituirá tu texto hasta que la aceptes.</div><div id="ai-status" style="padding:12px;background:#f8fafc;border-radius:8px;font-size:13px">Generando propuesta…</div><textarea id="ai-proposal" class="input" rows="9" style="display:none;margin-top:10px"></textarea><div id="ai-error" style="color:#b91c1c;font-size:12px;margin-top:8px"></div><div style="display:flex;gap:8px;margin-top:14px"><button type="button" id="ai-cancel" class="btn" style="background:#e5e7eb;color:#1f2937">Cancelar</button><button id="ai-accept" type="button" class="btn" style="display:none;background:#1a5fa8;color:#fff">Aceptar propuesta</button></div>';
  overlay.appendChild(card);document.body.appendChild(overlay);
  card.querySelector('#ai-cancel').onclick=()=>overlay.remove();
  try{
    const proposal=await callWritingAssistant(mode,base);
    const ta=card.querySelector('#ai-proposal');ta.value=proposal;ta.style.display='block';
    card.querySelector('#ai-status').style.display='none';
    const accept=card.querySelector('#ai-accept');accept.style.display='block';
    accept.onclick=()=>{setAIField(ref,ta.value.trim());overlay.remove();};
  }catch(e){card.querySelector('#ai-status').textContent='No se generó ninguna propuesta.';card.querySelector('#ai-error').textContent=e.message;}
}

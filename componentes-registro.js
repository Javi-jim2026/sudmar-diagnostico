// Registro flexible de filtros y componentes; solo captura local del informe.
function partesEsc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function partesListado() {
  if (!Array.isArray(S.partesRegistro)) S.partesRegistro=[];
  return S.partesRegistro;
}
function partesFotos(p) {
  const key='parte_'+p.id;
  return Array.isArray(S.fG?.[key]) ? S.fG[key] : [];
}
function partesNuevo() {
  partesListado().push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,9),nombre:'',parte:'',cantidad:'1',accion:S.tipoServicio==='levantamiento'?'identificado':'reemplazado'});
  render();
}
function partesCampo(i,campo,valor) {
  const p=partesListado()[i];
  if(!p || !['nombre','parte','cantidad','accion'].includes(campo))return;
  p[campo]=String(valor);
  guardarEstado();
}
function partesQuitar(i) {
  const p=partesListado()[i];if(!p)return;
  delete S.fG['parte_'+p.id];
  partesListado().splice(i,1);
  programarGuardadoFotos();render();
}
function partesQuitarFoto(i,j) {
  const p=partesListado()[i];if(!p)return;
  const fotos=partesFotos(p);fotos.splice(j,1);
  programarGuardadoFotos();render();
}
function partesSeccion() {
  return `<section class="registro-partes" aria-label="Filtros y componentes identificados o reemplazados">
    <div class="section-title">🔩 Filtros y componentes</div>
    <div class="section-sub">Identifica cada filtro o componente por su número de parte, una fotografía o ambos. Ninguno de los dos es obligatorio. Puedes terminar el informe posteriormente.</div>
    ${partesListado().map((p,i)=>`
      <div class="parte-captura">
        <div class="parte-titulo"><strong>Componente ${i+1}</strong><button type="button" onclick="partesQuitar(${i})" aria-label="Quitar componente ${i+1}">✕ Quitar</button></div>
        <div class="field"><label class="label" for="parte-nombre-${i}">Tipo de filtro o componente (opcional)</label><input class="input" id="parte-nombre-${i}" placeholder="Ej. Filtro de combustible" value="${partesEsc(p.nombre)}" oninput="partesCampo(${i},'nombre',this.value)"></div>
        <div class="input-row">
          <div class="field"><label class="label" for="parte-codigo-${i}">Número de parte (opcional)</label><input class="input" id="parte-codigo-${i}" placeholder="Ej. 1234567" value="${partesEsc(p.parte)}" oninput="partesCampo(${i},'parte',this.value)"></div>
          <div class="field"><label class="label" for="parte-cantidad-${i}">Cantidad</label><input class="input" id="parte-cantidad-${i}" type="number" min="1" step="1" value="${partesEsc(p.cantidad||'1')}" oninput="partesCampo(${i},'cantidad',this.value)"></div>
        </div>
        <div class="field"><label class="label" for="parte-accion-${i}">Registro</label><select class="input select" id="parte-accion-${i}" onchange="partesCampo(${i},'accion',this.value)">
          ${[['identificado','Identificado en el equipo'],['reemplazado','Reemplazado / instalado'],['recomendado','Recomendado / pendiente']].map(([v,l])=>`<option value="${v}" ${p.accion===v?'selected':''}>${l}</option>`).join('')}
        </select></div>
        <div class="parte-fotobotones"><button type="button" onclick="openCamera('parte_${p.id}','gen')">📷 Tomar foto</button><button type="button" onclick="openGallery('parte_${p.id}','gen')">📁 Elegir foto</button></div>
        ${partesFotos(p).length?`<div class="parte-fotos">${partesFotos(p).map((src,j)=>`<div class="parte-foto"><img src="${partesEsc(src)}" alt="Referencia visual del componente ${i+1}"><button type="button" aria-label="Eliminar foto" onclick="partesQuitarFoto(${i},${j})">✕</button></div>`).join('')}</div>`:'<p class="parte-nota">Sin fotografía. Puedes conservar únicamente el número de parte.</p>'}
      </div>`).join('')}
    <button type="button" class="parte-agregar" onclick="partesNuevo()">＋ Agregar filtro o componente</button>
  </section>`;
}
function partesReporte() {
  const items=partesListado().filter(p=>String(p.nombre||'').trim()||String(p.parte||'').trim()||partesFotos(p).length);
  if(!items.length)return '';
  const estados={identificado:'Identificado en el equipo',reemplazado:'Reemplazado / instalado',recomendado:'Recomendado / pendiente'};
  return `<h2>3c. Registro de filtros y componentes</h2>
    <div class="sb">${items.map((p,i)=>`<div class="report-block" style="border:1px solid #dbe2ea;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="font-weight:700;color:#0a2240;font-size:13px">${i+1}. ${partesEsc(p.nombre||'Componente identificado')}</div>
      <div style="font-size:12px;margin-top:5px">Registro: ${partesEsc(estados[p.accion]||'Sin clasificar')} · Cantidad: ${partesEsc(p.cantidad||'1')}</div>
      <div style="font-size:12px;margin-top:5px">Número de parte: <strong>${partesEsc(p.parte||'No registrado (ver fotografía)')}</strong></div>
      ${partesFotos(p).length?`<div class="photo-large-grid" style="margin-top:10px">${partesFotos(p).map(src=>`<img class="photo-large" src="${partesEsc(src)}" alt="Fotografía de referencia de filtro o componente">`).join('')}</div>`:''}
    </div>`).join('')}</div>`;
}

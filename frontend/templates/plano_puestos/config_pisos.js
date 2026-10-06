// ---------- configuración de pisos (adaptar.py pega esto antes del inicio de la app) ----------
// Administración → "Configuración de pisos": lista todos los pisos y deja ir a cualquiera, duplicarlo o
// eliminarlo, y crear uno nuevo. Duplicar copia el plano y los puestos (número, zona, nota, giro y bloques);
// si se marca, también las personas, sus puestos asignados y los fijados. Los pisos copiados comparten la
// imagen del plano. El Piso 5 también se duplica: la copia usa su plano de arquitectura (base:'p5'), pero ahí
// los puestos sí se mueven. El Piso 5 no se elimina: sus datos son los de siempre, no un piso agregado.
// Al eliminar un piso, local_db.js borra también sus datos y la imagen si ningún otro piso la usa.
const floorCol = (fid, name) => fid === 'p5' ? name : (ADMIN_COLS.has(name) ? 'admin-pisos/' : 'pisos/') + fid + '/' + name;
const floorLabel = fid => fid === 'p5' ? 'Piso 5' : ((floors.get(fid) || {}).name || 'Piso');
const floorIds = () => ['p5', ...[...floors].sort((a, b) => String(a[1].name).localeCompare(String(b[1].name), 'es')).map(([id]) => id)];

async function duplicateFloor(src, name, ppl){
  const m = src === 'p5' ? {base:'p5'} : floors.get(src);
  if(!m) throw new Error('no existe');
  const fid = uid('f'), items = [], p5ids = new Set(P5.layout.seats.map(s => s.id));
  for(const c of ['plano', ...(ppl ? ['personas', 'asig', 'fijos'] : [])]){
    const snap = await db.collection(floorCol(src, c)).get();
    for(const d of snap.docs){
      let v = d.data();
      // En Piso 5 manda el plano de arquitectura: de lo guardado solo valen número, zona, nota y si se quitó.
      if(src === 'p5' && c === 'plano'){
        if(!p5ids.has(d.id)) continue;
        const o = {}; for(const k of ['num', 'note', 'area', 'deleted']) if(v[k] != null) o[k] = v[k]; v = o;
      }
      items.push([floorCol(fid, c) + '/' + d.id, v]);
    }
  }
  const r = await pool(items, 4, ([path, v]) => db.doc(path).set(v));
  if(r.fail) throw new Error('copia incompleta');
  const meta = m.base === 'p5' ? {name, base:'p5', bg:'', w:P5.layout.w, h:P5.layout.h, scale:+m.scale || 1}
    : {name, bg:m.bg || '', w:+m.w || 1000, h:+m.h || 700, scale:+m.scale || 1};
  Object.assign(meta, {by:meId, at:new Date().toISOString()});
  await db.doc('admin-pisos/' + fid).set(meta);
  floors.set(fid, meta);
  return fid;
}
async function deleteFloor(fid){
  const m = floors.get(fid);
  if(fid === 'p5' || !m) return;
  if(FID === fid) switchFloor('p5');
  await serial('admin-pisos/' + fid, () => db.doc('admin-pisos/' + fid).delete());
  if(assets && m.bg && ![...floors].some(([k, f]) => k !== fid && f.bg === m.bg)) assets.delete(m.bg).catch(() => {});
}
{
  // Un piso copiado del Piso 5 usa su plano de arquitectura, salas, ascensores, baños e impresoras.
  const baseMeta = applyFloorMeta;
  applyFloorMeta = function(){
    baseMeta();
    const m = FID !== 'p5' && floors.get(FID);
    if(!m || m.base !== 'p5') return;
    LAYOUT = {...P5.layout, seats:P5.layout.seats.map(s => ({...s})), bg:''};
    ARCH = P5.arch; ROOMS = P5.rooms; ELEVS = P5.elevs; BANOS = P5.banos; PRINTERS = P5.printers;
    LAYOUT_IDS = new Set(LAYOUT.seats.map(s => s.id));
    drawBackground(); bump();
  };

  $('#adminB').insertAdjacentHTML('afterend', '<button id="pisosB" hidden title="Ver todos los pisos, duplicarlos, eliminarlos o crear uno nuevo">Configuración de pisos</button>');
  const pane = document.createElement('div');
  pane.id = 'pisosPane'; pane.setAttribute('role', 'dialog'); pane.setAttribute('aria-label', 'Configuración de pisos'); pane.hidden = true;
  document.body.appendChild(pane);
  // Mismo aspecto que la ventana del reporte semanal (se copian sus reglas de estilo).
  const css = [];
  for(const sh of document.styleSheets){ let rules; try{ rules = sh.cssRules; }catch(e){ continue; } for(const r of rules) if(r.selectorText && r.selectorText.includes('#repPane')) css.push(r.cssText.replace(/#repPane/g, '#pisosPane')); }
  css.push('#pisosPane .cpr{border-top:1px solid var(--line,#d9e1ec);padding:10px 0}#pisosPane .cpr:first-child{border-top:0}',
    '#pisosPane .cph{display:flex;align-items:center;gap:10px;flex-wrap:wrap}#pisosPane .cpn{flex:1;min-width:160px}#pisosPane .cpn .hint{display:block;margin:2px 0 0}',
    '#pisosPane .cpf{margin-top:8px;padding:10px 12px;border-radius:10px;background:var(--bg,#f4f7fb)}');
  const st = document.createElement('style'); st.textContent = css.join('\n'); document.head.appendChild(st);

  function renderPisosPane(){
    const s = ui.pisos;
    if(!s || !ui.isAdmin || !db){ pane.hidden = true; return; }
    if(!pane.hidden && pane.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return; // no borrar lo que se escribe
    const rows = floorIds().map(fid => {
      const name = floorLabel(fid), m = floors.get(fid) || {};
      const desc = fid === 'p5' ? 'Plano de arquitectura. No se puede eliminar.' : m.base === 'p5' ? 'Copia del plano del Piso 5.' : 'Plano desde imagen.';
      return `<div class="cpr"><div class="cph"><div class="cpn"><b>${esc(name)}</b>${fid === FID ? ' · <span style="color:var(--muted)">estás aquí</span>' : ''}<span class="hint">${desc}</span></div>
        <div class="btns">${fid === FID ? '' : `<button data-cpgo="${esc(fid)}">Ir</button>`}<button data-cpdup="${esc(fid)}">Duplicar</button>${fid === 'p5' ? '' : `<button class="danger" data-cpdel="${esc(fid)}">Eliminar</button>`}</div></div>
        ${s.dup === fid ? `<div class="cpf"><div class="invf"><label for="cpName">Nombre del piso nuevo</label><input id="cpName" maxlength="40" placeholder="${esc(name + ' (copia)')}"></div>
          <label class="chk" style="display:flex;gap:6px;align-items:center;margin:6px 0"><input type="checkbox" id="cpPpl"> Copiar también las personas y sus puestos</label>
          <p class="hint" style="margin:0 0 8px">Se copian el plano y los puestos (número, zona, nota, giro y bloques).${fid === 'p5' || m.base === 'p5' ? ' En la copia los puestos se pueden mover.' : ''}</p>
          <div class="btns"><button class="primary" id="cpDupOk" ${s.busy ? 'disabled' : ''}>${s.busy ? 'Duplicando…' : 'Duplicar'}</button><button id="cpNo">Cancelar</button></div></div>` : ''}
        ${s.del === fid ? `<div class="cpf"><p style="margin:0 0 8px">¿Eliminar <b>${esc(name)}</b>? Se borran sus puestos, personas y asignaciones. Solo se recupera con un respaldo.</p>
          <div class="btns"><button class="danger" id="cpDelOk" ${s.busy ? 'disabled' : ''}>Sí, eliminar</button><button id="cpNo">No</button></div></div>` : ''}</div>`;
    }).join('');
    pane.innerHTML = `<section class="admbox"><h2>Configuración de pisos<span style="flex:1"></span><button id="cpX" aria-label="Cerrar">✕</button></h2>
      <p class="hint" style="margin:2px 0 8px">Cada piso tiene sus propios puestos, personas y asignaciones.</p>
      <div>${rows}</div>
      <div class="btns" style="margin-top:12px"><button class="primary" id="cpNew">+ Crear piso nuevo</button></div></section>`;
    pane.hidden = false;
  }
  const openPisos = () => { ui.pisos = {dup:null, del:null}; ui.admin = false; ui.rep = null; render(); };
  $('#pisosB').onclick = openPisos;
  pane.onclick = async e => {
    const t = e.target.closest('button'); if(!t) return;
    const s = ui.pisos; if(!s) return;
    if(t.id === 'cpX'){ ui.pisos = null; renderPisosPane(); return; }
    if(t.id === 'cpNo'){ s.dup = s.del = null; renderPisosPane(); return; }
    if(t.dataset.cpgo){ ui.pisos = null; switchFloor(t.dataset.cpgo); return; }
    if(t.dataset.cpdup){ s.dup = t.dataset.cpdup; s.del = null; renderPisosPane(); setTimeout(() => { const i = $('#cpName'); if(i) i.focus(); }, 30); return; }
    if(t.dataset.cpdel){ s.del = t.dataset.cpdel; s.dup = null; renderPisosPane(); return; }
    if(t.id === 'cpNew'){ ui.pisos = null; ui.admin = true; ui.newFloor = true; ui.openK['adm:Pisos'] = true; ui.mode = 'asignar'; render(); setTimeout(() => { const i = $('#nfName'); if(i){ i.scrollIntoView({block:'center'}); i.focus(); } }, 50); return; }
    if(t.id === 'cpDupOk'){
      const src = s.dup, name = ($('#cpName').value || '').trim() || floorLabel(src) + ' (copia)', ppl = $('#cpPpl').checked;
      if(floorIds().some(f => floorLabel(f).trim().toLowerCase() === name.toLowerCase())) return toast(`Ya hay un piso llamado ${name}. Elige otro nombre.`);
      s.busy = true; t.disabled = true; t.textContent = 'Duplicando…';
      try{
        const fid = await duplicateFloor(src, name, ppl);
        ui.pisos = null; switchFloor(fid);
        const n = seats().length;
        toast(`${name} creado como copia de ${floorLabel(src)}: ${n} puesto${n === 1 ? '' : 's'}${ppl ? ' con sus personas' : ', sin personas'}.`);
      }catch(err){ s.busy = false; renderPisosPane(); toast('No se pudo duplicar el piso. Inténtalo de nuevo.'); }
      return;
    }
    if(t.id === 'cpDelOk'){
      const fid = s.del, name = floorLabel(fid);
      s.busy = true; renderPisosPane();
      try{ await deleteFloor(fid); s.del = null; toast(`${name} eliminado`); }
      catch(err){ toast('No se pudo eliminar el piso. Inténtalo de nuevo.'); }
      s.busy = false; renderPisosPane();
    }
  };
  // Cerrar con Escape o con un clic fuera de la ventana.
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && ui.pisos){ ui.pisos = null; renderPisosPane(); } });
  document.addEventListener('click', e => {
    if(!ui.pisos || !e.target.isConnected || pane.contains(e.target) || e.target.closest('#pisosB,.menu')) return;
    ui.pisos = null; renderPisosPane();
  });
  // Administración → Pisos lleva a la configuración de pisos.
  const baseAdm = renderAdminPane;
  renderAdminPane = function(){
    baseAdm();
    const p = $('#adminPane');
    if(p.hidden || p.querySelector('#cpOpen')) return;
    const h = [...p.querySelectorAll('h3,summary')].find(x => x.textContent.trim() === 'Pisos');
    if(h) h.insertAdjacentHTML('afterend', '<div class="btns"><button id="cpOpen">Configuración de pisos: duplicar o eliminar cualquier piso</button></div>');
  };
  document.addEventListener('click', e => { if(e.target.closest('#cpOpen')){ e.stopPropagation(); openPisos(); } }, true);

  const baseRender = render;
  render = function(){
    baseRender();
    $('#pisosB').hidden = !(ui.isAdmin && db);
    renderPisosPane();
  };
}

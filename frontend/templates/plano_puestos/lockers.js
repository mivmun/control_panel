// ---------- lockers (adaptar.py pega esto antes del inicio de la app) ----------
// Piso 5: el closet de Oficina A (18 lockers) y el de Oficina B (20) son un botón en el plano. Al tocarlo se abre
// a la derecha la lista de lockers de esa oficina: número, a quién pertenece (de Personal GING) y cuántas llaves hay.
// Se guarda en la colección 'lockers' del piso, un documento por locker (A01…A18, B01…B20):
// {usuario, nombre, llaves, nota}. El nombre se guarda también para verlo fuera del panel (sin Personal GING).
// Al liberar un locker se conservan sus llaves: son del locker, no de la persona.
const LOCKER_SETS = [
  // Recuadro = el closet del plano de arquitectura, un poco hacia adentro de los tabiques.
  {id:'A', name:'Oficina A', n:18, x:277, y:620.5, w:196, h:23, cols:18},
  {id:'B', name:'Oficina B', n:20, x:276.5, y:167, w:57.5, h:19.5, cols:10},
];
let lockers = new Map();
const hasLockers = () => FID === 'p5' || (floors.get(FID) || {}).base === 'p5';
const lkId = (set, i) => set.id + String(i).padStart(2, '0');
function lkOwner(d){
  if(!d) return '';
  const g = d.usuario && GING && GING.get(d.usuario);
  return g ? g.nombre : (d.nombre || '');
}
const lkKeys = d => d && Number.isInteger(d.llaves) ? d.llaves : null;
function lkStats(set){
  let occ = 0, keys = 0, nokey = 0;
  for(let i = 1; i <= set.n; i++){
    const d = lockers.get(lkId(set, i)), k = lkKeys(d);
    if(lkOwner(d)) occ++;
    if(k != null) keys += k;
    if(k === 0) nokey++;
  }
  return {occ, free:set.n - occ, keys, nokey};
}
const LK_KEY = '<svg class="lkey" width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><circle cx="7.5" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M11.5 12H21v3.5M17 12v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

$('#labels').insertAdjacentHTML('afterend', '<g id="lockers"></g>');
$('#seatPane').insertAdjacentHTML('beforebegin', '<div id="lockerPane" hidden></div>');

// Botón en el plano: el closet con sus lockers dibujados (azul = asignado) y una etiqueta al centro.
function renderLockers(){
  const g = $('#lockers');
  if(!hasLockers()){ g.innerHTML = ''; return; }
  g.innerHTML = LOCKER_SETS.map(set => {
    const st = lkStats(set), rows = Math.ceil(set.n / set.cols), pad = 1.5;
    const cw = (set.w - pad * 2) / set.cols, ch = (set.h - pad * 2) / rows;
    let cells = '';
    for(let i = 1; i <= set.n; i++){
      const c = (i - 1) % set.cols, r = Math.floor((i - 1) / set.cols);
      cells += `<rect class="lkc ${lkOwner(lockers.get(lkId(set, i))) ? 'occ' : ''}" x="${(set.x + pad + c * cw + .4).toFixed(1)}" y="${(set.y + pad + r * ch + .4).toFixed(1)}" width="${(cw - .8).toFixed(1)}" height="${(ch - .8).toFixed(1)}" rx=".6"/>`;
    }
    const small = set.w < 100, txt = small ? `Lockers ${set.n}` : `Lockers · ${st.occ}/${set.n} asignados`;
    const fs = small ? 5.4 : 6.4, pw = txt.length * fs * .56 + 8, cx = set.x + set.w / 2, cy = set.y + set.h / 2;
    return `<g class="lkb ${ui.lk === set.id ? 'sel' : ''}" data-lk="${set.id}" tabindex="0" role="button" aria-label="Lockers ${esc(set.name)}: ${st.occ} de ${set.n} asignados">
      <title>Lockers ${esc(set.name)} · ${st.occ} de ${set.n} asignados · ${st.keys} llave${st.keys === 1 ? '' : 's'}</title>
      <rect class="lkbg" x="${set.x}" y="${set.y}" width="${set.w}" height="${set.h}" rx="2"/>${cells}
      <rect class="lkp" x="${(cx - pw / 2).toFixed(1)}" y="${(cy - fs * .8).toFixed(1)}" width="${pw.toFixed(1)}" height="${(fs * 1.6).toFixed(1)}" rx="${(fs * .8).toFixed(1)}"/>
      <text class="lkt" x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" style="font-size:${fs}px">${esc(txt)}</text></g>`;
  }).join('');
}

// Panel de la derecha: lista de lockers de la oficina; administración asigna dueño, llaves y nota.
function renderLockerPane(){
  const pane = $('#lockerPane'), set = ui.lk && hasLockers() && ui.mode === 'asignar' && LOCKER_SETS.find(s => s.id === ui.lk);
  if(!set){ pane.hidden = true; return; }
  const ae = document.activeElement;
  if(ae && pane.contains(ae) && /^lk_(n|q)/.test(ae.id || '')) return; // no interrumpir mientras se escribe
  const can = !readOnly() && ui.isAdmin, st = lkStats(set), q = norm(ui.lkq || '');
  // Dueños posibles: Personal GING; abierto fuera del panel, las personas del plano.
  const opts = GING
    ? [...GING.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(r => ['u:' + r.usuario, r.nombre])
    : [...people.values()].map(p => ['n:' + p.name, p.name]).sort((a, b) => a[1].localeCompare(b[1], 'es'));
  const rows = [];
  for(let i = 1; i <= set.n; i++){
    const id = lkId(set, i), d = lockers.get(id), who = lkOwner(d), k = lkKeys(d);
    if(q && !norm([i, 'L' + i, who, d && d.nota].join(' ')).includes(q)) continue;
    const on = ui.lkSel === id;
    let ed = '';
    if(on && can){
      const cur = d && d.usuario ? 'u:' + d.usuario : who ? 'n:' + who : '';
      const list = cur && !opts.some(o => o[0] === cur) ? [[cur, who + ' (no está en Personal GING)'], ...opts] : opts;
      const dk = ui.lkDraft && ui.lkDraft.id === id ? ui.lkDraft.k : (k ?? 0);
      ed = `<div class="lked">
        <div class="invf"><label for="lk_o">Pertenece a</label><select id="lk_o"><option value="">Libre (sin dueño)</option>${list.map(([v, n]) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
        <label>Llaves</label><div class="stock" style="margin:0"><button id="lkMinus" aria-label="Una llave menos">−</button><span class="n" id="lkK">${dk}</span><button id="lkPlus" aria-label="Una llave más">+</button><span>${dk === 1 ? 'llave' : 'llaves'}</span></div>
        <label for="lk_n">Nota</label><input id="lk_n" maxlength="120" value="${esc(d && d.nota || '')}" placeholder="Ej.: llave en recepción, candado propio…" autocomplete="off"></div>
        <div class="btns"><button class="primary" id="lkSave">Guardar locker ${i}</button><button id="lkNo">Cancelar</button></div></div>`;
    }
    rows.push(`<li><button class="srow ${on ? 'on' : ''}" data-lkrow="${id}"><span class="snum ${who ? 'occ' : ''}">${i}</span><span class="sinfo"><b>${esc(who || 'Libre')}</b><span>${esc(d && d.nota || (who ? '' : 'Sin dueño'))}</span></span>
      <span class="lkk ${k === 0 && who ? 'none' : ''}" title="${k == null ? 'Llaves sin registrar' : k + (k === 1 ? ' llave' : ' llaves')}">${LK_KEY}${k == null ? '—' : k}</span></button>${ed}</li>`);
  }
  pane.innerHTML = `<section><h2>Lockers <span class="n">${esc(set.name)}</span><span style="flex:1"></span><button class="link" id="lkX">Cerrar</button></h2>
      <div class="chips">${LOCKER_SETS.map(s => `<button data-lkset="${s.id}" class="${s.id === set.id ? 'on' : ''}">${esc(s.name)} · ${s.n}</button>`).join('')}</div>
      <div class="lksum"><div><b>${set.n}</b><span>lockers</span></div><div><b>${st.occ}</b><span>asignados</span></div><div><b>${st.free}</b><span>libres</span></div><div><b>${st.keys}</b><span>llaves</span></div></div>
      ${st.nokey ? `<div class="low" style="margin-top:8px">⚠ ${st.nokey} locker${st.nokey === 1 ? '' : 's'} sin llave.</div>` : ''}
      <input id="lk_q" placeholder="Buscar por número o persona" value="${esc(ui.lkq || '')}" style="width:100%;margin-top:10px" autocomplete="off">
      ${can ? '<p class="hint">Toca un locker para cambiar su dueño, sus llaves o la nota.</p>' : ''}</section>
    <ul class="slist" id="lklist">${rows.join('') || '<li class="empty">Ningún locker coincide.</li>'}</ul>`;
  pane.hidden = false;
}
function openLockers(id){
  ui.lk = id; ui.lkSel = null; ui.lkDraft = null; ui.lkq = '';
  ui.sel = null; ui.room = null; ui.elev = null; ui.pick = null; ui.confirm = null; ui.gsel = null;
  render();
}
async function saveLocker(id){
  if(!db || readOnly()) return;
  const set = LOCKER_SETS.find(s => s.id === id[0]), i = +id.slice(1), v = $('#lk_o').value;
  const g = v.startsWith('u:') && GING ? GING.get(v.slice(2)) : null;
  const body = {usuario:g ? g.usuario : '', nombre:g ? g.nombre : v.startsWith('n:') ? v.slice(2) : '',
    llaves:ui.lkDraft && ui.lkDraft.id === id ? ui.lkDraft.k : (lkKeys(lockers.get(id)) ?? 0), nota:$('#lk_n').value.trim(), by:meId, at:new Date().toISOString()};
  const ref = dref('lockers', id);
  lockers.set(id, body); ui.lkSel = null; ui.lkDraft = null; render();
  serial(ref.path, () => ref.set(body)).then(() => toast(`Locker ${i} de ${set.name}: ${body.nombre || 'libre'} · ${body.llaves} llave${body.llaves === 1 ? '' : 's'}`)).catch(writeErr);
}
{
  const baseExtra = subscribeExtra;
  subscribeExtra = function(){
    baseExtra();
    lockers = new Map();
    unsubs.push(db.collection(col('lockers')).onSnapshot(s => { lockers = new Map(s.docs.map(x => [x.id, x.data()])); if(pdrag && pdrag.active) return; scheduleRender(); }, failDb));
  };
  // Tocar un puesto, sala, ascensor o impresora cierra los lockers.
  const closing = base => function(...a){ ui.lk = null; return base(...a); };
  onSeatTap = closing(onSeatTap); onRoomTap = closing(onRoomTap); onElevTap = closing(onElevTap);
  openPrint = closing(openPrint); setTab = closing(setTab);

  // Clic (sin arrastrar) en el closet: abre sus lockers.
  let lkdown = null;
  svg.addEventListener('pointerdown', e => { const g = e.target.closest('[data-lk]'); lkdown = g ? {id:g.dataset.lk, x:e.clientX, y:e.clientY} : null; });
  svg.addEventListener('pointerup', e => {
    const d = lkdown; lkdown = null;
    if(!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4 || ui.mode !== 'asignar') return;
    openLockers(ui.lk === d.id ? null : d.id);
  });
  svg.addEventListener('keydown', e => {
    const g = (e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-lk]');
    if(g){ e.preventDefault(); openLockers(g.dataset.lk); }
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && ui.lk){ ui.lk = null; render(); } });

  const pane = $('#lockerPane');
  pane.addEventListener('click', e => {
    const t = e.target.closest('button'); if(!t) return;
    if(t.id === 'lkX'){ ui.lk = null; render(); return; }
    if(t.dataset.lkset){ openLockers(t.dataset.lkset); return; }
    if(t.dataset.lkrow){
      if(!(!readOnly() && ui.isAdmin)) return;
      ui.lkSel = ui.lkSel === t.dataset.lkrow ? null : t.dataset.lkrow; ui.lkDraft = null; renderLockerPane();
      const s = $('#lk_o'); if(s) s.focus();
      return;
    }
    if(t.id === 'lkMinus' || t.id === 'lkPlus'){
      const id = ui.lkSel, k0 = ui.lkDraft && ui.lkDraft.id === id ? ui.lkDraft.k : (lkKeys(lockers.get(id)) ?? 0);
      // Lo elegido y escrito se mantiene al redibujar.
      const o = $('#lk_o').value, n = $('#lk_n').value;
      ui.lkDraft = {id, k:Math.min(Math.max(k0 + (t.id === 'lkPlus' ? 1 : -1), 0), 20)};
      renderLockerPane(); $('#lk_o').value = o; $('#lk_n').value = n;
      return;
    }
    if(t.id === 'lkNo'){ ui.lkSel = null; ui.lkDraft = null; renderLockerPane(); return; }
    if(t.id === 'lkSave') saveLocker(ui.lkSel);
  });
  pane.addEventListener('input', e => {
    if(e.target.id !== 'lk_q') return;
    ui.lkq = e.target.value; ui.lkSel = null;
    const pos = e.target.selectionStart;
    e.target.blur(); renderLockerPane();
    const i = $('#lk_q'); i.focus(); i.setSelectionRange(pos, pos);
  });
  pane.addEventListener('keydown', e => { if(e.key === 'Enter' && e.target.id === 'lk_n'){ e.preventDefault(); saveLocker(ui.lkSel); } });

  const baseRender = render;
  render = function(){
    baseRender();
    renderLockers(); renderLockerPane();
    if(!$('#lockerPane').hidden){
      // Con los lockers abiertos, el panel derecho muestra solo los lockers.
      $('#pw').hidden = false;
      for(const s of ['#peoplePane', '#seatsPane', '#printPane']) $(s).hidden = true;
      document.querySelectorAll('.rail [data-tab]').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', false); });
    }
  };
}
document.head.insertAdjacentHTML('beforeend', `<style>
.lkb{cursor:pointer}
.lkb .lkbg{fill:#ffffff;stroke:#0A4290;stroke-width:.9}
.lkb .lkc{fill:#f2f4f7;stroke:#b8c2cc;stroke-width:.4}
.lkb .lkc.occ{fill:#d6e3f3;stroke:#2a5d8c}
.lkb .lkp{fill:#0A4290;opacity:.94}
.lkb text.lkt{font-family:"Barlow",system-ui,sans-serif;font-weight:700;letter-spacing:.03em;fill:#ffffff;text-anchor:middle;dominant-baseline:central;pointer-events:none}
.lkb:hover .lkbg{stroke-width:1.6}.lkb:hover .lkp{opacity:1}
.lkb.sel .lkbg{stroke:#c2571a;stroke-width:2;stroke-dasharray:4 2}
.lkb:focus-visible{outline:2px solid #c2571a;outline-offset:2px}
.lksum{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}
.lksum div{display:flex;flex-direction:column;align-items:center;padding:6px 2px;border:1px solid var(--line);border-radius:8px;background:var(--panel2)}
.lksum b{font-size:20px;font-variant-numeric:tabular-nums;color:var(--accent)}
.lksum span{font-size:11.5px;color:var(--muted)}
.lkk{flex:none;display:flex;align-items:center;gap:3px;font-family:var(--mono);font-size:13px;font-weight:600;color:var(--muted);padding:2px 7px;border:1px solid var(--line);border-radius:10px}
.lkk.none{color:#8a5a00;border-color:#e7b54d;background:#fcf3de}
.lked{padding:4px 14px 12px 58px;background:var(--accent-soft)}
.lked .invf{margin-top:4px}
.lked .stock .n{font-size:20px}
.lked .stock button{width:30px;height:30px}
#lklist .empty{padding:12px 16px;color:var(--muted)}
</style>`);

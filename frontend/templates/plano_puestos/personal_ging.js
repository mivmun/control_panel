// ---------- enlace con Personal GING (adaptar.py pega esto antes del inicio de la app) ----------
// Cada persona del plano se enlaza con su ficha de Personal GING por usuario. Si no tiene usuario
// guardado, se busca por nombre (igual, o todas sus palabras dentro del nombre completo y sin dudas).
// Cargo, disciplina, rol, CC y modalidad vienen de Personal GING y se cambian allá, no en el plano.
// Quien no está en Personal GING queda como "Externo". El enlace se puede fijar a mano en "Editar".
// Personal GING es la lista maestra: quien está allá y falta en el plano se agrega solo (syncGing).
let GING = null;              // usuario → ficha
let rawPeople = new Map();    // personas tal como vienen de los datos, sin el perfil de Personal GING
let peopleReady = false;      // ya llegaron las personas guardadas (antes de eso no se sabe quién falta)
const gingCreating = new Set();
const gnorm = s => norm(s || '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function gingMatch(p){
  if(!GING) return null;
  if(p.usuario === '-') return null;                        // marcado a mano como externo
  if(p.usuario) return GING.get(p.usuario) || null;
  const n = gnorm(p.name), exact = [...GING.values()].filter(r => gnorm(r.nombre) === n);
  if(exact.length === 1) return exact[0];
  const t = n.split(' ');
  if(t.length < 2) return null;
  const sub = [...GING.values()].filter(r => { const rt = new Set(gnorm(r.nombre).split(' ')); return t.every(w => rt.has(w)); });
  return sub.length === 1 ? sub[0] : null;
}
function enrichPeople(m){
  if(m !== rawPeople) peopleReady = true;   // llamada desde los datos, no desde la carga de personal.json
  rawPeople = m;
  if(!GING) return m;
  syncGing();
  const out = new Map();
  for(const [pid, p] of m){
    const r = gingMatch(p);
    out.set(pid, r
      ? {...p, ging:r, cargo:r.cargo || p.cargo, disc:r.disciplina || p.disc}
      : {...p, ext:true});
  }
  return out;
}
// Agrega al plano a quien está en Personal GING y todavía no tiene su persona en el plano,
// ya enlazada por usuario. Sin puesto; "necesita puesto" salvo que su modalidad sea 0/5 (teletrabajo).
function syncGing(){
  if(!GING || !peopleReady || !db) return;
  const enlazados = new Set();
  for(const p of rawPeople.values()){ const r = gingMatch(p); if(r) enlazados.add(r.usuario); }
  const faltan = [...GING.values()].filter(r => !enlazados.has(r.usuario) && !gingCreating.has(r.usuario));
  if(!faltan.length) return;
  for(const r of faltan){
    gingCreating.add(r.usuario);
    savePerson(uid('p_'), {name:r.nombre, usuario:r.usuario, needs:r.modalidad !== '0/5', note:''});
  }
  toast(faltan.length === 1 ? `${faltan[0].nombre} agregado desde Personal GING` : `${faltan.length} personas agregadas desde Personal GING`);
}
(async () => {
  try{
    const res = await fetch('personal.json', {credentials:'same-origin'});
    if(!res.ok) return;
    const list = (await res.json()).personal || [];
    GING = new Map(list.filter(r => r.usuario).map(r => [r.usuario, r]));
    // Las disciplinas de Personal GING se suman a las de la app (filtros y ficha).
    for(const r of list) if(r.disciplina && !DISCS.includes(r.disciplina)) DISCS.push(r.disciplina);
    people = enrichPeople(rawPeople); bump(); scheduleRender();
  }catch(e){ /* abierto fuera del panel: sin enlace */ }
})();

{
  const baseProf = profDL;
  profDL = function(p){
    const g = p.ging;
    const extra = g
      ? `<dt>Personal GING</dt><dd>${esc(g.nombre)}${g.rol ? ' · ' + esc(g.rol) : ''}${g.cc ? ' · CC ' + esc(g.cc) : ''}${g.modalidad ? ' · modalidad ' + esc(g.modalidad) : ''}</dd>`
      : p.ext ? '<dt>Personal GING</dt><dd>Externo: no está en Personal GING</dd>' : '';
    const base = baseProf(p);
    if(!extra) return base;
    return base.startsWith('<dl>') ? base.replace('<dl>', '<dl>' + extra) : `<dl>${extra}</dl>`;
  };
  const baseText = personText;
  personText = function(p){ return baseText(p) + ' ' + (p.ging ? norm(p.ging.usuario + ' ' + p.ging.nombre) : p.ext ? 'externo' : ''); };

  const baseRP = renderPeople;
  renderPeople = function(){
    baseRP();
    if(!GING) return;
    for(const b of document.querySelectorAll('#plist .pmain[data-pick]')){
      const p = people.get(b.dataset.pick), nm = b.querySelector('.pname');
      if(p && p.ext && nm && !nm.querySelector('.ext')) nm.insertAdjacentHTML('beforeend', ' <span class="ext" title="No está en Personal GING">Externo</span>');
    }
    const ed = document.querySelector('#plist .pedit');
    if(!ed || ed.dataset.ging) return;
    ed.dataset.ging = '1';
    const pid = ui.editPid, p = people.get(pid);
    if(!p) return;
    const g = p.ging, auto = !p.usuario;
    const opts = [...GING.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map(r => `<option value="${esc(r.usuario)}" ${p.usuario === r.usuario ? 'selected' : ''}>${esc(r.nombre)}</option>`).join('');
    const now = g ? `Enlazada con <b>${esc(g.nombre)}</b> (${esc(g.usuario)})${auto ? ', por nombre' : ''}.` : 'No está enlazada: aparece como externa.';
    ed.querySelector('#pe_name').insertAdjacentHTML('afterend', `<div class="gingbox"><label for="pe_ging">Personal GING</label>
      <select id="pe_ging"><option value="" ${auto ? 'selected' : ''}>Automático (por nombre)</option><option value="-" ${p.usuario === '-' ? 'selected' : ''}>Externo (no está en Personal GING)</option>${opts}</select>
      <div class="hint">${now}${g ? ' Cargo y disciplina se cambian en Personal GING.' : ''}</div></div>`);
    if(g) for(const id of ['pe_disc', 'pe_cargo']){ const el = $('#' + id); if(el){ el.disabled = true; el.title = 'Viene de Personal GING'; } }
  };
}
document.addEventListener('change', e => {
  if(e.target.id !== 'pe_ging' || !ui.editPid) return;
  const pid = ui.editPid, v = e.target.value;
  e.target.blur();
  savePerson(pid, {usuario:v}).then(() => { toast(v === '-' ? 'Marcada como externa' : v ? 'Enlazada con Personal GING' : 'Enlace automático por nombre'); });
});
document.head.insertAdjacentHTML('beforeend', `<style>
.pname .ext{display:inline-block;font-size:10px;font-weight:600;letter-spacing:.02em;padding:0 5px;border-radius:8px;background:var(--hover);color:var(--muted);border:1px solid var(--line);vertical-align:1px}
.gingbox{display:flex;flex-direction:column;gap:4px;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--panel2)}
.gingbox label{font-size:12px;font-weight:600;color:var(--muted)}
.gingbox .hint{margin:0;font-size:12px}
</style>`);

// Reemplazo local de window.claude para la app "Puestos Piso 5" de claude.ai.
// La app habla con claude.use('db' | 'user' | 'downloads' | 'assets'); aquí esas mismas llamadas
// guardan en el navegador (localStorage) y parten de los datos incrustados en el archivo (SEED).
// adaptar.py pega este archivo dentro de plantilla.html; actualizar.py rellena SEED.
const SEED = /*__SEED__*/null;
const LOCAL = (() => {
  const KEY = 'plano_puestos_gtec_v2', KEY_OLD = 'plano_puestos_gtec_v1', ME = 'local';
  const clone = o => o === undefined ? undefined : JSON.parse(JSON.stringify(o));
  let docs = null, assets = {}, saveT = null, warned = false;

  // ---------- datos del formato anterior (pisos con puestos y nombres) ----------
  // Piso 5 se pasa al plano nuevo por número de puesto; los otros pisos quedan como pisos con imagen de fondo.
  function fromLegacy(S){
    const out = {}, as = {}, now = new Date().toISOString();
    const pidOf = new Map();
    (S.people || []).forEach((p, i) => pidOf.set(p.name, 'p_' + (i + 1).toString(36).padStart(4, '0')));
    const person = p => ({name:p.name, needs:p.needs !== false, note:p.note || ''});
    const days = s => { const f = {}, d = s.days || []; for(let i = 0; i < 4; i++) f['d'+i] = pidOf.get(d[i]) || ''; f.d4 = f.d5 = pidOf.get(d[4]) || ''; return f; };
    const used = s => (s.days || []).some(Boolean);
    const layout = (typeof P5 !== 'undefined' && P5.layout.seats) || [];
    const byNum = new Map(layout.map(s => [String(s.num), s]));
    const floors = S.floors || [];
    const p5 = floors.find(f => /piso\s*5/i.test(f.name || ''));
    const extra = [];
    if(p5){
      for(const p of S.people || []) out['personas/' + pidOf.get(p.name)] = person(p);
      for(const s of p5.seats){
        const t = byNum.get(String(s.num));
        if(!t){ extra.push(s.num); continue; }
        if(used(s)) out['asig/' + t.id] = {...days(s), by:ME, at:now};
        if(s.note && s.note !== t.note) out['plano/' + t.id] = {note:s.note};
      }
    }
    for(const f of floors){
      if(f === p5) continue;
      const fid = 'f_' + String(f.id).replace(/[^A-Za-z0-9_-]/g, ''), bg = S.bgs && S.bgs[f.id];
      let bgId = '';
      if(bg){ bgId = rid(); as[bgId] = bg; }
      const sw = +f.seatW || 50, sh = +f.seatH || 34;
      out['admin-pisos/' + fid] = {name:f.name || 'Piso', bg:bgId, w:+f.w || 1000, h:+f.h || 700, scale:Math.round(Math.max(sw, sh) / 48 * 100) / 100, by:ME, at:now};
      const names = new Set();
      for(const s of f.seats){
        const [w, h] = s.rot ? [sh, sw] : [sw, sh];
        out['admin-pisos/' + fid + '/plano/' + s.id] = {num:String(s.num), x:s.x + w / 2, y:s.y + h / 2, dir:s.rot ? 'D' : 'R', note:s.note || '', area:''};
        if(used(s)){ out['pisos/' + fid + '/asig/' + s.id] = {...days(s), by:ME, at:now}; s.days.forEach(n => n && names.add(n)); }
      }
      for(const p of S.people || []) if(names.has(p.name) || !p5) out['pisos/' + fid + '/personas/' + pidOf.get(p.name)] = person(p);
    }
    if(extra.length) setTimeout(() => window.toast && toast(`Puestos de Piso 5 que no están en el plano nuevo (sin pasar): ${extra.join(', ')}`), 1500);
    return {docs:out, assets:as};
  }
  function fromAny(x){
    if(!x || typeof x !== 'object') return null;
    if(x.docs && typeof x.docs === 'object') return {docs:x.docs, assets:x.assets || {}};
    if(Array.isArray(x.floors)) return fromLegacy(x);
    return null;
  }
  function rid(){ let s = ''; for(let i = 0; i < 32; i++) s += (Math.random() * 16 | 0).toString(16); return s; }

  function init(){
    if(docs) return;
    let st = null;
    try{ const t = localStorage.getItem(KEY); if(t) st = fromAny(JSON.parse(t)); }catch(e){}
    // Primera vez: lo último que se guardó con la versión anterior en este navegador, o si no, los datos del archivo.
    if(!st){ try{ const t = localStorage.getItem(KEY_OLD); if(t) st = fromAny(JSON.parse(t)); }catch(e){} if(st) setTimeout(save, 0); }
    if(!st) st = fromAny(clone(SEED));
    st = st || {docs:{}, assets:{}};
    docs = st.docs; assets = st.assets;
  }
  function save(){
    clearTimeout(saveT); saveT = null;
    try{ localStorage.setItem(KEY, JSON.stringify({v:2, docs, assets})); }
    catch(e){ if(!warned){ warned = true; window.toast && toast('No se pudo guardar en el navegador. Usa "Guardar respaldo".'); } }
  }
  function changed(){ if(!saveT) saveT = setTimeout(save, 250); notifyAll(); }
  window.addEventListener('storage', e => { if(e.key !== KEY || !e.newValue) return; try{ const st = fromAny(JSON.parse(e.newValue)); if(st){ docs = st.docs; assets = st.assets; notifyAll(); } }catch(err){} });
  window.addEventListener('beforeunload', () => { if(saveT) save(); });

  // ---------- base de datos (misma forma que claude.use('db')) ----------
  const segs = p => String(p).split('/').filter(Boolean);
  function checkPath(p, even){
    const s = segs(p);
    if(!s.length || (s.length % 2 === 0) !== even) throw new TypeError(`Ruta inválida (${s.length} segmentos): ${p}`);
    return s.join('/');
  }
  const meta = {fromCache:false, hasPendingWrites:false};
  function dsnap(path){
    const d = docs[path], id = path.slice(path.lastIndexOf('/') + 1);
    return {id, exists:d !== undefined, data:() => clone(d), metadata:meta};
  }
  const OPS = {
    '==':(a, b) => a === b, '!=':(a, b) => a !== b, '<':(a, b) => a < b, '<=':(a, b) => a <= b, '>':(a, b) => a > b, '>=':(a, b) => a >= b,
    'in':(a, b) => Array.isArray(b) && b.includes(a), 'not-in':(a, b) => Array.isArray(b) && !b.includes(a),
    'array-contains':(a, b) => Array.isArray(a) && a.includes(b),
  };
  function run(q){
    const pre = q.path + '/';
    let list = Object.keys(docs).filter(k => k.startsWith(pre) && !k.slice(pre.length).includes('/')).sort();
    for(const [f, op, v] of q.filters) list = list.filter(k => { const x = docs[k][f]; return x !== undefined && OPS[op] && OPS[op](x, v); });
    if(q.order){
      const [f, dir] = q.order, k = dir === 'desc' ? -1 : 1;
      list.sort((a, b) => { const x = docs[a][f], y = docs[b][f]; if(x === undefined) return 1; if(y === undefined) return -1; return x < y ? -k : x > y ? k : 0; });
    }
    if(q.lim) list = list.slice(0, q.lim);
    const ds = list.map(dsnap);
    return {docs:ds, size:ds.length, empty:!ds.length, docChanges:() => ds.map((doc, i) => ({type:'added', doc, oldIndex:-1, newIndex:i})), metadata:meta};
  }
  const subs = new Set();
  let pending = false;
  function notifyAll(){
    if(pending) return; pending = true;
    setTimeout(() => { pending = false; for(const s of [...subs]) if(subs.has(s)) try{ s.fire(); }catch(e){ console.error(e); } }, 0);
  }
  function listen(fire){ const s = {fire}; subs.add(s); setTimeout(() => subs.has(s) && fire(), 0); return () => subs.delete(s); }
  function merge(a, b){
    for(const [k, v] of Object.entries(b)){
      if(v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], v);
      else a[k] = clone(v);
    }
    return a;
  }
  const bad = m => Promise.reject({code:'invalid_argument', message:m});
  const isObj = o => o && typeof o === 'object' && !Array.isArray(o);
  function docRef(path){
    path = checkPath(path, true);
    return {
      id:path.slice(path.lastIndexOf('/') + 1), path,
      get:async () => { init(); return dsnap(path); },
      set:async data => { init(); if(!isObj(data)) return bad('El documento debe ser un objeto'); docs[path] = clone(data); changed(); },
      update:async data => { init(); if(docs[path] === undefined) return bad('El documento no existe'); merge(docs[path], data); changed(); },
      delete:async () => { init(); if(docs[path] !== undefined){ delete docs[path]; changed(); } },
      acquire:async () => ({acquired:true, version:1, expiresAt:new Date(Date.now() + 5000).toISOString(), holder:ME}),
      onSnapshot:next => { init(); let last = {}; return listen(() => { const t = JSON.stringify(docs[path]); if(t === last) return; last = t; next(dsnap(path)); }); },
      collection:p => colRef(path + '/' + p),
    };
  }
  function query(q){
    return {
      where:(f, op, v) => query({...q, filters:[...q.filters, [f, op, v]]}),
      orderBy:(f, dir) => query({...q, order:[f, dir || 'asc']}),
      limit:n => query({...q, lim:n}),
      get:async () => { init(); return run(q); },
      onSnapshot:next => { init(); let last = {}; return listen(() => { const r = run(q), t = JSON.stringify(r.docs.map(d => [d.id, docs[q.path + '/' + d.id]])); if(t === last) return; last = t; next(r); }); },
    };
  }
  function colRef(path){
    path = checkPath(path, false);
    const q = query({path, filters:[], order:null, lim:0});
    return {...q, path, doc:id => docRef(path + '/' + (id || rid().slice(0, 20))), add:async data => { const r = docRef(path + '/' + rid().slice(0, 20)); await r.set(data); return r; }};
  }
  const db = {doc:docRef, collection:colRef};

  // ---------- usuario local: quien abre el archivo es el dueño ----------
  const user = {
    id:async () => ME, me:async () => ({id:ME, name:'Tú'}), isOwner:async () => true, canEdit:async () => true, can:async () => true,
    profiles:async ids => Object.fromEntries((ids || []).map(i => [i, {id:i, name:i === ME ? 'Tú' : ''}])),
    search:async () => [],
  };

  // ---------- descargas y archivos ----------
  function saveFile(filename, data){
    const blob = data instanceof Blob ? data : new Blob([data], {type:/\.json$/i.test(filename) ? 'application/json' : /\.csv$/i.test(filename) ? 'text/csv' : /\.html?$/i.test(filename) ? 'text/html' : 'application/octet-stream'});
    const a = document.createElement('a'), u = URL.createObjectURL(blob);
    a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 5000);
  }
  const downloads = {save:async ({filename, data}) => { saveFile(filename, data); }};
  const assetsApi = {
    upload:blob => new Promise((ok, fail) => {
      const r = new FileReader();
      r.onload = () => { init(); const id = rid(); assets[id] = r.result; changed(); ok({id, url:r.result, sizeBytes:blob.size, contentType:blob.type}); };
      r.onerror = () => fail({code:'unavailable', message:'No se pudo leer el archivo'});
      r.readAsDataURL(blob);
    }),
    list:async () => { init(); return {assets:Object.keys(assets).map(id => ({id, url:assets[id]})), usage:{}}; },
    delete:async id => { init(); if(assets[id]){ delete assets[id]; changed(); } },
  };

  // ---------- respaldo ----------
  function backup(){
    init(); save();
    saveFile(`Respaldo plano puestos ${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({v:2, docs, assets}));
  }
  function restoreFile(){
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files[0]; if(!f) return;
      f.text().then(t => {
        const st = fromAny(JSON.parse(t));
        if(!st) return toast('Ese archivo no es un respaldo del plano de puestos.');
        if(!confirm('¿Reemplazar los datos de este navegador por los del respaldo? Conviene guardar un respaldo antes.')) return;
        docs = st.docs; assets = st.assets; save(); location.reload();
      }).catch(() => toast('No se pudo leer el respaldo.'));
    };
    inp.click();
  }
  function reset(){
    if(!confirm('¿Volver a los datos guardados en el archivo? Se pierden los cambios hechos en este navegador que no estén en un respaldo.')) return;
    const st = fromAny(clone(SEED)) || {docs:{}, assets:{}};
    docs = st.docs; assets = st.assets; save(); location.reload();
  }

  const caps = {db, user, downloads, assets:assetsApi};
  window.claude = {use:async name => caps[name] || null};
  return {backup, restoreFile, reset, blob:id => { init(); return assets[id] || (id ? '/_blob/' + id : ''); }};
})();

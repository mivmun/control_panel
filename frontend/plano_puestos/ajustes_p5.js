// ---------- ajustes del panel (adaptar.py pega esto antes del inicio de la app) ----------
// 1) Piso 5 fijo según el plano de arquitectura (JeJ-Habilitacion-Piso 5_Anteproyecto_Puestos de Trabajo.pdf):
//    posición de cada silla y tamaño real de cada escritorio. Los puestos no se arrastran, giran, agregan ni quitan;
//    sí se puede cambiar número, zona y nota ("Ordenar plano").
// 2) La Sala de reuniones 1 deja de reservarse: es un solo puesto para I+D.
// 3) Dibujo de los puestos: mesa, silla con respaldo y monitor; nombres ajustados al tamaño de cada mesa.
{
  // [id, x, y, hacia dónde mira la silla, ancho de mesa, fondo de mesa]; unidades del plano de la app
  const GEO = [["e11",72.6,95.5,"R",51.7,34.4],["e1",72.6,43.7,"R",51.7,34.4],["e12",167.3,95.5,"L",51.7,34.4],["e2",167.3,43.7,"L",51.7,34.4],["e13",237.1,99.7,"R",45.3,34.4],["e7",237.1,53.4,"R",45.3,34.4],["e18",331.9,99.7,"L",45.3,34.4],["e8",331.9,53.4,"L",45.3,34.4],["e14",383.4,95.5,"R",51.7,34.4],["e3",383.4,43.7,"R",51.7,34.4],["e15",478.2,95.5,"L",51.7,34.4],["e4",478.2,43.7,"L",51.7,34.4],["e19",548.0,99.7,"R",45.3,34.4],["e9",548.0,53.4,"R",45.3,34.4],["e20",642.7,99.7,"L",45.3,34.4],["e10",642.7,53.4,"L",45.3,34.4],["e16",694.5,95.5,"R",51.7,34.4],["e5",694.5,43.7,"R",51.7,34.4],["e17",789.0,95.5,"L",51.7,34.4],["e6",789.0,43.7,"L",51.7,34.4],["e24",774.3,258.9,"U",45.3,34.4],["e21",774.3,164.2,"D",45.3,34.4],["e25",820.7,258.9,"U",45.3,34.4],["e22",820.7,164.2,"D",45.3,34.4],["e23",41.6,251.4,"R",51.7,34.4],["e30",186.3,425.6,"U",51.7,34.4],["e48",114.1,779.0,"R",51.7,25.9],["e59",114.1,830.5,"R",51.7,25.9],["e49",191.5,779.0,"L",51.7,25.9],["e60",191.5,830.5,"L",51.7,25.9],["e39",243.3,727.2,"R",51.7,25.9],["e50",243.3,779.0,"R",51.7,25.9],["e61",243.3,830.5,"R",51.7,25.9],["e40",320.7,727.2,"L",51.7,25.9],["e51",320.7,779.0,"L",51.7,25.9],["e41",372.5,727.2,"R",51.7,25.9],["e52",372.5,779.0,"R",51.7,25.9],["e62",372.5,830.5,"R",51.7,25.9],["e42",449.9,727.2,"L",51.7,25.9],["e53",449.9,779.0,"L",51.7,25.9],["e63",449.9,830.5,"L",51.7,25.9],["e43",501.5,727.2,"R",51.7,25.9],["e54",501.5,779.0,"R",51.7,25.9],["e64",501.5,830.5,"R",51.7,25.9],["e44",579.1,727.2,"L",51.7,25.9],["e55",579.1,779.0,"L",51.7,25.9],["e65",579.1,830.5,"L",51.7,25.9],["e31",204.3,482.7,"D",51.7,25.9],["e45",700.5,736.5,"U",51.7,25.9],["e56",667.9,821.1,"D",51.7,25.9],["e46",752.2,736.5,"U",51.7,25.9],["e57",719.4,821.1,"D",51.7,25.9],["e47",803.8,736.5,"U",51.7,25.9],["e58",771.2,821.1,"D",51.7,25.9]];
  const byId = new Map(GEO.map(([id, x, y, dir, dw, dd]) => [id, {x, y, dir, dw, dd}]));
  for(const s of P5.layout.seats){ const g = byId.get(s.id); if(g) Object.assign(s, g); }

  const i1 = P5.rooms.findIndex(r => r.id === 'sala1');
  if(i1 >= 0){
    const r = P5.rooms.splice(i1, 1)[0];
    // Recuadro = el recinto del plano (x 17–152, y 306–452), un poco hacia adentro de los muros.
    const z = {x:21, y:310, w:127, h:138};
    P5.layout.seats.push({id:'e66', num:'55', kind:'area', label:'I+D', sub:'Ex sala de reuniones 1', area:'Oficina B', note:'', dir:'R',
      x:z.x + z.w / 2, y:z.y + z.h / 2, w:z.w, h:z.h, chairs:r.chairs.map(c => ({...c, dw:51.7, dd:25.9}))});
    // El fondo del recinto pasa del color de sala al de oficina.
    P5.arch.fills = P5.arch.fills.replace('<rect class="rz sala" x="17" y="306"', '<rect class="rz priv" x="17" y="306"');
  }
  LAYOUT_IDS = new Set(LAYOUT.seats.map(s => s.id));
}
const fixedPlan = () => FID === 'p5';
const deskOf = s => ({dw:+s.dw || G.deskW, dd:+s.dd || G.deskD});

// En Piso 5 no se aplican posiciones ni puestos agregados guardados en los datos: manda el plano.
seats = function(){
  if(seatsMemo) return seatsMemo;
  const fixed = fixedPlan(), out = [];
  for(const s of LAYOUT.seats){
    const o = plano.get(s.id);
    if(o && o.deleted) continue;
    let m = o || {};
    if(fixed){ m = {}; for(const k of ['num', 'note', 'area']) if(o && o[k] != null) m[k] = o[k]; }
    out.push(cleanSeat({...s, ...m, id:s.id}));
  }
  if(!fixed) for(const [id, o] of plano) if(!o.deleted && !LAYOUT_IDS.has(id)) out.push(cleanSeat({...o, id}));
  out.sort((a, b) => (parseInt(a.num) || 0) - (parseInt(b.num) || 0) || a.num.localeCompare(b.num));
  seatsMemo = out; seatsMemo.byId = new Map(out.map(s => [s.id, s]));
  return out;
};
seatBox = function(s){
  if(s.kind === 'area') return {x0:s.x - s.w / 2, y0:s.y - s.h / 2, x1:s.x + s.w / 2, y1:s.y + s.h / 2};
  const {dw, dd} = deskOf(s), [vx, vy] = VEC[s.dir || 'R'], h = G.chair / 2, far = h + dd;
  const xs = [s.x - h, s.x + h, s.x + vx * far + (vy ? dw / 2 : 0), s.x + vx * far - (vy ? dw / 2 : 0)];
  const ys = [s.y - h, s.y + h, s.y + vy * far + (vx ? dw / 2 : 0), s.y + vy * far - (vx ? dw / 2 : 0)];
  return {x0:Math.min(...xs), y0:Math.min(...ys), x1:Math.max(...xs), y1:Math.max(...ys)};
};

// Nombre + primer apellido, sin cortar partículas: "Ana María de la Fuente" → ["Ana", "de la Fuente"].
const PARTS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'van', 'von', 'da', 'di']);
function nameLines(n){
  const t = String(n).trim().split(/\s+/);
  if(t.length <= 2) return t;
  let i = t.length >= 4 ? 2 : 1;
  if(i === 2 && PARTS.has(t[1].toLowerCase())) i = 1;
  let j = i; while(j < t.length - 1 && PARTS.has(t[j].toLowerCase())) j++;
  return [t[0], t.slice(i, j + 1).join(' ')];
}
// Nombre en una o dos líneas que quepan en el ancho dado.
function fitLines(names, aus, owners, width){
  let lines = [], cls = 'nm';
  if(!names.length && aus && owners.length){ lines = ['Ausente', shortName(pname(owners[0])).split(' ')[0]]; cls = 'nm aus'; }
  else if(names.length === 1) lines = nameLines(names[0]);
  else if(names.length === 2) lines = names.map(n => n.split(' ')[0]);
  else if(names.length > 2) lines = [names.length + ' pers.'];
  const W = 0.52, longest = Math.max(1, ...lines.map(l => l.length));
  const fs = Math.max(5.4, Math.min(7.6, width / (longest * W)));
  const maxc = Math.max(3, Math.floor(width / (fs * W)));
  return {cls, fs, cut:lines.some(l => l.length > maxc), lines:lines.map(l => l.length > maxc ? l.slice(0, maxc - 1) + '…' : l)};
}
function nameText(t, x, y, rot){
  const tr = rot ? ` transform="rotate(-90 ${x.toFixed(1)} ${y.toFixed(1)})"` : '';
  return t.lines.map((l, i) => `<text class="${t.cls}" x="${x.toFixed(1)}" y="${(y + (i - (t.lines.length - 1) / 2) * t.fs * 1.18 + t.fs * 0.34).toFixed(1)}" style="font-size:${t.fs.toFixed(2)}px"${tr}>${esc(l)}</text>`).join('');
}
seatSVG = function(s, hl){
  const st = seatState(s), area = s.kind === 'area';
  const dim = ui.q && !ui.pick && hl.size && !hl.has(s.id);
  const cls = ['st', area ? 'area' : '', st.cls, st.aus ? 'aus' : '', st.loan ? 'loan' : '', isAdm(s.id) ? 'adm' : '', hl.has(s.id) ? 'hl' : '', ui.sel === s.id ? 'sel' : '', dim ? 'dim' : ''].filter(Boolean).join(' ');
  const names = st.ids.map(pname);
  let o = `<g data-seat="${esc(s.id)}" class="${cls}" tabindex="0" role="button" aria-label="Puesto ${esc(s.num)}${area ? ' ' + esc(s.label || '') : ''}${names.length ? ', ' + esc(names.join(', ')) : ', libre'}">`;
  // Esquinas donde van las marcas: [x, y] de la marca de fijado, del aviso de inventario, de la nota y del candado.
  let adm, warn, note, lock;
  if(area){
    const x0 = s.x - s.w / 2, y0 = s.y - s.h / 2;
    o += `<rect class="desk zone" x="${x0 + 1}" y="${y0 + 1}" width="${s.w - 2}" height="${s.h - 2}" rx="7"/>`;
    for(const c of s.chairs || []){
      const h = G.chair / 2;
      o += `<g class="furn-l" transform="translate(${c.x},${c.y}) rotate(${ANG[c.dir]})"><rect x="${h}" y="${-c.dw / 2 + .6}" width="${c.dd - .6}" height="${c.dw - 1.2}" rx="2.5"/><circle r="9"/></g>`;
    }
    o += `<text class="zt" x="${x0 + 9}" y="${y0 + 14}">${esc(s.label || '')}</text><text class="zs" x="${x0 + 9}" y="${y0 + 23}">${esc(s.sub || '')}</text>`;
    o += `<circle class="chair" cx="${x0 + s.w - 14}" cy="${y0 + 14}" r="9"/><text class="num" x="${x0 + s.w - 14}" y="${y0 + 14}">${esc(s.num)}</text>`;
    const t = fitLines(names, st.aus, st.owners, s.w - 30);
    if(t.lines.length){ t.fs = Math.min(10, t.fs * 1.3); o += `<rect class="pill" x="${s.x - s.w / 2 + 14}" y="${s.y + 2}" width="${s.w - 28}" height="${t.lines.length * t.fs * 1.18 + 7}" rx="5"/>` + nameText(t, s.x, s.y + 5.5 + t.lines.length * t.fs * 0.59); }
    adm = [x0 + 9, y0 + s.h - 9]; warn = [x0 + s.w - 30, y0 + 8]; note = [x0 + s.w - 5, y0 + 5]; lock = [x0 + s.w - 11, y0 + s.h - 11];
  } else {
    const {dw, dd} = deskOf(s), dir = s.dir || 'R', [vx, vy] = VEC[dir], h = G.chair / 2, r = 10;
    o += `<g transform="translate(${s.x},${s.y}) rotate(${ANG[dir]})">`;
    o += `<rect class="desk" x="${h}" y="${-dw / 2 + .6}" width="${dd - .6}" height="${dw - 1.2}" rx="3"/>`;
    o += `<rect class="mon" x="${h + dd - 3}" y="-8" width="1.5" height="16" rx=".75"/>`;
    o += `<path class="back" d="M${-r * .55} ${-r * .92}Q${-r * 1.55} 0 ${-r * .55} ${r * .92}"/>`;
    o += `<circle class="chair" r="${r}"/></g>`;
    o += `<text class="num" x="${s.x}" y="${s.y}">${esc(s.num)}</text>`;
    // Nombre al centro de la mesa (un poco hacia la silla, lejos del monitor). En las mesas que miran a los
    // lados se escribe a lo largo de la mesa: así cabe el nombre completo y todas las filas se leen igual.
    const mid = h + dd / 2 - 2, dcx = s.x + vx * mid, dcy = s.y + vy * mid, rot = !!vx;
    o += nameText(fitLines(names, st.aus, st.owners, dw - 10), dcx, dcy, rot);
    const far = h + dd - 5;
    lock = [s.x + vx * far + (vx ? 0 : dw / 2 - 7), s.y + vy * far + (vy ? 0 : dw / 2 - 7)];
    adm = [s.x - h + 3.5, s.y + h - 3.5]; warn = [s.x - h + 2, s.y - h]; note = [s.x + h - 3, s.y - h + 3];
  }
  if(st.cls !== 'free') o += `<use href="#lk" class="lock" x="${lock[0] - 3}" y="${lock[1] - 3.6}" width="6" height="7.2"/>`;
  if(isAdm(s.id)) o += `<circle class="adm-b" cx="${adm[0]}" cy="${adm[1]}" r="5"/><use href="#lk" class="adm-i" x="${adm[0] - 2.6}" y="${adm[1] - 3.2}" width="5.2" height="6.4"/>`;
  const miss = ui.warnOff ? [] : eqMissing(s.id);
  if(miss.length){
    const [ax, ay] = warn;
    o += miss[0] === 'sin registrar'
      ? `<circle class="unkdot" cx="${ax + 1}" cy="${ay + 3}" r="2.6"><title>Sin inventario registrado</title></circle>`
      : `<g class="warn"><path d="M${ax} ${ay - 10}l8.5 14.7h-17z"/><text x="${ax}" y="${ay + 3.2}">!</text></g>`;
  }
  if(s.note) o += `<circle class="note" cx="${note[0]}" cy="${note[1]}" r="2.6"><title>${esc(s.note)}</title></circle>`;
  return o + '</g>';
};

// "Ordenar plano" en Piso 5: número, zona y nota, y quitar o restaurar puestos (no mover, girar ni agregar).
{
  // Muebles de la Sala 2 con el tamaño real de sus mesas (las del plano miden 51,7 × 25,9).
  const baseRooms = renderRooms;
  renderRooms = function(){
    if(!fixedPlan()) return baseRooms();
    const g = G; G = {...G, deskW:51.7, deskD:25.9};
    try{ baseRooms(); } finally { G = g; }
  };
  const base = renderEditPane;
  renderEditPane = function(){
    base();
    const p = $('#editPane');
    if(!fixedPlan() || p.hidden) return;
    for(const id of ['addSeat', 'e_rot']){ const b = p.querySelector('#' + id); if(b) b.remove(); }
    const bk = p.querySelector('#addBlock'); if(bk){ const row = bk.closest('.row'); if(row && row.nextElementSibling) row.nextElementSibling.remove(); if(row) row.remove(); }
    const h = p.querySelector('section > .hint'); if(h) h.textContent = 'El Piso 5 sigue el plano de arquitectura: los puestos no se mueven. Toca un puesto para cambiar su número, zona o nota, o para quitarlo.';
    const h2 = p.querySelectorAll('section > p.hint')[1]; if(h2 && !ui.sel) h2.textContent = 'Toca un puesto para cambiar su número, zona o nota, o para quitarlo. Un puesto ocupado hay que liberarlo antes de quitarlo.';
    const t = p.querySelector('section > h3'); if(t) t.textContent = 'Datos de los puestos';
    // Puestos quitados del plano: se pueden devolver.
    const gone = LAYOUT.seats.filter(s => { const o = plano.get(s.id); return o && o.deleted; })
      .sort((a, b) => (parseInt(a.num) || 0) - (parseInt(b.num) || 0));
    const del = p.querySelector('#e_del'); if(del) del.textContent = 'Eliminar puesto';
    const dok = p.querySelector('#e_delok'); if(dok) dok.textContent = 'Sí, eliminar';
    if(gone.length) p.insertAdjacentHTML('beforeend', `<section><h2>Puestos eliminados</h2>
      ${gone.map(s => `<div class="row" style="justify-content:space-between"><span>Puesto <b>${esc(s.num)}</b>${s.area ? ' · ' + esc(s.area) : ''}${s.label ? ' · ' + esc(s.label) : ''}</span><button data-restore="${esc(s.id)}">Agregar puesto</button></div>`).join('')}</section>`);
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-restore]');
    if(!b || !fixedPlan()) return;
    const s = LAYOUT.seats.find(x => x.id === b.dataset.restore), ref = dref('plano', b.dataset.restore);
    serial(ref.path, () => ref.delete()).then(() => toast(`Puesto ${s ? s.num : ''} agregado`)).catch(writeErr);
  });
  // Puestos eliminados: siguen dibujados en gris (data-gseat) para poder volver a agregarlos con un clic.
  const deletedSeats = () => fixedPlan() ? LAYOUT.seats.filter(s => { const o = plano.get(s.id); return o && o.deleted; }) : [];
  function ghostSVG(s){
    const sel = ui.gsel === s.id ? ' sel' : '';
    let o = `<g class="ghost gst${sel}" data-gseat="${esc(s.id)}" tabindex="0" role="button" aria-label="Puesto ${esc(s.num)} eliminado. Clic para agregarlo"><title>Puesto ${esc(s.num)} · eliminado del plano</title>`;
    if(s.kind === 'area'){
      const x0 = s.x - s.w / 2, y0 = s.y - s.h / 2;
      o += `<rect class="gdesk" x="${x0 + 1}" y="${y0 + 1}" width="${s.w - 2}" height="${s.h - 2}" rx="7"/><text class="gnum" x="${s.x}" y="${s.y}">${esc(s.num)}</text>`;
    } else {
      const {dw, dd} = deskOf(s), h = G.chair / 2;
      o += `<g transform="translate(${s.x},${s.y}) rotate(${ANG[s.dir || 'R']})"><rect class="gdesk" x="${h}" y="${-dw / 2 + .6}" width="${dd - .6}" height="${dw - 1.2}" rx="3"/><circle class="gchair" r="10"/></g>`;
      o += `<text class="gnum" x="${s.x}" y="${s.y}">${esc(s.num)}</text>`;
    }
    return o + '</g>';
  }
  const baseSeats = renderSeats;
  renderSeats = function(){
    baseSeats();
    const g = deletedSeats();
    if(g.length) $('#seats').insertAdjacentHTML('beforeend', g.map(ghostSVG).join(''));
  };
  // Clic (sin arrastrar) en un puesto eliminado: abre su ficha con "Agregar puesto".
  let gdown = null;
  svg.addEventListener('pointerdown', e => { const g = e.target.closest('[data-gseat]'); gdown = {id:g ? g.dataset.gseat : null, x:e.clientX, y:e.clientY}; });
  svg.addEventListener('pointerup', e => {
    const d = gdown; gdown = null;
    if(!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) return;
    if(d.id && ui.mode === 'asignar'){ ui.gsel = d.id; ui.sel = null; ui.room = null; ui.elev = null; ui.confirm = null; render(); }
    else if(ui.gsel && !d.id){ ui.gsel = null; render(); }
  });
  const baseTap = onSeatTap;
  onSeatTap = function(sid){ ui.gsel = null; baseTap(sid); };

  const basePane = renderSeatPane;
  renderSeatPane = function(){
    const pane = $('#seatPane');
    const gs = ui.gsel && ui.mode === 'asignar' && deletedSeats().find(s => s.id === ui.gsel);
    if(gs){
      pane.innerHTML = `<section><h2>Puesto <span class="n">${esc(gs.num)}</span><span style="flex:1"></span><button class="link" id="gX">Cerrar</button></h2>
        <div class="area">${esc([gs.area, gs.label].filter(Boolean).join(' · '))}${gs.area || gs.label ? ' · ' : ''}Eliminado del plano</div>
        <p class="hint">Este puesto no está disponible para la gerencia. Si vuelve a estarlo, agrégalo y queda libre para asignar.</p>
        ${readOnly() ? '' : '<div class="btns"><button class="primary" id="gAdd">Agregar puesto</button></div>'}</section>`;
      pane.hidden = false;
      return;
    }
    basePane();
    const s = ui.sel && seatById(ui.sel);
    if(!fixedPlan() || !s || pane.hidden || readOnly() || !ui.isAdmin) return;
    const busy = ALL.some(d => dayOf(s.id, d)), sec = pane.querySelector('section');
    if(!sec) return;
    sec.insertAdjacentHTML('beforeend', `<h3>Puesto en el plano</h3>` + (busy
      ? `<p class="hint" style="margin:0 0 6px">Para eliminar este puesto, primero libéralo toda la semana.</p><div class="btns"><button class="danger" disabled>Eliminar puesto</button></div>`
      : ui.confirm === 'pdel:' + s.id
        ? `<div class="btns"><span style="align-self:center">¿Eliminar el puesto ${esc(s.num)}? Queda en gris y se puede volver a agregar.</span><button class="danger" id="pDelOk">Sí, eliminar</button><button id="pDelNo">No</button></div>`
        : `<div class="btns"><button class="danger" id="pDel">Eliminar puesto</button></div>`));
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('#gX,#gAdd,#pDel,#pDelOk,#pDelNo');
    if(!t) return;
    const sid = t.id.startsWith('g') ? ui.gsel : ui.sel;
    const s = LAYOUT.seats.find(x => x.id === sid);
    if(t.id === 'gX'){ ui.gsel = null; render(); }
    else if(t.id === 'pDel'){ ui.confirm = 'pdel:' + sid; renderSeatPane(); }
    else if(t.id === 'pDelNo'){ ui.confirm = null; renderSeatPane(); }
    else if(t.id === 'pDelOk'){
      if(ALL.some(d => dayOf(sid, d))){ ui.confirm = null; renderSeatPane(); return toast(`Libera el puesto ${s ? s.num : ''} antes de eliminarlo.`); }
      const ref = dref('plano', sid);
      serial(ref.path, () => ref.set({deleted:true})).then(() => toast(`Puesto ${s ? s.num : ''} eliminado`)).catch(writeErr);
      ui.sel = null; ui.confirm = null; ui.gsel = sid; render();
    }
    else if(t.id === 'gAdd'){
      const ref = dref('plano', sid);
      serial(ref.path, () => ref.delete()).then(() => toast(`Puesto ${s ? s.num : ''} agregado`)).catch(writeErr);
      ui.gsel = null; ui.sel = sid; render();
    }
  });

  // Hoja para imprimir: los puestos con nombre propio (55 = I+D) lo muestran en los días sin asignar.
  const baseSheet = printSheetHTML;
  printSheetHTML = function(){
    const html = baseSheet(), named = seats().filter(s => s.label);
    if(!named.length) return html;
    const t = document.createElement('template'); t.innerHTML = html;
    for(const tr of t.content.querySelectorAll('.ptab tbody tr')){
      const s = named.find(x => x.num === tr.cells[0].textContent.trim());
      if(!s) continue;
      tr.cells[0].title = s.label;
      for(const td of [...tr.cells].slice(1)) if(!td.textContent.trim()){ td.textContent = s.label; td.className = 'res'; }
    }
    return t.innerHTML;
  };

  const baseRender = render;
  render = function(){
    baseRender();
    const b = $('#modeB');
    b.textContent = fixedPlan() ? 'Datos de los puestos' : 'Ordenar plano';
    b.title = fixedPlan() ? 'Cambiar número, zona o nota de un puesto, o quitarlo (el plano de Piso 5 es fijo)' : 'Mover, girar, agregar o quitar puestos del plano';
  };
}

document.head.insertAdjacentHTML('beforeend', `<style>
.st .desk{fill:#ffffff;stroke:#8d99a4;stroke-width:.9;filter:drop-shadow(0 .7px .9px rgba(23,33,43,.16))}
.st .chair{stroke-width:1.3}
.st .back{fill:none;stroke-width:3.2;stroke-linecap:round}
.st .mon{fill:#9aa6b2}
.st.free .back{stroke:#2f8a57}.st.occ .back{stroke:#1d4568}.st.part .back{stroke:#a7751a}
.st.occ .mon{fill:#2a5d8c;opacity:.55}.st.part .mon{fill:#a7751a;opacity:.55}.st.free .mon{fill:#2f8a57;opacity:.45}
.st.free.aus .back{stroke:#8d99a4}
.st:hover .desk{stroke-width:1.7}.st:hover .chair{stroke-width:1.9}
.st.adm .chair{stroke:#17212b;stroke-width:1.9}
.st.area .zone{stroke-width:1.3;filter:none}
.st.area.free .zone{fill:#f3fbf6;stroke:#2f8a57}.st.area.occ .zone{fill:#e6eef7;stroke:#2a5d8c}.st.area.part .zone{fill:#fcf3de;stroke:#a7751a}
.st.area .furn-l rect,.st.area .furn-l circle{fill:#ffffff;fill-opacity:.55;stroke:#c9d2da;stroke-width:.6}
.st.area text.zt{font-size:9px;font-weight:700;letter-spacing:.06em;fill:#17212b}
.st.area text.zs{font-size:6.4px;font-weight:500;fill:#5d6b78}
.st.area .pill{fill:#ffffff;stroke:#c9d2da;stroke-width:.6;opacity:.95}
.st.area .adm-b{fill:#17212b}
.st.hl .zone,.st.sel .zone{stroke:#c2571a;stroke-width:2.4}
.st.sel .zone{stroke-dasharray:4 2}
.st.drop-ok .zone{stroke:#23724a;stroke-width:3}.st.drop-no .zone{stroke:#b42318;stroke-width:3}
.gst{cursor:pointer}
.gst .gdesk{fill:#f4f5f6;fill-opacity:.6;stroke:#a9b3bc;stroke-width:.9;stroke-dasharray:3 2}
.gst .gchair{fill:#ffffff;fill-opacity:.7;stroke:#a9b3bc;stroke-width:1;stroke-dasharray:2.5 2}
.gst text.gnum{font-family:"IBM Plex Mono",monospace;font-size:9px;font-weight:600;fill:#8d99a4;text-anchor:middle;dominant-baseline:central;pointer-events:none}
.gst:hover .gdesk,.gst:hover .gchair{stroke:#5d6b78;fill-opacity:.9}
.gst.sel .gdesk,.gst.sel .gchair{stroke:#c2571a;stroke-width:2;stroke-dasharray:4 2}
.gst:focus-visible{outline:2px solid #c2571a;outline-offset:2px}
</style>`);

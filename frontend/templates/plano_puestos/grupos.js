// ---------- bloques agrupados (adaptar.py pega esto antes del inicio de la app) ----------
// Los puestos de un bloque ("+ Agregar bloque") comparten el campo grp y en "Ordenar plano" se mueven
// juntos: al arrastrar uno se mueve el bloque completo. "Desagrupar" los suelta; "Agrupar" junta un
// puesto con las mesas que se tocan con la suya (para bloques armados antes de que existiera grp).
const blockOf = s => s && s.grp ? seats().filter(x => x.grp === s.grp) : (s ? [s] : []);
function touchingGroup(s){
  const near = (a, b) => a.x0 <= b.x1 + 3 && b.x0 <= a.x1 + 3 && a.y0 <= b.y1 + 3 && b.y0 <= a.y1 + 3;
  const list = seats().filter(x => x.kind !== 'area'), out = [s], seen = new Set([s.id]);
  for(let i = 0; i < out.length; i++){
    const b = seatBox(out[i]);
    for(const x of list) if(!seen.has(x.id) && near(b, seatBox(x))){ seen.add(x.id); out.push(x); }
  }
  return out;
}
// Al soltar (endPtr): guarda los demás puestos del bloque con el mismo desplazamiento que el arrastrado.
function moveGroupMates(g){
  const s0 = seatById(g.sid);
  if(!s0 || !s0.grp) return;
  const dx = g.s.x - s0.x, dy = g.s.y - s0.y;
  for(const m of blockOf(s0)){
    if(m.id === g.sid) continue;
    const n = {...m, x:m.x + dx, y:m.y + dy};
    plano.set(m.id, {...(plano.get(m.id) || {}), ...n}); savePlano(n);
  }
}
{
  // Durante el arrastre se redibujan también los demás puestos del bloque.
  const baseMove = moveSeatEl;
  moveSeatEl = function(sid, s){
    baseMove(sid, s);
    const s0 = seatById(sid);
    if(!s0 || !s0.grp) return;
    for(const m of blockOf(s0)) if(m.id !== sid) baseMove(m.id, {...m, x:m.x + s.x - s0.x, y:m.y + s.y - s0.y});
    markGroup();
  };
  // El bloque del puesto elegido se ve seleccionado entero.
  function markGroup(){
    if(ui.mode !== 'ordenar' || !ui.sel) return;
    for(const m of blockOf(seatById(ui.sel))){ const el = document.querySelector(`[data-seat="${CSS.escape(m.id)}"]`); if(el) el.classList.add('sel'); }
  }
  const baseRender = render;
  render = function(){ baseRender(); markGroup(); };

  const basePane = renderEditPane;
  renderEditPane = function(){
    basePane();
    const p = $('#editPane'), s = ui.sel && seatById(ui.sel);
    if(p.hidden || fixedPlan()) return;
    const bk = p.querySelector('#addBlock'), hint = bk && bk.closest('.row').nextElementSibling;
    if(hint) hint.textContent = 'Un bloque ubica mesas enfrentadas de a dos, al centro de la vista. Sus puestos quedan agrupados y se mueven juntos.';
    const sec = s && p.querySelectorAll('section')[1];
    if(!sec || sec.querySelector('#grpOff,#grpOn')) return;
    const n = blockOf(s).length, t = s.grp ? 0 : touchingGroup(s).length, rot = sec.querySelector('#e_rot');
    if(rot && n > 1) rot.textContent = 'Girar bloque 90°';
    sec.insertAdjacentHTML('beforeend', s.grp
      ? `<p class="hint" style="margin:8px 0 4px">Bloque de ${n} puesto${n === 1 ? '' : 's'}: se mueven juntos.</p><div class="btns"><button id="grpOff">Desagrupar</button></div>`
      : t > 1 ? `<p class="hint" style="margin:8px 0 4px">Este puesto no está agrupado. Hay ${t} puestos con mesas que se tocan.</p><div class="btns"><button id="grpOn">Agrupar ${t} puestos</button></div>` : '');
  };
  // "Girar mesa 90°" en un bloque gira el bloque entero (horario, en torno a su centro). Va en captura
  // para adelantarse al giro de un solo puesto de la app.
  document.addEventListener('click', e => {
    const s = e.target.id === 'e_rot' && ui.sel && seatById(ui.sel);
    if(!s || !s.grp || fixedPlan()) return;
    const list = blockOf(s);
    if(list.length < 2) return;
    e.stopImmediatePropagation();
    const bx = list.map(seatBox), cx = (Math.min(...bx.map(b => b.x0)) + Math.max(...bx.map(b => b.x1))) / 2, cy = (Math.min(...bx.map(b => b.y0)) + Math.max(...bx.map(b => b.y1))) / 2;
    for(const m of list){
      const n = {...m, x:cx - (m.y - cy), y:cy + (m.x - cx), dir:DIRS[(DIRS.indexOf(m.dir || 'R') + 1) % 4]};
      plano.set(m.id, {...(plano.get(m.id) || {}), ...n}); savePlano(n);
    }
    bump(); render();
  }, true);
  document.addEventListener('click', e => {
    const b = e.target.closest('#grpOff,#grpOn'), s = b && ui.sel && seatById(ui.sel);
    if(!s) return;
    if(b.id === 'grpOff'){
      const list = blockOf(s);
      for(const m of list){ plano.set(m.id, {...(plano.get(m.id) || {}), grp:''}); savePlano({...m, grp:''}); }
      bump(); render(); toast(`Se desagruparon ${list.length} puestos: ahora se mueven de a uno.`);
    } else {
      const list = touchingGroup(s), grp = uid('b');
      for(const m of list){ plano.set(m.id, {...(plano.get(m.id) || {}), grp}); savePlano({...m, grp}); }
      bump(); render(); toast(`Se agruparon ${list.length} puestos: ahora se mueven juntos.`);
    }
  });
}

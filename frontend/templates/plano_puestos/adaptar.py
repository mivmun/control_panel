"""Convierte la app "Puestos Piso 5" de claude.ai en plantilla.html para el panel.

Uso:  python adaptar.py "Puestos Piso 5 - app.txt"
Después:  python actualizar.py   (pasa la plantilla a plano_puestos.html conservando los datos)

La app de claude.ai lee y guarda en la base de datos de claude.ai. Aquí se le pega local_db.js,
que responde a esas mismas llamadas guardando en el navegador y partiendo de los datos del archivo.
ajustes_p5.js fija el Piso 5 según el plano de arquitectura y deja la Sala de reuniones 1 como un puesto.
formato_jej.py le pone el formato JEJ (colores, tipografía y logo del panel).
Si claude.ai cambia el código y algún ajuste ya no calza, el script se detiene y dice cuál.
"""
import os, re, sys

import formato_jej

HERE = os.path.dirname(os.path.abspath(__file__))
if len(sys.argv) < 2:
    sys.exit(__doc__)
src = open(sys.argv[1], encoding='utf-8-sig').read()
shim = open(os.path.join(HERE, 'local_db.js'), encoding='utf-8').read()
ajustes = ''.join(open(os.path.join(HERE, f), encoding='utf-8').read().rstrip() + '\n\n' for f in ('ajustes_p5.js', 'personal_ging.js'))

EXTRA_BTNS = ('<button id="bkB" title="Descarga un .json con todos los datos (tiene nombres: no subir al repo)">Guardar respaldo</button>'
              '<button id="rsB">Cargar respaldo…</button>'
              '<button id="rstB" title="Descarta los cambios de este navegador y vuelve a los datos del archivo">Volver a los datos del archivo</button>')
EXTRA_JS = ("$('#bkB').onclick = LOCAL.backup; $('#rsB').onclick = LOCAL.restoreFile; $('#rstB').onclick = LOCAL.reset;\n"
            "$('#notice').hidden = true;\n")

# (qué se busca, con qué se reemplaza, para qué)
PATCHES = [
    (r"'/_blob/' \+ LAYOUT\.bg", "LOCAL.blob(LAYOUT.bg)", 'imagen de fondo de los pisos'),
    # <image> es SVG: .hidden no existe ahí y el atributo hidden se queda puesto (el fondo de los pisos nuevos nunca se ve).
    (r"img\.hidden = false;", "img.removeAttribute('hidden');", 'mostrar imagen de fondo'),
    (r"img\.hidden = true;", "img.setAttribute('hidden', '');", 'ocultar imagen de fondo'),
    (r"s\.textContent = ui\.canWrite \? '[^']*' : '[^']*';", "s.textContent = 'Guardado en este navegador';", 'texto de estado'),
    (r"\$\('#reqB'\)\.hidden = [^;]+;", "$('#reqB').hidden = true;", 'ocultar solicitudes de claude.ai'),
    # Piso 5 fijo: en "Ordenar plano" no se arrastran los puestos (ver ajustes_p5.js).
    (r"sid && ui\.mode === 'ordenar' && ui\.isAdmin\)", "sid && ui.mode === 'ordenar' && ui.isAdmin && !fixedPlan())", 'no arrastrar puestos en Piso 5'),
    # Enlace con Personal GING: las personas pasan por enrichPeople (ver personal_ging.js).
    (r"on\('personas', m => people = m\);", "on('personas', m => people = enrichPeople(m));", 'perfil desde Personal GING'),
    # Hoja para imprimir: 52% + 48% + la separación pasaba del 100% y la columna Viernes quedaba fuera del margen.
    (r"\.pgrid\{display:grid;grid-template-columns:52% 48%;", ".pgrid{display:grid;grid-template-columns:minmax(0,52fr) minmax(0,48fr);", 'ancho de la hoja para imprimir'),
    (r'(<button id="exportB"[^>]*>[^<]*</button>)', r'\1' + EXTRA_BTNS.replace('\\', '\\\\'), 'botones de respaldo'),
]

out = src
for pat, rep, what in PATCHES:
    out, n = re.subn(pat, lambda m, rep=rep: m.expand(rep), out)
    if n != 1:
        sys.exit(f'No se pudo aplicar el ajuste "{what}" (coincidencias: {n}). Revisar adaptar.py.')

# ajustes_p5.js y personal_ging.js van dentro del script de la app, justo antes de que empiece a dibujar.
MARK = '// ---------- inicio ----------'
if out.count(MARK) != 1:
    sys.exit('No se encontró el inicio de la app (' + MARK + ').')
out = out.replace(MARK, ajustes.rstrip() + '\n\n' + MARK)

# local_db.js va en su propio <script>, antes del de la app; los botones de respaldo, al final del de la app.
i = out.find('\n<script>\n')
j = out.rfind('\n</script>')
if i < 0 or j < i:
    sys.exit('No se encontró el <script> de la app.')
out = out[:j] + '\n' + EXTRA_JS + out[j:]
out = out[:i] + '\n<script>\n' + shim.rstrip() + '\n</script>' + out[i:]

if not out.lstrip().lower().startswith('<!doctype'):
    out = ('<!doctype html>\n<html lang="es">\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width,initial-scale=1">\n') + out

out = formato_jej.aplicar(out)
open(os.path.join(HERE, 'plantilla.html'), 'w', encoding='utf-8', newline='').write(out)
print('ok plantilla.html', len(out), 'caracteres. Ahora: python actualizar.py')

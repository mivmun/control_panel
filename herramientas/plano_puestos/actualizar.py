"""Actualiza plano_puestos.html con la última plantilla.html, conservando los datos.

Uso:  python actualizar.py [respaldo.json]
Sin argumentos toma los datos del plano_puestos.html actual. Con un respaldo (.json de
"Guardar respaldo"), esos datos pasan a ser los del archivo (y los de "Volver a los datos originales").
La salida contiene nombres de personas: está en .gitignore, no se versiona.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(HERE, 'plantilla.html')
OUT = os.path.join(HERE, 'plano_puestos.html')
SEED_RE = re.compile(r'^const SEED = (.*);$', re.M)

if len(sys.argv) > 1:
    seed = json.load(open(sys.argv[1], encoding='utf-8'))
    if 'floors' not in seed or 'people' not in seed:
        sys.exit('Ese archivo no es un respaldo del plano de puestos.')
else:
    if not os.path.exists(OUT):
        sys.exit('No existe plano_puestos.html; pasa un respaldo .json.')
    m = SEED_RE.search(open(OUT, encoding='utf-8').read())
    seed = json.loads(m.group(1)) if m else None
    if not seed:
        sys.exit('plano_puestos.html no tiene datos; pasa un respaldo .json.')

html = open(TPL, encoding='utf-8').read().replace('/*__SEED__*/null', json.dumps(seed, ensure_ascii=False))
open(OUT, 'w', encoding='utf-8').write(html)
print('ok', len(seed['floors']), 'pisos,', len(seed['people']), 'personas')

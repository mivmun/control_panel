"""Actualiza plano_puestos.html con la última plantilla.html, conservando los datos.

Uso:  python actualizar.py [respaldo.json]
Sin argumentos toma los datos del plano_puestos.html actual. Con un respaldo (.json de
"Guardar respaldo"), esos datos pasan a ser los del archivo (y los de "Volver a los datos del archivo").
Acepta respaldos de la versión anterior (pisos/personas) y de la actual (docs); la app convierte los antiguos.
La salida contiene nombres de personas: está en .gitignore, no se versiona.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(HERE, 'plantilla.html')
OUT = os.path.join(HERE, 'plano_puestos.html')
SEED_RE = re.compile(r'^const SEED = (.*);$', re.M)


def valid(seed):
    return isinstance(seed, dict) and (isinstance(seed.get('docs'), dict) or isinstance(seed.get('floors'), list))


if len(sys.argv) > 1:
    seed = json.load(open(sys.argv[1], encoding='utf-8-sig'))
    if not valid(seed):
        sys.exit('Ese archivo no es un respaldo del plano de puestos.')
else:
    if not os.path.exists(OUT):
        sys.exit('No existe plano_puestos.html; pasa un respaldo .json.')
    m = SEED_RE.search(open(OUT, encoding='utf-8').read())
    seed = json.loads(m.group(1).replace('<\\/', '</')) if m else None
    if not valid(seed):
        sys.exit('plano_puestos.html no tiene datos; pasa un respaldo .json.')

tpl = open(TPL, encoding='utf-8').read()
if tpl.count('/*__SEED__*/null') != 1:
    sys.exit('plantilla.html no tiene el lugar para los datos (/*__SEED__*/null).')
data = json.dumps(seed, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')  # que un "</script>" en los datos no corte la página
open(OUT, 'w', encoding='utf-8', newline='').write(tpl.replace('/*__SEED__*/null', data))
if 'docs' in seed:
    docs = seed['docs']
    print('ok', sum(k.startswith('personas/') for k in docs), 'personas en Piso 5,', sum(k.startswith('admin-pisos/') and k.count('/') == 1 for k in docs) + 1, 'pisos')
else:
    print('ok', len(seed['floors']), 'pisos,', len(seed['people']), 'personas (formato anterior: la app lo convierte al abrir)')

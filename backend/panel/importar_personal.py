"""Importar Excel en Personal GING: agrega a quien falta y completa los datos vacíos.

El Excel debe tener exactamente las columnas de Personal GING (las mismas que deja "Exportar → Excel"),
en cualquier orden. Se aceptan con guion bajo o con espacio y sin importar mayúsculas ni tildes
("apellido_paterno" = "Apellido paterno"). Si falta o sobra alguna columna, el archivo se rechaza.

Cada fila se busca en el panel por RUT; si no tiene, por usuario; si tampoco, por nombre completo.
- No está en el panel  → se agrega (necesita nombre y apellido paterno).
- Ya está              → se completan solo los campos vacíos en el panel. Lo que ya tiene valor no se
                          cambia; si el Excel trae otro valor, se muestra como diferencia.
rut_jej y rut_sp no se leen: salen del RUT al guardar (ver Personal.save).
"""
import datetime
import re
import unicodedata

from django.db import transaction

from . import models, rut
from .forms import modalidad_fraccion
from .registry import editable_fields

CAMPOS = [f for f in editable_fields(models.Personal)]
COLUMNAS = [f.name for f in CAMPOS]
DERIVADOS = {'rut_jej', 'rut_sp'}
TIPO = {f.name: f.get_internal_type() for f in CAMPOS}


class ArchivoRechazado(Exception):
    pass


def _norm(texto):
    t = unicodedata.normalize('NFKD', str(texto or '')).encode('ascii', 'ignore').decode()
    return re.sub(r'[\s_]+', ' ', t).strip().lower()


ETIQUETA = {_norm(c): c for c in COLUMNAS}


def _valor(campo, v):
    """Valor de una celda tal como se guarda en la base, o None si está vacía. ValueError si no calza."""
    if v is None or (isinstance(v, str) and not v.strip()):
        return None
    tipo = TIPO[campo]
    if tipo == 'IntegerField':
        return int(float(str(v).strip().replace(',', '.')))
    if tipo == 'FloatField':
        return float(str(v).strip().replace(',', '.'))
    if isinstance(v, datetime.datetime):
        return v.date().isoformat()
    if isinstance(v, datetime.date):
        return v.isoformat()
    if campo == 'modalidad':
        return modalidad_fraccion(v)
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v).strip()


def leer(archivo):
    """Filas del Excel como [(n° de fila, {campo: valor})]. ArchivoRechazado si no es de Personal GING."""
    import openpyxl
    try:
        wb = openpyxl.load_workbook(archivo, read_only=True, data_only=True)
    except Exception:
        raise ArchivoRechazado('No se pudo leer el archivo. Debe ser un Excel (.xlsx).')
    filas = list(wb.worksheets[0].iter_rows(values_only=True)) if wb.worksheets else []
    if not filas:
        raise ArchivoRechazado('El archivo está vacío.')

    encabezado = [_norm(h) for h in filas[0]]
    # Una columna sin título y sin datos no cuenta (suele quedar al borrar columnas en Excel).
    con_datos = lambda i: any(i < len(f) and f[i] is not None and str(f[i]).strip() for f in filas[1:])
    sobran = [str(filas[0][i]).strip() if h else f'una columna sin título (columna {i + 1})'
              for i, h in enumerate(encabezado) if h not in ETIQUETA and (h or con_datos(i))]
    vistos = [ETIQUETA[h] for h in encabezado if h in ETIQUETA]
    faltan = [c for c in COLUMNAS if c not in vistos]
    repetidas = sorted({c for c in vistos if vistos.count(c) > 1})
    if len(set(vistos)) < len(COLUMNAS) / 2:
        trae = ', '.join(str(h).strip() for h in filas[0] if h is not None and str(h).strip())
        raise ArchivoRechazado(f'No parece un Excel de Personal GING: sus columnas son {trae or "(ninguna)"}. '
                               'Usa un Excel con las columnas de "Exportar → Excel" de esta tabla.')
    if faltan or sobran or repetidas:
        partes = []
        if faltan:
            partes.append('faltan ' + ', '.join(c.replace('_', ' ') for c in faltan))
        if sobran:
            partes.append('sobran ' + ', '.join(sobran))
        if repetidas:
            partes.append('están repetidas ' + ', '.join(c.replace('_', ' ') for c in repetidas))
        raise ArchivoRechazado('El archivo no tiene las mismas columnas que Personal GING: ' + '; '.join(partes) + '. '
                               'Usa un Excel con las columnas de "Exportar → Excel" de esta tabla.')

    indice = {ETIQUETA[h]: i for i, h in enumerate(encabezado) if h in ETIQUETA}
    out, errores = [], []
    for n, fila in enumerate(filas[1:], start=2):
        if not any(c is not None and str(c).strip() for c in fila):
            continue
        datos = {}
        for campo, i in indice.items():
            celda = fila[i] if i < len(fila) else None
            try:
                datos[campo] = _valor(campo, celda)
            except ValueError:
                errores.append(f'fila {n}, {campo.replace("_", " ")}: "{celda}" no es un número')
        out.append((n, datos))
    if errores:
        raise ArchivoRechazado('Hay valores que no calzan con su columna: ' + '; '.join(errores[:8])
                               + (f' (y {len(errores) - 8} más)' if len(errores) > 8 else '') + '.')
    if not out:
        raise ArchivoRechazado('El archivo tiene las columnas correctas, pero no trae personas.')
    return out


def _clave_rut(v):
    p = rut.partes(v)
    return p[0] if p else None


def _nombre(d):
    return _norm(' '.join(x for x in (d.get('nombre'), d.get('apellido_paterno'), d.get('apellido_materno')) if x))


def _igual(campo, a, b):
    if TIPO[campo] in ('FloatField', 'IntegerField'):
        try:
            return abs(float(a) - float(b)) < 1e-6
        except (TypeError, ValueError):
            pass
    if campo == 'modalidad':
        a, b = modalidad_fraccion(a), modalidad_fraccion(b)
    if campo == 'rut':
        return _clave_rut(a) == _clave_rut(b)
    return _norm(a) == _norm(b)


def _texto(v):
    return '' if v is None else (f'{v:g}' if isinstance(v, float) else str(v))


def planificar(filas):
    """Qué haría la importación, sin guardar nada (se guarda en la sesión para confirmar)."""
    personas = list(models.Personal.objects.all())
    por_rut = {_clave_rut(p.rut): p for p in personas if _clave_rut(p.rut)}
    por_usuario = {p.usuario.strip().lower(): p for p in personas if p.usuario and p.usuario.strip()}
    por_nombre = {_nombre(p.__dict__): p for p in personas if p.nombre}

    nuevos, completar, diferencias, omitidas, usadas = [], [], [], [], {}
    for n, d in filas:
        k_rut = _clave_rut(d.get('rut') or d.get('rut_sp') or d.get('rut_jej'))
        k_usr = (d.get('usuario') or '').lower() or None
        k_nom = _nombre(d) or None
        clave = ('rut', k_rut) if k_rut else ('usuario', k_usr) if k_usr else ('nombre', k_nom) if k_nom else None
        if not clave:
            omitidas.append({'fila': n, 'motivo': 'sin RUT, usuario ni nombre'})
            continue
        if clave in usadas:
            omitidas.append({'fila': n, 'motivo': f'repetida en el Excel (igual a la fila {usadas[clave]})'})
            continue
        usadas[clave] = n

        p = (por_rut.get(k_rut) if k_rut else None) or (por_usuario.get(k_usr) if k_usr else None) or (por_nombre.get(k_nom) if k_nom else None)
        if p is None:
            if not d.get('nombre') or not d.get('apellido_paterno'):
                omitidas.append({'fila': n, 'motivo': 'persona nueva sin nombre o apellido paterno'})
                continue
            if not d.get('rut'):
                d['rut'] = d.get('rut_sp') or d.get('rut_jej')
            nuevos.append({'fila': n, 'nombre': _nombre_visible(d), 'datos': {c: v for c, v in d.items() if c not in DERIVADOS}})
            continue

        campos, nombre = {}, p.nombre_completo
        for c in COLUMNAS:
            if c in DERIVADOS or d.get(c) is None:
                continue
            actual = getattr(p, c)
            if actual is None or (isinstance(actual, str) and not actual.strip()):
                campos[c] = d[c]
            elif not _igual(c, actual, d[c]):
                diferencias.append({'nombre': nombre, 'campo': c.replace('_', ' '), 'panel': _texto(actual), 'excel': _texto(d[c])})
        if campos:
            completar.append({'id': p.pk, 'nombre': nombre, 'campos': campos,
                              'lista': ', '.join(c.replace('_', ' ') for c in campos)})
    return {'nuevos': nuevos, 'completar': completar, 'diferencias': diferencias, 'omitidas': omitidas,
            'filas': len(filas)}


def _nombre_visible(d):
    return ' '.join(x for x in (d.get('nombre'), d.get('apellido_paterno'), d.get('apellido_materno')) if x)


@transaction.atomic
def aplicar(plan):
    """Guarda lo planificado. Vuelve a revisar que cada campo siga vacío antes de completarlo."""
    agregados = completados = 0
    for n in plan['nuevos']:
        models.Personal(**n['datos']).save()
        agregados += 1
    for c in plan['completar']:
        p = models.Personal.objects.filter(pk=c['id']).first()
        if p is None:
            continue
        cambio = False
        for campo, v in c['campos'].items():
            actual = getattr(p, campo)
            if actual is None or (isinstance(actual, str) and not actual.strip()):
                setattr(p, campo, v)
                cambio = True
        if cambio:
            p.save()
            completados += 1
    return agregados, completados

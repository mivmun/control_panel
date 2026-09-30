"""Separa Personal.profesional en nombre, apellido_paterno y apellido_materno.

    python manage.py separar_nombres            # solo muestra la propuesta, no cambia nada
    python manage.py separar_nombres --aplicar  # respalda gtec.db, agrega las columnas y las llena

Personal GING escribe "Nombres Paterno Materno" y a veces omite un nombre o un apellido
("Juan Pablo Soto": ¿Pablo es nombre o apellido?), así que contar palabras no alcanza. Se cruza por RUT con
remuneraciones, que trae "Paterno Materno Nombres" completo: de ahí se sabe cuál palabra
es el apellido paterno. Se conserva la escritura de Personal (con tildes); remuneraciones
solo decide dónde cortar y completa el apellido materno cuando Personal lo omitió.
La columna profesional no se borra.
"""
import shutil
import unicodedata
from datetime import date

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection, transaction

COLUMNAS = ['nombre', 'apellido_paterno', 'apellido_materno']
# Palabras que van pegadas al apellido que sigue: "de la Cruz", "del Río", "van Dijk".
PARTICULAS = {'de', 'del', 'la', 'las', 'los', 'y', 'san', 'van', 'von', 'da', 'do', 'dos'}


def _clave(s):
    s = unicodedata.normalize('NFKD', s or '')
    return ''.join(c for c in s if not unicodedata.combining(c)).lower()


def _grupos(texto):
    """Palabras del nombre, con las partículas unidas a la palabra siguiente."""
    grupos, pendiente = [], []
    for w in (texto or '').split():
        pendiente.append(w)
        if _clave(w) not in PARTICULAS:
            grupos.append(' '.join(pendiente))
            pendiente = []
    if pendiente:  # partícula suelta al final: se pega al último grupo
        grupos[-1:] = [' '.join((grupos[-1:] or []) + pendiente)]
    return grupos


def _rut_clave(rut):
    return (rut or '').replace('.', '').replace('-', '').upper().lstrip('0')


def _por_conteo(g):
    # Sin cruce: los dos últimos grupos son apellidos (con dos palabras, el último).
    if len(g) <= 1:
        return ' '.join(g), None, None
    if len(g) == 2:
        return g[0], g[1], None
    return ' '.join(g[:-2]), g[-2], g[-1]


def separar(profesional, nombre_rem):
    """(nombre, paterno, materno, origen, nota)."""
    g = _grupos(profesional)
    if not nombre_rem:
        n, p, m = _por_conteo(g)
        return n, p, m, 'conteo', 'sin RUT en remuneraciones'

    rem = _grupos(nombre_rem)
    paterno_rem = _clave(rem[0])
    materno_rem = _clave(rem[1]) if len(rem) >= 3 else None
    claves = [_clave(x) for x in g]
    # El paterno se busca desde la segunda palabra: la primera siempre es un nombre.
    idx = next((i for i in range(1, len(g)) if claves[i] == paterno_rem), None)
    if idx is None:
        n, p, m = _por_conteo(g)
        return n, p, m, 'conteo', f'no calza con remuneraciones ("{nombre_rem}")'

    nombre = ' '.join(g[:idx])
    paterno = g[idx]
    resto = g[idx + 1:]
    materno = ' '.join(resto) or None
    nota = ''
    if materno and materno_rem and _clave(materno) != materno_rem:
        nota = f'materno distinto en remuneraciones ("{rem[1]}")'
    elif not materno and materno_rem:
        # Personal lo omitió; remuneraciones (libro oficial) lo tiene.
        materno = rem[1].title()
        nota = 'materno tomado de remuneraciones'
    return nombre, paterno, materno, 'rut', nota


class Command(BaseCommand):
    help = 'Separa Personal.profesional en nombre y apellidos (cruce por RUT con remuneraciones).'

    def add_arguments(self, parser):
        parser.add_argument('--aplicar', action='store_true', help='Escribe en la base (antes la respalda).')

    def handle(self, *args, aplicar=False, **opts):
        with connection.cursor() as cur:
            cur.execute('SELECT nombre, rut, rut2 FROM remuneraciones')
            rem = {}
            for nombre, *ruts in cur.fetchall():
                for r in ruts:
                    if r:
                        rem.setdefault(_rut_clave(r), nombre)
            cur.execute('SELECT id, profesional, rut FROM personal ORDER BY id')
            filas = cur.fetchall()

        propuesta = [(pk, prof, *separar(prof, rem.get(_rut_clave(rut)))) for pk, prof, rut in filas]

        self.stdout.write(f'{"id":>3}  {"profesional":38} {"nombre":24} {"paterno":16} {"materno":16} origen')
        for pk, prof, n, p, m, origen, nota in propuesta:
            linea = f'{pk:>3}  {prof or "":38} {n or "":24} {p or "":16} {m or "":16} {origen}'
            self.stdout.write(linea + (f'  <- {nota}' if nota else ''))
        revisar = sum(1 for *_, origen, nota in propuesta if nota)
        self.stdout.write(f'\n{len(propuesta)} filas; {revisar} con nota para revisar.')

        if not aplicar:
            self.stdout.write('Nada escrito. Para aplicar: python manage.py separar_nombres --aplicar')
            return

        db = settings.DATABASES['default']['NAME']
        respaldo = db.with_name(f'gtec_respaldo_{date.today().isoformat()}_antes_nombres.db')
        connection.close()
        shutil.copy2(db, respaldo)
        self.stdout.write(f'Respaldo: {respaldo}')

        with transaction.atomic(), connection.cursor() as cur:
            cur.execute('PRAGMA table_info(personal)')
            existentes = {r[1] for r in cur.fetchall()}
            for col in COLUMNAS:
                if col not in existentes:
                    cur.execute(f'ALTER TABLE personal ADD COLUMN {col} TEXT')
            cur.executemany(
                'UPDATE personal SET nombre = %s, apellido_paterno = %s, apellido_materno = %s WHERE id = %s',
                [(n, p, m, pk) for pk, _, n, p, m, _, _ in propuesta])
        self.stdout.write(self.style.SUCCESS(f'Listo: {len(propuesta)} filas actualizadas.'))

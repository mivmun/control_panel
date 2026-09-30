"""RUT chileno: validación y los tres formatos que usa Personal GING.

    rut     = 20.250.469-8    (con puntos, como se escribe)
    rut_jej = 020.250.469-8   (cuerpo rellenado con ceros a 9 dígitos)
    rut_sp  = 20250469-8      (sin puntos)
"""
import re


def _puntos(cuerpo):
    # Agrupa de a tres desde la derecha sin perder los ceros de la izquierda (020.250.469).
    return '.'.join(re.findall(r'\d{1,3}', cuerpo[::-1]))[::-1]


def partes(valor):
    """Devuelve (cuerpo, dv) desde cualquier forma de escribirlo, o None si no se entiende."""
    limpio = re.sub(r'[\s.\-]', '', str(valor or '')).upper()
    m = re.fullmatch(r'(\d{1,9})([\dK])', limpio)
    if not m:
        return None
    return m.group(1).lstrip('0') or '0', m.group(2)


def dv(cuerpo):
    suma, factor = 0, 2
    for d in reversed(cuerpo):
        suma += int(d) * factor
        factor = 2 if factor == 7 else factor + 1
    r = 11 - suma % 11
    return '0' if r == 11 else 'K' if r == 10 else str(r)


def es_valido(valor):
    p = partes(valor)
    return p is not None and dv(p[0]) == p[1]


def formatos(valor):
    """(rut, rut_jej, rut_sp) o None si el valor no es un RUT."""
    p = partes(valor)
    if p is None:
        return None
    cuerpo, d = p
    return (
        f'{_puntos(cuerpo)}-{d}',
        f'{_puntos(cuerpo.zfill(9))}-{d}',
        f'{cuerpo}-{d}',
    )

import os

from django import template
from django.contrib.staticfiles import finders
from django.templatetags.static import static

register = template.Library()


@register.filter
def get_item(value, key):
    if hasattr(value, 'get'):
        return value.get(key)
    try:
        return value[key]
    except (KeyError, IndexError, TypeError):
        return None


@register.simple_tag
def static_v(path):
    # URL de static con la fecha del archivo: al cambiar el CSS el navegador no usa la copia vieja.
    archivo = finders.find(path)
    if not archivo:
        return static(path)
    return f'{static(path)}?v={int(os.path.getmtime(archivo))}'

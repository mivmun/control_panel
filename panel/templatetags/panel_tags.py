from django import template

register = template.Library()


@register.filter
def get_item(value, key):
    if hasattr(value, 'get'):
        return value.get(key)
    try:
        return value[key]
    except (KeyError, IndexError, TypeError):
        return None

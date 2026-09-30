"""Pega formato_jej.css (con los logos JEJ incrustados) y el script del tema justo después de los estilos de la app del plano.

Uso:  python formato_jej.py            (aplica a plantilla.html; después: python actualizar.py)
adaptar.py lo llama solo. Se puede correr varias veces: reemplaza el bloque anterior.
"""
import base64, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', '..', 'static', 'panel', 'img')
BLOQUE = re.compile(r'\n?<(style|script) id="formato-jej">.*?</\1>', re.S)
# Mismo tema que el panel: la clave 'panel-tema' se comparte (mismo sitio) y el cambio llega en vivo.
TEMA_JS = '''(function(){
  function aplicar(){ try{ var t = localStorage.getItem('panel-tema');
    if(t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }catch(e){} }
  aplicar(); window.addEventListener('storage', function(e){ if(e.key === 'panel-tema') aplicar(); });
})();'''


def aplicar(html):
    css = open(os.path.join(HERE, 'formato_jej.css'), encoding='utf-8').read()
    for marca, archivo in (('/*__LOGO__*/', 'logo_jej_azul.png'), ('/*__LOGO_BLANCO__*/', 'logo_jej_blanco.png')):
        logo = base64.b64encode(open(os.path.join(IMG, archivo), 'rb').read()).decode()
        css = css.replace(marca, 'data:image/png;base64,' + logo)
    html = BLOQUE.sub('', html)
    # Va después del primer </style> (el de la app). No se usa </head>: la app no lo escribe y el
    # único que hay está dentro del JavaScript de la hoja para imprimir.
    i = html.find('</style>')
    if i < 0:
        sys.exit('No se encontraron los estilos de la app (</style>).')
    i += len('</style>')
    bloque = f'\n<style id="formato-jej">\n{css.strip()}\n</style>\n<script id="formato-jej">\n{TEMA_JS}\n</script>'
    return html[:i] + bloque + html[i:]


if __name__ == '__main__':
    tpl = os.path.join(HERE, 'plantilla.html')
    out = aplicar(open(tpl, encoding='utf-8').read())
    open(tpl, 'w', encoding='utf-8', newline='').write(out)
    print('ok formato JEJ en plantilla.html. Ahora: python actualizar.py')

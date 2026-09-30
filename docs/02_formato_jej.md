# Formato JEJ para las páginas del panel

Fuente: `Template PPT 2023_Nuevo_logo_JEJ_.pptx` y `Presentacion_LevDigital_Gerente_Ingeniería.pptx`
(colores medidos en las láminas renderizadas, logo sacado de `ppt/media/image4.emf`).
Toda página nueva extiende `panel/base.html` y usa los tokens de `static/panel/css/styles.css`;
no se escriben colores sueltos en las plantillas.

## Colores

| Token | Hex | Uso |
|---|---|---|
| `--jej-azul` | `#0A4290` | Color dominante: barra lateral, títulos, botón principal, encabezado de tablas, franja al pie |
| `--jej-azul-logo` | `#1E418C` | Solo el logo |
| `--jej-azul-oscuro` | `#07306A` | Hover sobre azul |
| `--jej-cian` | `#20C8FA` | Curva de marca, anillo de foco, 3ª serie de gráficos. Nunca texto sobre blanco |
| `--jej-celeste` | `#5FC5F5` | Curva secundaria, títulos de sección del menú, 2ª serie |
| `--jej-gris` | `#BDBDBD` | Curva gris (láminas con foto) |
| `--jej-texto` | `#2A2D31` | Texto de cuerpo |
| `--jej-texto-suave` | `#64748B` | Etiquetas, notas |
| `--jej-borde` | `#D4D6D9` | Bordes |
| `--jej-superficie` | `#F2F4F7` | Campos de solo lectura, pistas de barras |
| `--jej-superficie-azul` | `#EAF1FA` | Hover de filas, chips |
| `--success` / `--warning` / `--danger` | `#2F8A57` / `#A7751A` / `#B42318` | Estados |

Proporción como en las láminas: blanco de fondo, azul JEJ dominante, cian/celeste solo en detalles.

## Tema claro y oscuro

El claro es el de las láminas. El oscuro usa azul noche de la marca, con títulos y enlaces en celeste.
Por defecto sigue al sistema; el botón de la barra lateral lo fija y lo guarda en el navegador (`localStorage` `panel-tema`).
El plano de puestos lee la misma clave y cambia a la vez.

Las plantillas no usan los hex de la tabla de arriba sino los tokens por función de `styles.css`, que cambian con el tema:
`--c-fondo`, `--c-superficie`, `--c-input`, `--c-hover`, `--c-texto`, `--c-texto-suave`, `--c-borde`, `--c-titulo`,
`--c-enlace`, `--c-primario`, `--c-lateral`, `--c-thead`, `--c-franja`, `--c-foco-borde`, `--c-ok-fondo`, `--c-error-fondo`.

| Token | Claro | Oscuro |
|---|---|---|
| `--c-fondo` / `--c-superficie` | `#FFFFFF` / `#FFFFFF` | `#0B1522` / `#111E30` |
| `--c-texto` / `--c-texto-suave` | `#2A2D31` / `#64748B` | `#E3E8EF` / `#94A3B8` |
| `--c-titulo`, `--c-enlace` | azul JEJ | celeste JEJ |
| `--c-primario` (botones) | azul JEJ | `#1F5FBF` |
| `--c-lateral` | azul JEJ | `#07306A` |

## Tipografía

`'Helvetica Neue', Helvetica, Arial, sans-serif` (la presentación usa Helvetica Light y Arial).
Títulos de página 26 px en peso 300 y azul JEJ; cifras grandes 30 px peso 300; cuerpo 14 px; etiquetas 12 px.

## Estructura

- **Logo** arriba a la izquierda: `static/panel/img/logo_jej_blanco.png` sobre azul,
  `logo_jej_azul.png` sobre blanco. PNG transparentes; no deformar ni recolorear.
- **Barra lateral azul** (como la portada) con el cuarto de anillo cian al final del menú.
- **Contenido sobre blanco**, tarjetas blancas con borde `--jej-borde` y sombra suave.
- **Franja azul de 8 px al pie**, igual que las láminas de contenido.
- Tarjetas de cifra al estilo "81% / US$104.549 M": número grande azul, etiqueta chica gris debajo.

## Plano de puestos

Es una app de un solo archivo (`frontend/templates/plano_puestos/`) con estilos propios. El formato JEJ se le
aplica con `formato_jej.css`, que `formato_jej.py` pega al final del `<head>` con el logo incrustado.
Verde, ámbar y rojo de los puestos se mantienen porque indican estado; el ocupado pasa a azul JEJ.
En oscuro usa la misma paleta noche y el logo blanco.

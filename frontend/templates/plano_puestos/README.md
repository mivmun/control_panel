# Plano de Puestos

App HTML de un solo archivo con el plano de la oficina, los puestos y quién los ocupa cada día
(Lu–Ju, Viernes A y B), más ausencias, préstamos de puesto, salas, impresoras, inventario y reportes.
El panel la muestra en Puestos Oficina → plano. Es la fuente oficial de los puestos: el Excel de
puestos ya no se usa.

La app viene de "Puestos Piso 5" en claude.ai. Allá guarda en la base de datos de claude.ai; aquí
`local_db.js` responde a esas mismas llamadas guardando en el navegador (localStorage), así que
**los datos de claude.ai y los del panel no se sincronizan**.

- `local_db.js`: reemplazo local de la base de datos, usuario, descargas e imágenes de claude.ai. Al
  eliminar un piso borra también todos sus datos y su imagen de plano si ningún otro piso la usa (y al abrir
  limpia lo que hayan dejado pisos eliminados antes).
- `ajustes_p5.js`: Piso 5 fijo según el plano de arquitectura (`Z:\00 Control de Gestion GTE\26 Oficina
  Casa Matriz\07 Puestos Oficina\JeJ-Habilitacion-Piso 5_Anteproyecto_Puestos de Trabajo.pdf`): posición de
  cada silla y tamaño real de cada mesa, sacados del PDF. En Piso 5 los puestos no se mueven, giran,
  agregan ni quitan ("Datos de los puestos" solo cambia número, zona y nota). La Sala de reuniones 1 ya no
  se reserva: es el puesto 55 "I+D". También trae el dibujo de los puestos (mesa, silla, monitor, nombres).
- `adaptar.py`: toma el código de la app de claude.ai y arma `plantilla.html` (le pega `local_db.js`
  y unos ajustes chicos). Si claude.ai cambió algo que ya no calza, se detiene y dice cuál.
- `personal_ging.js`: enlaza a las personas del plano con Personal GING (lee `personal.json` del panel:
  usuario, nombre, cargo, disciplina, rol, CC y modalidad; sin RUT, correos ni montos). El enlace es por
  usuario; si no hay, por nombre. Cargo y disciplina se cambian en Personal GING. Quien no está ahí aparece
  como "Externo". En "Editar" se puede fijar el enlace a mano. Fuera del panel (doble clic) no hay enlace.
- `grupos.js`: los puestos de un bloque ("+ Agregar bloque") quedan agrupados y en "Ordenar plano" se
  mueven juntos. Al elegir un puesto: "Desagrupar", o "Agrupar" con las mesas que se tocan con la suya
  (para bloques armados antes). "Girar bloque 90°" gira el bloque entero. No aplica en Piso 5, que es fijo.
- `config_pisos.js`: Administración → "Configuración de pisos": lista todos los pisos para ir, duplicar o
  eliminar cualquiera, y crear uno nuevo. Duplicar copia el plano y los puestos; opcionalmente las personas y
  sus puestos. Los pisos copiados comparten la imagen del plano. Una copia del Piso 5 usa su plano de
  arquitectura, pero sus puestos sí se mueven. El Piso 5 no se elimina.
- `lockers.js`: los closets de Oficina A (18 lockers) y Oficina B (20) del Piso 5 son un botón en el plano. Al
  tocarlo se abre a la derecha la lista: número, dueño (elegido desde Personal GING) y cuántas llaves hay; arriba,
  el resumen (asignados, libres, llaves y lockers sin llave). Administración lo edita tocando un locker. Se guarda
  en la colección `lockers` (A01…A18, B01…B20); al liberar un locker sus llaves se mantienen.
- `formato_jej.css` / `formato_jej.py`: formato JEJ (paleta, tipografía y logo del panel, ver
  `docs/02_formato_jej.md`). `adaptar.py` lo aplica solo; para rehacerlo sobre la plantilla actual:
  `python formato_jej.py` y luego `python actualizar.py`.
- `plantilla.html`: la app sin datos (se puede versionar).
- `plano_puestos.html`: la app con los datos incrustados. **Contiene nombres de personas → no se
  versiona** (ver `.gitignore`).
- `actualizar.py`: pasa `plantilla.html` a `plano_puestos.html` sin perder los datos.

Cuando llegue una versión nueva de la app desde claude.ai:

```
python frontend/templates/plano_puestos/adaptar.py "Puestos Piso 5 - app.txt"
python frontend/templates/plano_puestos/actualizar.py [respaldo.json]
```

Sin respaldo conserva los datos que ya trae `plano_puestos.html`. Con un respaldo (.json de
"Guardar respaldo", de esta versión o de la anterior), esos datos quedan dentro del archivo.

Datos al abrir: primero lo guardado en el navegador; si no hay, lo que dejó la versión anterior en ese
mismo navegador; si tampoco, los datos del archivo. Los datos de la versión anterior se convierten
solos: Piso 5 se pasa al plano nuevo por número de puesto (Vi → Viernes A y B) y los otros pisos
(LTO) quedan como pisos con su imagen de fondo.

Menú Administración: "Guardar respaldo" (.json con datos personales; no subir al repo),
"Cargar respaldo…" y "Volver a los datos del archivo".

A futuro: guardar en la base del panel Django (modelos Piso, Puesto, AsignacionPuesto) para que el
equipo comparta los mismos datos.

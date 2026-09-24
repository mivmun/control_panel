# Plano de Puestos

App HTML de un solo archivo para dibujar el plano 2D de una oficina, ubicar los puestos y asignar
personas por día (Lu–Vi). Se abre con doble clic en Edge/Chrome; no necesita servidor ni internet.
Es la fuente oficial de los puestos: el Excel de puestos ya no se usa.

- `plantilla.html`: la app sin datos (se puede versionar). Abierta sola, parte con un piso vacío.
- `plano_puestos.html`: la app con los datos (pisos, planos, puestos, personas y asignaciones).
  **Contiene nombres de personas → no se versiona** (ver `.gitignore`).
- `actualizar.py`: pasa los cambios de `plantilla.html` a `plano_puestos.html` sin perder los datos.

```
python herramientas/plano_puestos/actualizar.py [respaldo.json]
```

Sin argumentos conserva los datos que ya trae `plano_puestos.html`. Con un respaldo, esos datos
quedan guardados dentro del archivo (útil para fijar el estado actual o pasarlo a otro computador).

Personas: "Administrar personas…" (o clic en un nombre) abre la lista para agregar una o varias
(pegando una por línea), cambiar nombre, marcar si necesita puesto, poner una nota o quitarla.
Al renombrar o quitar a alguien se actualizan sus puestos.

Los cambios hechos en la app se guardan en el navegador (localStorage). Para compartirlos o
respaldarlos: "Guardar respaldo" (.json, también con datos personales; no subir al repo).

A futuro: pasa a ser un módulo del panel Django (modelos Piso, Puesto, AsignacionPuesto).

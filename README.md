# Panel de Control GTEC

Migración del Excel "Panel de Control GTEC" (Gerencia Técnica, J.E.J. Ingeniería) a una aplicación web
para el equipo.

## Stack previsto

- Django (MVT) en Azure App Service
- Azure SQL o PostgreSQL
- Login con Microsoft Entra ID
- Power BI para reportes

## Estructura

```
backend/            Python (Modelo + Vista)
  manage.py
  panel_ging/       configuración: settings.py, urls.py raíz, wsgi/asgi
  panel/            la app: models.py, views.py, urls.py, registry.py, export.py
  db/gtec.db        base local (no se versiona)
frontend/           lo que se ve (Template)
  templates/panel/  HTML de cada página (base.html, dashboard.html, …)
  static/panel/     CSS
  plano_puestos/    app HTML del plano de puestos (ver su README)
docs/               documentación
```

Para levantar el panel: `runserver.bat` (o `python backend/manage.py runserver`).

- `docs/01_modelo_datos.md`: modelo de datos v0.1 (mapa hoja → tabla, entidades, importadores,
  reglas de normalización y pendientes P1–P7).

## Próximos pasos

1. `models.py` por módulo: `core`, `personas`, `proyectos`, `financiero`, `carga`.
2. Script `migrar_xlsb.py` para la carga inicial desde el Excel.
3. Importadores de SAP B1, remuneraciones, dotación RRHH y Primavera P6.

## Importante

El Excel original y cualquier export (SAP, remuneraciones, P6) **no se versionan**: contienen datos
personales y credenciales. El `.gitignore` los excluye.

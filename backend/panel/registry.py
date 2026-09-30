from . import models


def _only_datos(model):
    fields = [f.name for f in model._meta.get_fields() if not f.primary_key]
    return fields == ['datos']


TABLES = {
    'proyectos': {
        'model': models.Proyectos,
        'title': 'Proyectos GTEC',
        'search': ['nombre_proyecto', 'cliente', 'jefe_proyecto', 'estado'],
        'order': 'id',
    },
    'proyectos_finalizados': {
        'model': models.ProyectosFinalizados,
        'title': 'Proyectos Finalizados',
        'search': ['nombre_proyecto', 'cliente', 'jefe_proyecto'],
        'order': 'id',
    },
    'contratos': {
        'model': models.Contratos,
        'title': 'Contratos',
        'search': ['nombre', 'mandante', 'gerencia', 'admin_jej', 'estado'],
        'order': 'id',
    },
    'resumen_contratos': {
        'model': models.ResumenContratos,
        'title': 'Resumen Contratos',
        'search': ['datos'],
        'order': 'id',
    },
    'personal': {
        'model': models.Personal,
        'title': 'Personal GING',
        'search': ['usuario', 'nombre', 'apellido_paterno', 'apellido_materno', 'disciplina', 'rol', 'cargo_ctto'],
        'order': 'id',
    },
    'personal_contratos': {
        'model': models.PersonalContratos,
        'title': 'Contratos Personal',
        'search': ['usuario', 'profesional', 'cargo_ctto'],
        'order': 'id',
    },
    'cargos': {
        'model': models.Cargos,
        'title': 'Cargos',
        'search': ['cargo', 'rol', 'disciplina'],
        'order': 'id',
    },
    'roster_2026': {
        'model': models.Roster2026,
        'title': 'Roster 2026',
        'search': ['usuario', 'profesional', 'disciplina'],
        'order': 'id',
    },
    'horas_trabajadas': {
        'model': models.HorasTrabajadas,
        'title': 'Horas Trabajadas',
        'search': ['usuario', 'nombre_usuario', 'disciplina', 'nombre_actividad'],
        'order': 'id',
    },
    'resumen_hh': {
        'model': models.ResumenHh,
        'title': 'Resumen HH',
        'search': ['datos'],
        'order': 'id',
    },
    'contabilidad': {
        'model': models.Contabilidad,
        'title': 'Contabilidad GAF',
        'search': ['nombre_cuenta', 'glosa', 'gerencia_sap', 'area', 'cliente'],
        'order': 'id',
    },
    'resumen_gaf': {
        'model': models.ResumenGaf,
        'title': 'Resumen GAF',
        'search': ['datos'],
        'order': 'id',
    },
    'remuneraciones': {
        'model': models.Remuneraciones,
        'title': 'Remuneraciones',
        'search': ['nombre', 'rut', 'mes'],
        'order': 'id',
    },
    'remuneraciones_2025': {
        'model': models.Remuneraciones2025,
        'title': 'Remuneraciones 2025',
        'search': ['datos'],
        'order': 'id',
    },
    'analisis_remuneraciones_2026': {
        'model': models.AnalisisRemuneraciones2026,
        'title': 'Análisis Remuneraciones 2026',
        'search': ['datos'],
        'order': 'id',
    },
    'metas_2024': {
        'model': models.Metas2024,
        'title': 'Metas 2024',
        'search': ['datos'],
        'order': 'id',
    },
    'presupuesto_2024': {
        'model': models.Presupuesto2024,
        'title': 'Presupuesto 2024',
        'search': ['datos'],
        'order': 'id',
    },
    'puestos_oficina': {
        'model': models.PuestosOficina,
        'title': 'Puestos Oficina',
        'search': ['piso', 'lu', 'ma', 'mi', 'ju', 'vi'],
        'order': 'piso',
    },
    'apuntes': {
        'model': models.Apuntes,
        'title': 'Apuntes / Portales',
        'search': ['portal', 'observacion'],
        'order': 'id',
    },
    'licencias_software': {
        'model': models.LicenciasSoftware,
        'title': 'Licencias Software',
        'search': ['datos'],
        'order': 'id',
    },
    'inventario_oficina': {
        'model': models.InventarioOficina,
        'title': 'Inventario Oficina',
        'search': ['datos'],
        'order': 'id',
    },
    'epp': {
        'model': models.Epp,
        'title': 'EPP',
        'search': ['datos'],
        'order': 'id',
    },
    'organigrama': {
        'model': models.Organigrama,
        'title': 'Organigrama',
        'search': ['datos'],
        'order': 'id',
    },
    'vacaciones': {
        'model': models.Vacaciones,
        'title': 'Vacaciones',
        'search': ['datos'],
        'order': 'id',
    },
    'reclutamiento': {
        'model': models.Reclutamiento,
        'title': 'Reclutamiento',
        'search': ['datos'],
        'order': 'id',
    },
}

MENU = [
    ('Proyectos', [
        ('proyectos', 'Proyectos GTEC'),
        ('proyectos_finalizados', 'Finalizados'),
        ('contratos', 'Contratos'),
        ('resumen_contratos', 'Resumen Contratos'),
    ]),
    ('Personal', [
        ('personal', 'Personal GING'),
        ('personal_contratos', 'Contratos Personal'),
        ('cargos', 'Cargos'),
        ('roster_2026', 'Roster 2026'),
    ]),
    ('Operaciones', [
        ('horas_trabajadas', 'Horas Trabajadas'),
        ('resumen_hh', 'Resumen HH'),
        ('contabilidad', 'Contabilidad GAF'),
        ('resumen_gaf', 'Resumen GAF'),
        ('remuneraciones', 'Remuneraciones'),
        ('remuneraciones_2025', 'Rem. 2025'),
        ('analisis_remuneraciones_2026', 'Análisis Rem. 2026'),
    ]),
    ('Planificación', [
        ('metas_2024', 'Metas 2024'),
        ('presupuesto_2024', 'Presupuesto 2024'),
    ]),
    ('Recursos', [
        ('puestos_oficina', 'Puestos Oficina'),
        ('apuntes', 'Apuntes / Portales'),
        ('licencias_software', 'Licencias Software'),
        ('inventario_oficina', 'Inventario Oficina'),
        ('epp', 'EPP'),
        ('organigrama', 'Organigrama'),
    ]),
    ('Complemento', [
        ('vacaciones', 'Vacaciones'),
        ('reclutamiento', 'Reclutamiento'),
    ]),
]


def get_config(table):
    return TABLES.get(table)


def editable_fields(model):
    return [
        f for f in model._meta.get_fields()
        if not (f.is_relation or f.auto_created or f.primary_key)
    ]


def column_names(model):
    return [f.name for f in editable_fields(model)]

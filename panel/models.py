
from django.db import models


class AnalisisRemuneraciones2026(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'analisis_remuneraciones_2026'


# La tabla también tiene `usuario` y `clave`: no se mapean a propósito, para que el panel
# nunca muestre ni exporte credenciales (ver docs/01_modelo_datos.md, P5).
class Apuntes(models.Model):
    portal = models.TextField(blank=True, null=True)
    link_ruta = models.TextField(blank=True, null=True)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'apuntes'



class Cargos(models.Model):
    numero = models.IntegerField(blank=True, null=True)
    cargo = models.TextField(blank=True, null=True)
    rol = models.TextField(blank=True, null=True)
    disciplina = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'cargos'


class Contabilidad(models.Model):
    n_asiento = models.IntegerField(blank=True, null=True)
    fecha_asiento = models.TextField(blank=True, null=True)
    codigo_cuenta = models.IntegerField(blank=True, null=True)
    nombre_cuenta = models.TextField(blank=True, null=True)
    debito = models.FloatField(blank=True, null=True)
    credito = models.FloatField(blank=True, null=True)
    saldo = models.FloatField(blank=True, null=True)
    cuenta_contrapartida = models.TextField(blank=True, null=True)
    nombre_proveedor = models.TextField(blank=True, null=True)
    rut = models.TextField(blank=True, null=True)
    cc_sap = models.TextField(blank=True, null=True)
    servicio = models.TextField(blank=True, null=True)
    cliente = models.TextField(blank=True, null=True)
    gerencia_sap = models.TextField(blank=True, null=True)
    glosa = models.TextField(blank=True, null=True)
    comentario = models.TextField(blank=True, null=True)
    prefijo_folio = models.TextField(blank=True, null=True)
    numero_folio = models.IntegerField(blank=True, null=True)
    oc_referencia = models.TextField(blank=True, null=True)
    area = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'contabilidad'


class Contratos(models.Model):
    gte = models.TextField(blank=True, null=True)
    numero = models.IntegerField(blank=True, null=True)
    gerencia = models.TextField(blank=True, null=True)
    cc = models.IntegerField(blank=True, null=True)
    mandante_estandar = models.TextField(blank=True, null=True)
    mandante = models.TextField(blank=True, null=True)
    n_contrato = models.TextField(blank=True, null=True)
    nombre = models.TextField(blank=True, null=True)
    ubicacion = models.TextField(blank=True, null=True)
    admin_jej = models.TextField(blank=True, null=True)
    admin_mandante = models.TextField(blank=True, null=True)
    email = models.TextField(blank=True, null=True)
    gerente = models.TextField(blank=True, null=True)
    email_gerente = models.TextField(blank=True, null=True)
    fecha_inicio = models.TextField(blank=True, null=True)
    fecha_termino_inicial = models.TextField(blank=True, null=True)
    fecha_termino_actual = models.TextField(blank=True, null=True)
    fecha_termino_final = models.TextField(blank=True, null=True)
    avance_dias = models.FloatField(blank=True, null=True)
    estado = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'contratos'


class Epp(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'epp'


class HorasTrabajadas(models.Model):
    mes = models.IntegerField(blank=True, null=True)
    anio = models.IntegerField(blank=True, null=True)
    disciplina = models.TextField(blank=True, null=True)
    cco_actividad = models.IntegerField(blank=True, null=True)
    nombre_cco = models.TextField(blank=True, null=True)
    usuario = models.TextField(blank=True, null=True)
    nombre_usuario = models.TextField(blank=True, null=True)
    cco_usuario = models.IntegerField(blank=True, null=True)
    cargo_contrato = models.TextField(blank=True, null=True)
    ods = models.TextField(blank=True, null=True)
    horas = models.FloatField(blank=True, null=True)
    cargo_asignado = models.TextField(blank=True, null=True)
    semana = models.IntegerField(blank=True, null=True)
    fecha = models.TextField(blank=True, null=True)
    tipo_ingreso = models.TextField(blank=True, null=True)
    item = models.TextField(blank=True, null=True)
    nombre_actividad = models.TextField(blank=True, null=True)
    estado_act = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'horas_trabajadas'


class InventarioOficina(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'inventario_oficina'


class LicenciasSoftware(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'licencias_software'


class Metas2024(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'metas_2024'


class Organigrama(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'organigrama'


class Personal(models.Model):
    numero = models.IntegerField(blank=True, null=True)
    usuario = models.TextField(blank=True, null=True)
    profesional = models.TextField(blank=True, null=True)
    rut_jej = models.TextField(blank=True, null=True)
    rut = models.TextField(blank=True, null=True)
    rut_sp = models.TextField(blank=True, null=True)
    fecha_ingreso = models.TextField(blank=True, null=True)
    cc = models.IntegerField(blank=True, null=True)
    turno = models.TextField(blank=True, null=True)
    modalidad = models.TextField(blank=True, null=True)
    carta_aviso = models.TextField(blank=True, null=True)
    cargo_ctto = models.TextField(blank=True, null=True)
    disciplina = models.TextField(blank=True, null=True)
    rol = models.TextField(blank=True, null=True)
    correo_jej = models.TextField(blank=True, null=True)
    valor_hh = models.FloatField(blank=True, null=True)
    gasto_general = models.FloatField(blank=True, null=True)
    utilizacion_externa = models.FloatField(blank=True, null=True)
    usuario2 = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'personal'


class PersonalContratos(models.Model):
    numero = models.IntegerField(blank=True, null=True)
    usuario = models.TextField(blank=True, null=True)
    profesional = models.TextField(blank=True, null=True)
    rut_jej = models.TextField(blank=True, null=True)
    rut = models.TextField(blank=True, null=True)
    rut_sp = models.TextField(blank=True, null=True)
    fecha_ingreso = models.TextField(blank=True, null=True)
    cc = models.IntegerField(blank=True, null=True)
    ods = models.IntegerField(blank=True, null=True)
    turno = models.TextField(blank=True, null=True)
    modalidad = models.TextField(blank=True, null=True)
    cargo_ctto = models.TextField(blank=True, null=True)
    correo_jej = models.TextField(blank=True, null=True)
    total_haberes = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'personal_contratos'


class Presupuesto2024(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'presupuesto_2024'


class Proyectos(models.Model):
    cc = models.IntegerField(blank=True, null=True)
    ods = models.IntegerField(blank=True, null=True)
    log = models.TextField(blank=True, null=True)
    cliente = models.TextField(blank=True, null=True)
    nombre_proyecto = models.TextField(blank=True, null=True)
    jefe_proyecto = models.TextField(blank=True, null=True)
    avance_plazo = models.FloatField(blank=True, null=True)
    avance_financiero = models.FloatField(blank=True, null=True)
    jefe_proyecto_cliente = models.TextField(blank=True, null=True)
    dotacion = models.IntegerField(blank=True, null=True)
    noc_interna = models.TextField(blank=True, null=True)
    fecha_noc_interna = models.TextField(blank=True, null=True)
    fecha_inicio = models.TextField(blank=True, null=True)
    fecha_termino = models.TextField(blank=True, null=True)
    monto_inicial = models.FloatField(blank=True, null=True)
    tipo_moneda = models.TextField(blank=True, null=True)
    modificaciones = models.FloatField(blank=True, null=True)
    monto_actual = models.FloatField(blank=True, null=True)
    avance_dias = models.FloatField(blank=True, null=True)
    estado = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'proyectos'


class ProyectosFinalizados(models.Model):
    cc = models.IntegerField(blank=True, null=True)
    ods = models.IntegerField(blank=True, null=True)
    reporte_final = models.TextField(blank=True, null=True)
    cliente = models.TextField(blank=True, null=True)
    nombre_proyecto = models.TextField(blank=True, null=True)
    jefe_proyecto = models.TextField(blank=True, null=True)
    avance_financiero = models.FloatField(blank=True, null=True)
    fecha_inicio = models.TextField(blank=True, null=True)
    fecha_termino = models.TextField(blank=True, null=True)
    monto_inicial = models.FloatField(blank=True, null=True)
    tipo_moneda = models.TextField(blank=True, null=True)
    modificaciones = models.FloatField(blank=True, null=True)
    monto_final = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'proyectos_finalizados'


class PuestosOficina(models.Model):
    piso = models.TextField(blank=True, null=True)
    puesto = models.IntegerField(blank=True, null=True)
    lu = models.TextField(blank=True, null=True)
    ma = models.TextField(blank=True, null=True)
    mi = models.TextField(blank=True, null=True)
    ju = models.TextField(blank=True, null=True)
    vi = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'puestos_oficina'


class Reclutamiento(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'reclutamiento'


class Remuneraciones(models.Model):
    rut = models.TextField(blank=True, null=True)
    mes = models.TextField(blank=True, null=True)
    cc = models.IntegerField(blank=True, null=True)
    nombre = models.TextField(blank=True, null=True)
    rut2 = models.TextField(blank=True, null=True)
    centro_costo = models.TextField(blank=True, null=True)
    fecha_ingreso = models.TextField(blank=True, null=True)
    fecha_termino = models.TextField(blank=True, null=True)
    dt = models.TextField(blank=True, null=True)
    sueldo_base = models.FloatField(blank=True, null=True)
    gratificacion = models.FloatField(blank=True, null=True)
    diferencia_grat = models.FloatField(blank=True, null=True)
    diferencia_grat_t = models.FloatField(blank=True, null=True)
    diferencia_grat_enap = models.FloatField(blank=True, null=True)
    bono_zona = models.FloatField(blank=True, null=True)
    pago_festivo = models.FloatField(blank=True, null=True)
    pago_festivo_t = models.FloatField(blank=True, null=True)
    bono_permanencia = models.FloatField(blank=True, null=True)
    horas_extras_50 = models.FloatField(blank=True, null=True)
    horas_extras_100 = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'remuneraciones'


class Remuneraciones2025(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'remuneraciones_2025'


class ResumenContratos(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'resumen_contratos'


class ResumenGaf(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'resumen_gaf'


class ResumenHh(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'resumen_hh'


class Roster2026(models.Model):
    numero = models.IntegerField(blank=True, null=True)
    usuario = models.TextField(blank=True, null=True)
    profesional = models.TextField(blank=True, null=True)
    rut = models.TextField(blank=True, null=True)
    fecha_ingreso = models.TextField(blank=True, null=True)
    disciplina = models.TextField(blank=True, null=True)
    cc = models.IntegerField(blank=True, null=True)
    turno = models.TextField(blank=True, null=True)
    modalidad = models.TextField(blank=True, null=True)
    schedule = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'roster_2026'


class Vacaciones(models.Model):
    datos = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'vacaciones'

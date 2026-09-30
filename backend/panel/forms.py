import datetime
from fractions import Fraction

from django import forms

from . import models, rut

TURNOS = ['5x2', '4x3']
MODALIDADES = ['5/0', '4/1', '3/2', '2/3', '1/4', '0/5']


def modalidad_fraccion(v):
    # "2/3" llegó del Excel convertido en número (0.666…): se vuelve a escribir como fracción.
    try:
        f = float(v)
    except (TypeError, ValueError):
        return v or ''
    fr = Fraction(f).limit_denominator(5)
    return f'{fr.numerator}/{fr.denominator}'


def _pct(v):
    # En la base se guarda como fracción (0.8); en pantalla se trabaja en % (80).
    return None if v is None else round(v * 100, 2)


class PersonalForm(forms.Form):
    # Identificación
    nombre = forms.CharField(label='Nombres', max_length=80)
    apellido_paterno = forms.CharField(label='Apellido paterno', max_length=60)
    apellido_materno = forms.CharField(label='Apellido materno', max_length=60, required=False)
    rut = forms.CharField(label='RUT', max_length=13,
                          widget=forms.TextInput(attrs={'placeholder': '20.250.469-8', 'autocomplete': 'off'}))
    usuario = forms.CharField(label='Usuario', max_length=60, required=False,
                              widget=forms.TextInput(attrs={'placeholder': 'nombre.apellido'}))
    correo_jej = forms.EmailField(label='Correo JEJ', required=False)

    # Contrato
    fecha_ingreso = forms.DateField(label='Fecha de ingreso', required=False,
                                    widget=forms.DateInput(attrs={'type': 'date'}, format='%Y-%m-%d'))
    cc = forms.IntegerField(label='Centro de costo', required=False,
                            widget=forms.NumberInput(attrs={'list': 'dl-cc'}))
    cargo_ctto = forms.CharField(label='Cargo contrato', required=False,
                                 widget=forms.TextInput(attrs={'list': 'dl-cargo', 'autocomplete': 'off'}))
    disciplina = forms.CharField(label='Disciplina', required=False,
                                 widget=forms.TextInput(attrs={'list': 'dl-disciplina', 'autocomplete': 'off'}))
    rol = forms.CharField(label='Rol', required=False,
                          widget=forms.TextInput(attrs={'list': 'dl-rol', 'autocomplete': 'off'}))
    turno = forms.CharField(label='Turno', required=False,
                            widget=forms.TextInput(attrs={'list': 'dl-turno', 'autocomplete': 'off'}))
    modalidad = forms.ChoiceField(label='Modalidad (oficina/teletrabajo)', required=False,
                                  choices=[('', '—')] + [(m, m) for m in MODALIDADES])
    carta_aviso = forms.CharField(label='Carta aviso', required=False)

    # Costos
    valor_hh = forms.FloatField(label='Valor HH ($)', required=False, min_value=0)
    gasto_general = forms.FloatField(label='Gasto general (%)', required=False, min_value=0, max_value=100)
    utilizacion_externa = forms.FloatField(label='Utilización externa (%)', required=False, min_value=0, max_value=100)

    SECCIONES = [
        ('Identificación', ['nombre', 'apellido_paterno', 'apellido_materno', 'rut', 'usuario', 'correo_jej']),
        ('Contrato', ['fecha_ingreso', 'cc', 'cargo_ctto', 'disciplina', 'rol', 'turno', 'modalidad', 'carta_aviso']),
        ('Costos', ['valor_hh', 'gasto_general', 'utilizacion_externa']),
    ]

    def __init__(self, *args, instance=None, **kwargs):
        self.instance = instance
        if instance is not None and 'initial' not in kwargs:
            kwargs['initial'] = self._initial(instance)
        super().__init__(*args, **kwargs)

    @staticmethod
    def _initial(p):
        try:
            fecha = datetime.date.fromisoformat((p.fecha_ingreso or '')[:10])
        except ValueError:
            fecha = None
        return {
            'nombre': p.nombre, 'apellido_paterno': p.apellido_paterno, 'apellido_materno': p.apellido_materno,
            'rut': p.rut, 'usuario': p.usuario, 'correo_jej': p.correo_jej,
            'fecha_ingreso': fecha, 'cc': p.cc, 'cargo_ctto': p.cargo_ctto, 'disciplina': p.disciplina,
            'rol': p.rol, 'turno': p.turno, 'modalidad': modalidad_fraccion(p.modalidad),
            'carta_aviso': p.carta_aviso, 'valor_hh': p.valor_hh,
            'gasto_general': _pct(p.gasto_general), 'utilizacion_externa': _pct(p.utilizacion_externa),
        }

    def _otros(self):
        qs = models.Personal.objects.all()
        return qs.exclude(pk=self.instance.pk) if self.instance is not None else qs

    def clean_rut(self):
        valor = self.cleaned_data['rut']
        if rut.partes(valor) is None:
            raise forms.ValidationError('Formato no reconocido. Ejemplo: 20.250.469-8')
        if not rut.es_valido(valor):
            raise forms.ValidationError('El dígito verificador no corresponde a este RUT.')
        con_puntos, _, _ = rut.formatos(valor)
        if self._otros().filter(rut__iexact=con_puntos).exists():
            raise forms.ValidationError('Ya hay una persona registrada con este RUT.')
        return con_puntos

    def clean_usuario(self):
        valor = self.cleaned_data['usuario'].strip().lower()
        if valor and self._otros().filter(usuario__iexact=valor).exists():
            raise forms.ValidationError('Este usuario ya está asignado a otra persona.')
        return valor

    def clean_turno(self):
        return self.cleaned_data['turno'].strip().lower()

    def save(self):
        d = self.cleaned_data
        p = self.instance or models.Personal()
        for campo in ('nombre', 'apellido_paterno', 'apellido_materno', 'rut', 'correo_jej', 'cc', 'cargo_ctto', 'disciplina', 'rol',
                      'turno', 'modalidad', 'carta_aviso', 'valor_hh'):
            setattr(p, campo, d[campo] if d[campo] not in ('', None) else None)
        p.usuario = d['usuario'] or None
        p.usuario2 = p.usuario  # En la hoja, Usuario 2 siempre repite Usuario.
        p.fecha_ingreso = d['fecha_ingreso'].isoformat() if d['fecha_ingreso'] else None
        for campo in ('gasto_general', 'utilizacion_externa'):
            setattr(p, campo, None if d[campo] is None else d[campo] / 100)
        p.save()  # Personal.save() completa rut_jej y rut_sp.
        # NUMERO es el mismo ID: si viene vacío (registro nuevo), se completa solo.
        if p.numero is None:
            p.numero = p.id
            p.save(update_fields=['numero'])
        return p

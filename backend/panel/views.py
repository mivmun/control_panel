import json

from django.conf import settings
from django import forms
from django.contrib import messages
from django.core.paginator import Paginator
from django.http import HttpResponse, JsonResponse
from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.clickjacking import xframe_options_sameorigin

from . import importar_personal, models
from .forms import TURNOS, PersonalForm, modalidad_fraccion
from .registry import MENU, TABLES, editable_fields

PAGE_SIZE = 50


def _label(name):
    words = [w.capitalize() for w in name.replace('_', ' ').replace('-', ' ').split()]
    return ' '.join(words)


def _context(request, extra=None):
    ctx = {'menu': MENU, 'tables': TABLES}
    if extra:
        ctx.update(extra)
    return ctx


def _build_form_class(cfg):
    fields = {}
    for f in editable_fields(cfg['model']):
        label = _label(f.name)
        internal = f.get_internal_type()
        if internal in ('FloatField', 'DecimalField'):
            fields[f.name] = forms.FloatField(label=label, required=False)
        elif internal == 'IntegerField':
            fields[f.name] = forms.IntegerField(label=label, required=False)
        elif f.name == 'datos':
            fields[f.name] = forms.CharField(label=label, required=False, widget=forms.Textarea(attrs={'rows': 6}))
        else:
            fields[f.name] = forms.CharField(label=label, required=False)
    return type('DynamicForm', (forms.Form,), fields)


def _initial_from_instance(cfg, instance):
    initial = {}
    for f in editable_fields(cfg['model']):
        v = getattr(instance, f.name)
        initial[f.name] = v if v is not None else ''
    return initial


def _save_form(cfg, form, instance=None):
    data = form.cleaned_data
    kwargs = {}
    for f in editable_fields(cfg['model']):
        v = data.get(f.name)
        if v == '':
            v = None
        kwargs[f.name] = v
    if instance is None:
        obj = cfg['model'](**kwargs)
    else:
        obj = instance
        for k, v in kwargs.items():
            setattr(obj, k, v)
    obj.save()
    return obj


def dashboard(request):
    horas_totales = models.HorasTrabajadas.objects.aggregate(t=Sum('horas'))['t'] or 0
    monto_proyectos = models.Proyectos.objects.filter(monto_actual__gt=0).aggregate(t=Sum('monto_actual'))['t'] or 0

    horas_por_disciplina = list(
        models.HorasTrabajadas.objects
        .exclude(disciplina__isnull=True).exclude(disciplina='')
        .values('disciplina').annotate(total=Sum('horas')).order_by('-total')[:10]
    )
    personal_por_disciplina = list(
        models.Personal.objects
        .exclude(disciplina__isnull=True).exclude(disciplina='')
        .values('disciplina').annotate(total=Count('id')).order_by('-total')
    )
    ultimas_horas = list(
        models.HorasTrabajadas.objects
        .values('usuario', 'nombre_usuario', 'disciplina')
        .annotate(total=Sum('horas')).order_by('-total')[:10]
    )

    stats = {
        'proyectos_activos': models.Proyectos.objects.count(),
        'proyectos_finalizados': models.ProyectosFinalizados.objects.count(),
        'contratos_activos': models.Contratos.objects.filter(estado__icontains='Activo').count(),
        'personal_activo': models.Personal.objects.count(),
        'horas_totales': round(horas_totales, 1),
        'contabilidad_registros': models.Contabilidad.objects.count(),
        'remuneraciones_registros': models.Remuneraciones.objects.count(),
        'monto_proyectos': round(monto_proyectos, 2),
    }

    max_horas = max([r['total'] for r in horas_por_disciplina] or [1]) or 1
    max_personal = max([r['total'] for r in personal_por_disciplina] or [1]) or 1
    max_ultimas = max([r['total'] for r in ultimas_horas] or [1]) or 1

    ctx = _context(request, {
        'active': 'dashboard',
        'stats': stats,
        'horas_por_disciplina': horas_por_disciplina,
        'personal_por_disciplina': personal_por_disciplina,
        'ultimas_horas': ultimas_horas,
        'max_horas': max_horas,
        'max_personal': max_personal,
        'max_ultimas': max_ultimas,
    })
    return render(request, 'panel/dashboard.html', ctx)


def list_view(request, table):
    cfg = TABLES.get(table)
    if not cfg:
        return render(request, 'panel/not_found.html', _context(request, {'active': ''}), status=404)

    model = cfg['model']
    page = request.GET.get('page', '1')
    search = request.GET.get('search', '')
    sort = request.GET.get('sort', cfg['order'])
    order = request.GET.get('order', 'asc')

    qs = model.objects.all()
    if search:
        q = Q()
        for col in cfg['search']:
            q |= Q(**{f'{col}__icontains': search})
        qs = qs.filter(q)
    if order == 'desc':
        qs = qs.order_by(f'-{sort}')
    else:
        qs = qs.order_by(sort)

    paginator = Paginator(qs, PAGE_SIZE)
    page_obj = paginator.get_page(page)

    cols = [f.name for f in editable_fields(model)]
    labels = {f.name: _label(f.name) for f in editable_fields(model)}
    rows = []
    for obj in page_obj:
        row = {c: getattr(obj, c) for c in cols}
        row['id'] = obj.id
        rows.append(row)

    ctx = _context(request, {
        'active': table,
        'table': table,
        'cfg': cfg,
        'cols': cols,
        'labels': labels,
        'rows': rows,
        'page_obj': page_obj,
        'search': search,
        'sort': sort,
        'order': order,
        'export_url': reverse('export', args=[table, 'xlsx']),
    })
    return render(request, 'panel/list.html', ctx)


def add_view(request, table):
    cfg = TABLES.get(table)
    if not cfg:
        return render(request, 'panel/not_found.html', _context(request, {'active': ''}), status=404)
    if table == 'personal':
        return personal_form(request)

    FormClass = _build_form_class(cfg)
    if request.method == 'POST':
        form = FormClass(request.POST)
        if form.is_valid():
            _save_form(cfg, form)
            return redirect('list', table=table)
    else:
        form = FormClass()

    ctx = _context(request, {
        'active': table,
        'table': table,
        'cfg': cfg,
        'form': form,
        'form_title': f'Nuevo registro - {cfg["title"]}',
        'fields': [f.name for f in editable_fields(cfg['model'])],
    })
    return render(request, 'panel/form.html', ctx)


def edit_view(request, table, pk):
    cfg = TABLES.get(table)
    if not cfg:
        return render(request, 'panel/not_found.html', _context(request, {'active': ''}), status=404)
    if table == 'personal':
        return personal_form(request, pk)

    obj = get_object_or_404(cfg['model'], pk=pk)
    FormClass = _build_form_class(cfg)
    if request.method == 'POST':
        form = FormClass(request.POST)
        if form.is_valid():
            _save_form(cfg, form, instance=obj)
            return redirect('list', table=table)
    else:
        form = FormClass(initial=_initial_from_instance(cfg, obj))

    ctx = _context(request, {
        'active': table,
        'table': table,
        'cfg': cfg,
        'form': form,
        'form_title': f'Editar registro #{pk} - {cfg["title"]}',
        'fields': [f.name for f in editable_fields(cfg['model'])],
        'pk': pk,
    })
    return render(request, 'panel/form.html', ctx)


def _distintos(qs, campo):
    return sorted({v for v in qs.values_list(campo, flat=True) if v not in (None, '')})


def personal_form(request, pk=None):
    persona = get_object_or_404(models.Personal, pk=pk) if pk else None
    if request.method == 'POST':
        form = PersonalForm(request.POST, instance=persona)
        if form.is_valid():
            p = form.save()
            messages.success(request, f'{p.nombre_completo} quedó guardado.')
            return redirect('list', table='personal')
    else:
        form = PersonalForm(instance=persona)

    # Cargo -> rol y disciplina según la hoja Cargos GING, para completarlos al elegir el cargo.
    cargos = {c.cargo: {'rol': c.rol or '', 'disciplina': c.disciplina or ''}
              for c in models.Cargos.objects.exclude(cargo__isnull=True).order_by('cargo')}
    personal = models.Personal.objects.all()
    ctx = _context(request, {
        'active': 'personal',
        'table': 'personal',
        'form': form,
        'persona': persona,
        'secciones': [(t, [form[c] for c in campos]) for t, campos in PersonalForm.SECCIONES],
        'cargos': cargos,
        'listas': {
            'cc': _distintos(personal, 'cc'),
            'cargo': list(cargos),
            'disciplina': sorted(set(_distintos(personal, 'disciplina')) | {c['disciplina'] for c in cargos.values() if c['disciplina']}),
            'rol': sorted(set(_distintos(personal, 'rol')) | {c['rol'] for c in cargos.values() if c['rol']}),
            'turno': TURNOS,
        },
    })
    return render(request, 'panel/personal_form.html', ctx)


def personal_importar(request):
    """Importar Excel en Personal GING: subir → ver qué cambia → confirmar (ver importar_personal.py)."""
    ctx = _context(request, {'active': 'personal', 'table': 'personal',
                             'columnas': [c.replace('_', ' ') for c in importar_personal.COLUMNAS]})
    if request.method == 'POST' and request.POST.get('accion') == 'aplicar':
        plan = request.session.pop('personal_import', None)
        if not plan:
            messages.error(request, 'La vista previa ya no está disponible. Sube el archivo de nuevo.')
            return redirect('personal_importar')
        agregados, completados = importar_personal.aplicar(plan)
        messages.success(request, f'Importación lista: {agregados} persona(s) agregada(s) y {completados} con datos completados.')
        return redirect('list', table='personal')
    if request.method == 'POST' and request.POST.get('accion') == 'cancelar':
        request.session.pop('personal_import', None)
        return redirect('list', table='personal')
    if request.method == 'POST':
        archivo = request.FILES.get('archivo')
        if not archivo:
            ctx['error'] = 'Elige el archivo Excel.'
        elif not archivo.name.lower().endswith('.xlsx'):
            ctx['error'] = 'El archivo debe ser un Excel .xlsx.'
        else:
            try:
                plan = importar_personal.planificar(importar_personal.leer(archivo))
            except importar_personal.ArchivoRechazado as e:
                ctx['error'] = f'Archivo rechazado: {e}'
            else:
                plan['archivo'] = archivo.name
                request.session['personal_import'] = plan
                ctx['plan'] = plan
    return render(request, 'panel/personal_import.html', ctx)


def delete_view(request, table, pk):
    cfg = TABLES.get(table)
    if not cfg:
        return render(request, 'panel/not_found.html', _context(request, {'active': ''}), status=404)

    obj = get_object_or_404(cfg['model'], pk=pk)
    if request.method == 'POST':
        obj.delete()
        return redirect('list', table=table)

    ctx = _context(request, {
        'active': table,
        'table': table,
        'cfg': cfg,
        'obj': obj,
    })
    return render(request, 'panel/confirm_delete.html', ctx)


PLANO_DIR = settings.FRONTEND_DIR / 'templates' / 'plano_puestos'


def plano_puestos(request):
    return render(request, 'panel/plano_puestos.html', _context(request, {'active': 'puestos_oficina'}))


@xframe_options_sameorigin
def plano_puestos_app(request):
    # plano_puestos.html trae los datos (no se versiona); si no está, la plantilla vacía.
    path = PLANO_DIR / 'plano_puestos.html'
    if not path.exists():
        path = PLANO_DIR / 'plantilla.html'
    return HttpResponse(path.read_text(encoding='utf-8'))


def plano_puestos_personal(request):
    # Perfil de Personal GING para el plano de puestos (sin RUT, correos ni montos).
    # Se omiten filas sin nombre y apellido o con usuario de una letra (quedaron filas basura de una importación).
    data = [{
        'usuario': p.usuario,
        'nombre': p.nombre_completo,
        'cargo': p.cargo_ctto or '',
        'disciplina': p.disciplina or '',
        'rol': p.rol or '',
        'cc': p.cc,
        'modalidad': modalidad_fraccion(p.modalidad),
    } for p in models.Personal.objects.exclude(usuario__isnull=True).order_by('nombre', 'apellido_paterno')
        if len(p.usuario.strip()) > 1 and p.nombre and p.apellido_paterno]
    return JsonResponse({'personal': data})


def import_view(request):
    ctx = _context(request, {'active': 'import', 'tables_list': sorted(TABLES.keys())})
    return render(request, 'panel/import.html', ctx)


def import_preview(request):
    if request.method != 'POST':
        return redirect('import')

    cfg = TABLES.get(request.POST.get('table', ''))
    if not cfg:
        return redirect('import')

    upload = request.FILES.get('file')
    if not upload:
        return redirect('import')

    import openpyxl
    try:
        wb = openpyxl.load_workbook(upload, read_only=True, data_only=True)
    except Exception as exc:
        ctx = _context(request, {'active': 'import', 'error': f'No se pudo leer el archivo: {exc}', 'tables_list': sorted(TABLES.keys())})
        return render(request, 'panel/import.html', ctx)

    sheets = []
    for ws in wb.worksheets:
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            continue
        headers = [str(h).strip() if h is not None else f'Col {i + 1}' for i, h in enumerate(rows[0])]
        data_rows = [r for r in rows[1:] if any(c is not None and str(c).strip() != '' for c in r)]
        sheets.append({
            'name': ws.title,
            'headers': headers,
            'row_count': len(data_rows),
            'rows': [[None if c is None else (str(c) if not isinstance(c, (int, float)) else c) for c in r] for r in data_rows[:200]],
        })

    if not sheets:
        ctx = _context(request, {'active': 'import', 'error': 'El archivo no tiene hojas con datos.', 'tables_list': sorted(TABLES.keys())})
        return render(request, 'panel/import.html', ctx)

    request.session['import_data'] = {
        'table': request.POST.get('table'),
        'sheets': sheets,
    }

    columns = [f.name for f in editable_fields(cfg['model'])]
    ctx = _context(request, {
        'active': 'import',
        'table': request.POST.get('table'),
        'cfg': cfg,
        'sheets': sheets,
        'columns': columns,
    })
    return render(request, 'panel/import_preview.html', ctx)


def import_execute(request):
    if request.method != 'POST':
        return redirect('import')

    data = request.session.get('import_data')
    if not data:
        return redirect('import')

    cfg = TABLES.get(data.get('table'))
    if not cfg:
        return redirect('import')

    sheet_name = request.POST.get('sheet')
    header_map = {k: v for k, v in request.POST.items() if k.startswith('map_')}
    header_map = {k[4:]: v for k, v in header_map.items()}

    sheet = next((s for s in data['sheets'] if s['name'] == sheet_name), data['sheets'][0])
    columns = [f.name for f in editable_fields(cfg['model'])]

    inserted = 0
    for row in sheet['rows']:
        kwargs = {}
        valid = False
        for i, header in enumerate(sheet['headers']):
            target = header_map.get(header)
            if not target or target == '__skip__':
                continue
            value = row[i] if i < len(row) else None
            if value is None or value == '':
                kwargs[target] = None
            else:
                kwargs[target] = value
                valid = True
        if not valid:
            continue
        cfg['model'](**kwargs).save()
        inserted += 1

    request.session.pop('import_data', None)
    ctx = _context(request, {
        'active': 'import',
        'result': {'inserted': inserted, 'table': data['table']},
    })
    return render(request, 'panel/import_done.html', ctx)

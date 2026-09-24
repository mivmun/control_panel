import csv

from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET

from .registry import TABLES, editable_fields

VALID_EXPORTS = [
    'proyectos', 'proyectos_finalizados', 'contratos', 'personal', 'personal_contratos',
    'cargos', 'horas_trabajadas', 'contabilidad', 'remuneraciones', 'puestos_oficina', 'apuntes',
]


@require_GET
def export_view(request, table, fmt):
    cfg = TABLES.get(table)
    if not cfg or table not in VALID_EXPORTS:
        return HttpResponse('Tabla no válida', status=400)

    fields = editable_fields(cfg['model'])
    cols = [f.name for f in fields]
    labels = [f.verbose_name or f.name for f in fields]
    search = request.GET.get('search', '')

    qs = cfg['model'].objects.all()
    if search:
        q = None
        from django.db.models import Q
        for f in fields:
            if f.name == 'datos':
                continue
            q = q | Q(**{f'{f.name}__icontains': search}) if q else Q(**{f'{f.name}__icontains': search})
        qs = qs.filter(q)

    rows = list(qs.values(*cols))
    clean = []
    for row in rows:
        clean.append({c: (row[c] if row[c] is not None else '') for c in cols})

    filename = f'{table}.{fmt}'
    if fmt == 'xlsx':
        return _xlsx_response(table, cols, labels, clean, filename)
    if fmt == 'csv':
        return _csv_response(cols, clean, filename)
    if fmt == 'pdf':
        return _pdf_response(table, cols, labels, clean, filename)
    return HttpResponse('Formato no válido', status=400)


def _xlsx_response(table, cols, labels, rows, filename):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = table[:31]
    ws.append(labels)
    for row in rows:
        ws.append([row[c] for c in cols])
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    wb.save(response)
    return response


def _csv_response(cols, rows, filename):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    writer = csv.writer(response)
    writer.writerow(cols)
    for row in rows:
        writer.writerow([row[c] for c in cols])
    return response


def _pdf_response(table, cols, labels, rows, filename):
    from io import BytesIO

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas

    buf = BytesIO()
    page_w, page_h = landscape(A4)
    margin = 12 * mm
    usable = page_w - 2 * margin

    c = canvas.Canvas(buf, pagesize=landscape(A4))
    show_cols = cols[:10]
    show_labels = labels[:10]
    col_w = usable / len(show_cols)

    y = page_h - 20 * mm
    c.setFont('Helvetica-Bold', 14)
    c.drawString(margin, y, f'Reporte: {table}')
    y -= 6 * mm
    c.setFont('Helvetica-Bold', 7)
    x = margin
    c.setFillColor(colors.HexColor('#1a237e'))
    c.rect(margin, y - 8, usable, 10, fill=1, stroke=0)
    c.setFillColor(colors.white)
    for i, label in enumerate(show_labels):
        c.drawString(x + 3, y - 3, label[:25])
        x += col_w
    y -= 12

    c.setFillColor(colors.black)
    row_height = 8
    for row in rows[:200]:
        if y < 15 * mm:
            c.showPage()
            y = page_h - 15 * mm
        c.setFont('Helvetica', 6)
        x = margin
        for i, col in enumerate(show_cols):
            val = str(row[col])[:28]
            c.drawString(x + 3, y - 2, val)
            x += col_w
        y -= row_height

    c.showPage()
    c.save()
    response = HttpResponse(buf.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response

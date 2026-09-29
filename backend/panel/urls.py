from django.urls import path

from . import views
from .export import export_view

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('importar/', views.import_view, name='import'),
    path('importar/preview/', views.import_preview, name='import_preview'),
    path('importar/ejecutar/', views.import_execute, name='import_execute'),
    path('puestos_oficina/plano/', views.plano_puestos, name='plano_puestos'),
    path('puestos_oficina/plano/app/', views.plano_puestos_app, name='plano_puestos_app'),
    path('puestos_oficina/plano/app/personal.json', views.plano_puestos_personal, name='plano_puestos_personal'),
    path('<str:table>/nuevo/',views.add_view, name='add'),
    path('<str:table>/<int:pk>/editar/', views.edit_view, name='edit'),
    path('<str:table>/<int:pk>/eliminar/', views.delete_view, name='delete'),
    path('<str:table>/exportar/<str:fmt>/', export_view, name='export'),
    path('<str:table>/', views.list_view, name='list'),
]

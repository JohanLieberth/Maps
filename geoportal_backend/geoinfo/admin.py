from django.contrib.gis import admin # Usar admin.GISModelAdmin para modelos con geometrías
from .models import Punto, Poligono, DocumentoAdjunto, PerfilUsuario

# Registrar modelos aquí para que aparezcan en el admin de Django

# Es recomendable usar GISModelAdmin para modelos con campos geométricos
# ya que proporciona un widget de mapa para la edición.

@admin.register(Punto)
class PuntoAdmin(admin.GISModelAdmin):
    list_display = ('nombre', 'creador', 'fecha_creacion', 'descripcion_corta')
    search_fields = ('nombre', 'descripcion')
    list_filter = ('creador', 'fecha_creacion')
    gis_widget_kwargs = {
        'attrs': {
            'default_zoom': 10,
            'default_lon': -74, # Ajustar a tu área de interés
            'default_lat': 4,   # Ajustar a tu área de interés
        },
    }

    def descripcion_corta(self, obj):
        return (obj.descripcion[:75] + '...') if len(obj.descripcion) > 75 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'


@admin.register(Poligono)
class PoligonoAdmin(admin.GISModelAdmin):
    list_display = ('nombre', 'creador', 'fecha_creacion', 'descripcion_corta')
    search_fields = ('nombre', 'descripcion')
    list_filter = ('creador', 'fecha_creacion')
    gis_widget_kwargs = {
        'attrs': {
            'default_zoom': 10,
            'default_lon': -74, # Ajustar a tu área de interés
            'default_lat': 4,   # Ajustar a tu área de interés
        },
    }

    def descripcion_corta(self, obj):
        return (obj.descripcion[:75] + '...') if len(obj.descripcion) > 75 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'


@admin.register(DocumentoAdjunto)
class DocumentoAdjuntoAdmin(admin.ModelAdmin):
    list_display = ('nombre_documento', 'elemento_geografico_link', 'tipo_archivo', 'fecha_subida')
    search_fields = ('nombre_documento', 'elemento_geografico__nombre')
    list_filter = ('fecha_subida',)

    def elemento_geografico_link(self, obj):
        from django.urls import reverse
        from django.utils.html import format_html
        if obj.elemento_geografico:
            # Determinar si es Punto o Polígono para el enlace correcto en el admin
            if hasattr(obj.elemento_geografico, 'punto'):
                link = reverse("admin:geoinfo_punto_change", args=[obj.elemento_geografico.punto.id])
                return format_html('<a href="{}">{} (Punto)</a>', link, obj.elemento_geografico.nombre)
            elif hasattr(obj.elemento_geografico, 'poligono'):
                link = reverse("admin:geoinfo_poligono_change", args=[obj.elemento_geografico.poligono.id])
                return format_html('<a href="{}">{} (Polígono)</a>', link, obj.elemento_geografico.nombre)
        return "N/A"
    elemento_geografico_link.short_description = 'Elemento Geográfico'

    def tipo_archivo(self, obj):
        if obj.archivo:
            return obj.archivo.name.split('.')[-1].upper()
        elif obj.enlace_externo:
            return "Enlace Externo"
        return "N/A"
    tipo_archivo.short_description = 'Tipo'


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ('usuario_email', 'rol', 'nombre_completo')
    search_fields = ('usuario__username', 'usuario__email', 'usuario__first_name', 'usuario__last_name')
    list_filter = ('rol',)

    def usuario_email(self, obj):
        return obj.usuario.email
    usuario_email.short_description = 'Email del Usuario'
    usuario_email.admin_order_field = 'usuario__email'

    def nombre_completo(self, obj):
        return obj.usuario.get_full_name()
    nombre_completo.short_description = 'Nombre Completo'
    nombre_completo.admin_order_field = 'usuario__last_name'

# Nota: Los modelos (Punto, Poligono, etc.) aún no están definidos.
# Este archivo admin.py es una configuración anticipada.
# Se crearán los modelos en models.py a continuación.

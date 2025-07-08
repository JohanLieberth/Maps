from django.apps import AppConfig


class GeoinfoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'geoinfo'

    def ready(self):
        # Importar signals si los tuvieras, etc.
        pass

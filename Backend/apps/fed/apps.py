from django.apps import AppConfig


class FedConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.fed"
    label = "fed"
    verbose_name = "Indicadores FED"

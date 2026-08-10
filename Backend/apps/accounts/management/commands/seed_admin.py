from django.core.management.base import BaseCommand

from apps.accounts.services import ensure_admin_user


class Command(BaseCommand):
    help = "Crea o restablece el usuario administrador inicial (admin / Admin123!)"

    def add_arguments(self, parser):
        parser.add_argument("--username", default="admin")
        parser.add_argument("--password", default="Admin123!")

    def handle(self, *args, **options):
        user = ensure_admin_user(options["username"], options["password"])
        self.stdout.write(
            self.style.SUCCESS(
                f"Usuario listo: {user.username} (perfil={user.perfil.codigo})"
            )
        )

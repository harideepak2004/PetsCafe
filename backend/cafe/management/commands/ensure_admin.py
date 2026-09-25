"""Create or update a staff/superuser account from environment variables.

Runs on every start (see the Render start command) so you can get a staff
login without shell access: set ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD.
"""
import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create/update the staff admin user from ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_EMAIL."

    def handle(self, *args, **options):
        username = os.environ.get("ADMIN_USERNAME", "").strip()
        password = os.environ.get("ADMIN_PASSWORD", "")
        if not username or not password:
            self.stdout.write("ensure_admin: ADMIN_USERNAME/ADMIN_PASSWORD not set, skipping.")
            return
        user, created = User.objects.get_or_create(username=username)
        user.email = os.environ.get("ADMIN_EMAIL", user.email)
        user.is_staff = True
        user.is_superuser = True
        if created or not user.check_password(password):
            user.set_password(password)
        user.save()
        self.stdout.write(f"ensure_admin: {'created' if created else 'updated'} staff user '{username}'.")

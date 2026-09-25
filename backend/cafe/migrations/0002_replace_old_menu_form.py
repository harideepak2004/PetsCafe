from django.db import migrations


class Migration(migrations.Migration):
    """The old MenuItem was an order form without prices or a customer; it is
    replaced by a real menu. Existing feedback is kept."""

    dependencies = [("cafe", "0001_initial")]

    operations = [
        migrations.DeleteModel(name="MenuItem"),
    ]

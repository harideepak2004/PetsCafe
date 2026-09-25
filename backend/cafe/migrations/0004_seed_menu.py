from decimal import Decimal

from django.db import migrations

# (name, category, description, price, is_veg, image, featured)
MENU = [
    ("Espresso", "coffee", "A short, strong shot of our house blend.", "90", True, "", False),
    ("Cappuccino", "coffee", "Espresso with steamed milk and a thick foam cap.", "140", True, "", True),
    ("Café Latte", "coffee", "Smooth espresso with lots of silky milk.", "150", True, "", False),
    ("Cold Coffee", "coffee", "Chilled, creamy and blended with ice.", "160", True, "", True),
    ("Masala Chai", "beverages", "Spiced milk tea brewed the Tuticorin way.", "60", True, "", False),
    ("Hot Chocolate", "beverages", "Rich cocoa topped with whipped cream.", "150", True, "", False),
    ("Fresh Lime Soda", "beverages", "Sweet, salted or mixed.", "80", True, "", False),
    ("Mango Shake", "beverages", "Thick shake made with Alphonso pulp.", "140", True, "", False),
    ("Veg Puff", "snacks", "Flaky puff pastry with spiced vegetables.", "40", True, "", False),
    ("Egg Puff", "snacks", "Our bestseller — half a boiled egg in masala.", "50", False, "", True),
    ("French Fries", "snacks", "Crispy fries with peri-peri seasoning.", "110", True, "", False),
    ("Chicken Nuggets", "snacks", "Six golden nuggets with garlic dip.", "190", False, "", False),
    ("Veg Grilled Sandwich", "sandwiches", "Cheese, capsicum, onion and mint chutney.", "130", True, "/images/sandwich.webp", False),
    ("Chicken Cheese Sandwich", "sandwiches", "Pulled chicken with melted cheese, toasted.", "170", False, "/images/sandwich.webp", True),
    ("Paneer Tikka Sandwich", "sandwiches", "Tandoori paneer, onions and cheese.", "160", True, "/images/sandwich.webp", False),
    ("Margherita Pizza", "pizza", "Tomato sauce, mozzarella and basil. 8\".", "220", True, "", False),
    ("Cheese Volcano Pizza", "pizza", "Loaded with a molten cheese centre. 8\".", "280", True, "", True),
    ("BBQ Chicken Pizza", "pizza", "Smoky BBQ chicken with onions. 8\".", "320", False, "", False),
    ("Glazed Donuts (2 pcs)", "desserts", "Pick two from today's tray.", "90", True, "/images/donut.webp", True),
    ("Butter Croissant", "desserts", "Baked fresh every morning.", "110", True, "/images/pastries.webp", False),
    ("Choco Brownie", "desserts", "Warm fudgy brownie, extra gooey.", "120", True, "", False),
]


def seed(apps, schema_editor):
    MenuItem = apps.get_model("cafe", "MenuItem")
    if MenuItem.objects.exists():
        return
    MenuItem.objects.bulk_create(
        MenuItem(
            name=name, category=cat, description=desc, price=Decimal(price),
            is_veg=veg, image=image, is_featured=featured, sort_order=i,
        )
        for i, (name, cat, desc, price, veg, image, featured) in enumerate(MENU)
    )


def unseed(apps, schema_editor):
    apps.get_model("cafe", "MenuItem").objects.filter(name__in=[m[0] for m in MENU]).delete()


class Migration(migrations.Migration):
    dependencies = [("cafe", "0003_menu_orders_bookings")]
    operations = [migrations.RunPython(seed, unseed)]

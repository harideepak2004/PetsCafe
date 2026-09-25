from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class MenuItem(models.Model):
    CATEGORY_CHOICES = [
        ("coffee", "Coffee"),
        ("beverages", "Beverages"),
        ("snacks", "Snacks"),
        ("sandwiches", "Sandwiches"),
        ("pizza", "Pizza"),
        ("desserts", "Desserts"),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=255, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    is_veg = models.BooleanField(default=True)
    image = models.CharField(max_length=300, blank=True, help_text="Image URL or path, e.g. /images/donut.webp")
    is_available = models.BooleanField(default=True, help_text="Untick when sold out.")
    is_featured = models.BooleanField(default=False, help_text="Show on the home page.")
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_PENDING = "pending"
    STATUS_PREPARING = "preparing"
    STATUS_READY = "ready"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Received"),
        (STATUS_PREPARING, "Preparing"),
        (STATUS_READY, "Ready"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]
    OPEN_STATUSES = [STATUS_PENDING, STATUS_PREPARING, STATUS_READY]

    TYPE_CHOICES = [("dine_in", "Dine in"), ("takeaway", "Takeaway")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_PENDING)
    order_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default="dine_in")
    table_number = models.CharField(max_length=10, blank=True)
    note = models.CharField(max_length=300, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} ({self.get_status_display()})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True, blank=True)
    # Snapshot, so old orders keep their name/price if the menu changes.
    name = models.CharField(max_length=100)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(20)])
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} × {self.name}"


class Booking(models.Model):
    """A table + pet-time visit in a one-hour slot."""

    PET_CHOICES = [
        ("any", "Any pet"),
        ("dog", "Dogs"),
        ("cat", "Cats"),
        ("hamster", "Hamsters"),
        ("love-birds", "Love birds"),
    ]
    STATUS_CONFIRMED = "confirmed"
    STATUS_CANCELLED = "cancelled"
    STATUS_COMPLETED = "completed"
    STATUS_NO_SHOW = "no_show"
    STATUS_CHOICES = [
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_COMPLETED, "Visited"),
        (STATUS_NO_SHOW, "No-show"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings")
    date = models.DateField()
    slot = models.PositiveSmallIntegerField(help_text="Start hour, 24h clock (e.g. 15 = 3 PM).")
    guests = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)])
    pet_preference = models.CharField(max_length=12, choices=PET_CHOICES, default="any")
    phone = models.CharField(max_length=15, blank=True)
    note = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_CONFIRMED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "slot"]
        indexes = [models.Index(fields=["date", "slot", "status"])]

    def __str__(self):
        return f"{self.date} {self.slot}:00 · {self.guests} guests"


class Feedback(models.Model):
    PET_CHOICES = [
        ("dog", "Dog"),
        ("cat", "Cat"),
        ("hamster", "Hamster"),
        ("love-birds", "Love Birds"),
    ]
    PET_HOLDER_CHOICES = [("yes", "Yes"), ("no", "No")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True)
    pet_type = models.CharField(max_length=20, choices=PET_CHOICES, blank=True)
    pet_holder = models.CharField(max_length=3, choices=PET_HOLDER_CHOICES, blank=True)
    rating = models.PositiveSmallIntegerField(
        default=5, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    message = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.name} ({self.rating}★)"

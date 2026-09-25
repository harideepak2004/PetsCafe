import re
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from .models import Booking, Feedback, MenuItem, Order, OrderItem

PHONE_RE = re.compile(r"^\+?[0-9]{7,14}$")


def clean_phone(value):
    value = (value or "").replace(" ", "").replace("-", "")
    if value and not PHONE_RE.match(value):
        raise serializers.ValidationError("Enter a valid phone number.")
    return value


def slot_label(hour: int) -> str:
    suffix = "AM" if hour < 12 else "PM"
    h = hour % 12 or 12
    return f"{h}:00 {suffix}"


# ─── Menu ─────────────────────────────────────────────────────────────────────


class MenuItemSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id", "name", "category", "category_label", "description", "price", "is_veg",
            "image", "is_available", "is_featured", "sort_order",
        ]


# ─── Orders ───────────────────────────────────────────────────────────────────


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "menu_item", "name", "unit_price", "quantity", "line_total"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    order_type_label = serializers.CharField(source="get_order_type_display", read_only=True)
    customer = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "status", "status_label", "order_type", "order_type_label", "table_number",
            "note", "total", "items", "customer", "created_at", "updated_at",
        ]

    def get_customer(self, obj):
        u = obj.user
        return {"name": u.get_full_name() or u.username, "email": u.email}


class OrderLineInput(serializers.Serializer):
    id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=20)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderLineInput(many=True, allow_empty=False)
    order_type = serializers.ChoiceField(choices=Order.TYPE_CHOICES, default="dine_in")
    table_number = serializers.CharField(max_length=10, required=False, allow_blank=True)
    note = serializers.CharField(max_length=300, required=False, allow_blank=True)

    def validate_items(self, items):
        merged = {}
        for line in items:
            merged[line["id"]] = merged.get(line["id"], 0) + line["quantity"]
        if len(merged) > 30:
            raise serializers.ValidationError("That's a lot of items — please split the order.")
        menu = MenuItem.objects.in_bulk(list(merged))
        missing = [i for i in merged if i not in menu]
        if missing:
            raise serializers.ValidationError("Some items are no longer on the menu. Please refresh.")
        sold_out = [menu[i].name for i in merged if not menu[i].is_available]
        if sold_out:
            raise serializers.ValidationError(f"Sorry, sold out: {', '.join(sold_out)}.")
        too_many = [menu[i].name for i, q in merged.items() if q > 20]
        if too_many:
            raise serializers.ValidationError(f"Max 20 of each item ({', '.join(too_many)}).")
        return [(menu[i], q) for i, q in merged.items()]

    def validate(self, attrs):
        if attrs.get("order_type") == "dine_in" and not attrs.get("table_number", "").strip():
            raise serializers.ValidationError({"table_number": "Enter your table number (it's on the table stand)."})
        return attrs


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)


# ─── Bookings ─────────────────────────────────────────────────────────────────


class BookingSerializer(serializers.ModelSerializer):
    slot_label = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    pet_label = serializers.CharField(source="get_pet_preference_display", read_only=True)
    customer = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id", "date", "slot", "slot_label", "guests", "pet_preference", "pet_label", "phone",
            "note", "status", "status_label", "customer", "can_cancel", "created_at",
        ]
        read_only_fields = ["status", "created_at"]

    def get_slot_label(self, obj):
        return slot_label(obj.slot)

    def get_customer(self, obj):
        u = obj.user
        return {"name": u.get_full_name() or u.username, "email": u.email}

    def get_can_cancel(self, obj):
        return obj.status == Booking.STATUS_CONFIRMED and booking_start(obj.date, obj.slot) > timezone.now()

    def validate_phone(self, value):
        return clean_phone(value)

    def validate(self, attrs):
        date, slot = attrs["date"], attrs["slot"]
        today = timezone.localdate()
        if not settings.CAFE_OPEN_HOUR <= slot < settings.CAFE_CLOSE_HOUR:
            raise serializers.ValidationError({"slot": "Pick a time when we're open."})
        if date < today or booking_start(date, slot) <= timezone.now():
            raise serializers.ValidationError({"slot": "That time has already passed."})
        if date > today + timedelta(days=settings.CAFE_BOOKING_DAYS_AHEAD):
            raise serializers.ValidationError(
                {"date": f"You can book up to {settings.CAFE_BOOKING_DAYS_AHEAD} days ahead."}
            )
        return attrs


def booking_start(date, slot):
    from datetime import datetime, time

    return timezone.make_aware(datetime.combine(date, time(hour=slot)))


class BookingStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Booking.STATUS_CHOICES)


# ─── Feedback ─────────────────────────────────────────────────────────────────


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ["id", "name", "email", "phone", "pet_type", "pet_holder", "rating", "message", "submitted_at"]
        read_only_fields = ["submitted_at"]

    def validate_phone(self, value):
        return clean_phone(value)

    def validate_message(self, value):
        value = value.strip()
        if len(value) < 5:
            raise serializers.ValidationError("Tell us a little more.")
        return value

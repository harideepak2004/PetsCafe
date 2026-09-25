from django.contrib import admin

from .models import Booking, Feedback, MenuItem, Order, OrderItem


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "price", "is_veg", "is_available", "is_featured", "sort_order"]
    list_editable = ["price", "is_available", "is_featured", "sort_order"]
    list_filter = ["category", "is_veg", "is_available"]
    search_fields = ["name"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["menu_item", "name", "unit_price", "quantity", "line_total"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "order_type", "table_number", "total", "status", "created_at"]
    list_filter = ["status", "order_type"]
    search_fields = ["user__username", "user__email", "id"]
    inlines = [OrderItemInline]
    date_hierarchy = "created_at"


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["date", "slot", "user", "guests", "pet_preference", "status"]
    list_filter = ["status", "pet_preference", "date"]
    search_fields = ["user__username", "user__email", "phone"]


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "rating", "pet_type", "submitted_at"]
    list_filter = ["rating", "pet_type"]
    search_fields = ["name", "email", "message"]

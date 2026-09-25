from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from rest_framework.exceptions import APIException

from . import emails
from .models import Booking, Order, OrderItem

TWO = Decimal("0.01")


class Conflict(APIException):
    status_code = 409
    default_detail = "Conflict."
    default_code = "conflict"


# Which status changes staff may make.
ORDER_FLOW = {
    Order.STATUS_PENDING: {Order.STATUS_PREPARING, Order.STATUS_CANCELLED},
    Order.STATUS_PREPARING: {Order.STATUS_READY, Order.STATUS_CANCELLED},
    Order.STATUS_READY: {Order.STATUS_COMPLETED},
    Order.STATUS_COMPLETED: set(),
    Order.STATUS_CANCELLED: set(),
}


def place_order(user, data) -> Order:
    with transaction.atomic():
        order = Order.objects.create(
            user=user,
            order_type=data["order_type"],
            table_number=data.get("table_number", "").strip() if data["order_type"] == "dine_in" else "",
            note=data.get("note", "").strip(),
        )
        total = Decimal("0.00")
        lines = []
        for item, qty in data["items"]:
            line_total = (item.price * qty).quantize(TWO)
            total += line_total
            lines.append(OrderItem(order=order, menu_item=item, name=item.name,
                                   unit_price=item.price, quantity=qty, line_total=line_total))
        OrderItem.objects.bulk_create(lines)
        order.total = total
        order.save(update_fields=["total"])
        emails.send_order_confirmation(order)
    return order


def set_order_status(order: Order, new_status: str, *, by_customer=False) -> Order:
    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order.pk)
        if by_customer:
            if new_status != Order.STATUS_CANCELLED or order.status != Order.STATUS_PENDING:
                raise Conflict("This order is already being prepared and can't be cancelled. Please ask the staff.")
        elif new_status not in ORDER_FLOW[order.status]:
            raise Conflict(f"Can't move an order from {order.get_status_display()} to "
                           f"{dict(Order.STATUS_CHOICES)[new_status]}.")
        order.status = new_status
        order.save(update_fields=["status", "updated_at"])
    if new_status == Order.STATUS_READY:
        emails.send_order_ready(order)
    return order


def seats_taken(date, slot, exclude_id=None) -> int:
    qs = Booking.objects.filter(date=date, slot=slot, status=Booking.STATUS_CONFIRMED)
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)
    return qs.aggregate(n=Sum("guests"))["n"] or 0


def availability(date):
    rows = (
        Booking.objects.filter(date=date, status=Booking.STATUS_CONFIRMED)
        .values("slot").annotate(n=Sum("guests"))
    )
    taken = {r["slot"]: r["n"] for r in rows}
    return {
        slot: max(settings.CAFE_SEATS_PER_SLOT - taken.get(slot, 0), 0)
        for slot in range(settings.CAFE_OPEN_HOUR, settings.CAFE_CLOSE_HOUR)
    }


def create_booking(user, data) -> Booking:
    with transaction.atomic():
        # Lock existing bookings for the slot so two people can't grab the last seats at once.
        list(Booking.objects.select_for_update().filter(date=data["date"], slot=data["slot"]))
        if Booking.objects.filter(user=user, date=data["date"], slot=data["slot"],
                                  status=Booking.STATUS_CONFIRMED).exists():
            raise Conflict("You already have a booking at this time.")
        left = settings.CAFE_SEATS_PER_SLOT - seats_taken(data["date"], data["slot"])
        if data["guests"] > left:
            raise Conflict("Sorry, that slot just filled up." if left <= 0
                           else f"Only {left} seat{'s' if left != 1 else ''} left at that time.")
        booking = Booking.objects.create(user=user, **data)
        emails.send_booking_confirmation(booking)
    return booking

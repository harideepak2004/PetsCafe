"""Transactional emails. Failures are logged, never raised, so SMTP trouble
can't break an order or a booking."""
import logging
import threading

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _send(subject, template, context, recipient):
    try:
        send_mail(
            subject=subject,
            message=render_to_string(f"email/{template}.txt", context),
            html_message=render_to_string(f"email/{template}.html", context),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
        )
    except Exception:  # noqa: BLE001
        logger.exception("Failed to send '%s' email to %s", subject, recipient)


def _dispatch(subject, template, context, recipient):
    if not recipient:
        return

    def go():
        if getattr(settings, "EMAIL_ASYNC", True):
            threading.Thread(target=_send, args=(subject, template, context, recipient), daemon=True).start()
        else:
            _send(subject, template, context, recipient)

    transaction.on_commit(go)


def _ctx(**extra):
    return {"frontend_url": settings.FRONTEND_URL, **extra}


def send_order_confirmation(order):
    _dispatch(f"Pets Cafe – order #{order.pk} received", "order",
              _ctx(order=order, items=list(order.items.all()), headline="We've got your order!"), order.user.email)


def send_order_ready(order):
    _dispatch(f"Pets Cafe – order #{order.pk} is ready", "order",
              _ctx(order=order, items=list(order.items.all()), headline="Your order is ready 🐾"), order.user.email)


def send_booking_confirmation(booking):
    from .serializers import slot_label

    _dispatch("Pets Cafe – your visit is booked", "booking",
              _ctx(booking=booking, slot=slot_label(booking.slot)), booking.user.email)

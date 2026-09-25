from datetime import date as date_cls, timedelta
from decimal import Decimal

from django.conf import settings
from django.db.models import Avg, Count, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from . import services
from .models import Booking, Feedback, MenuItem, Order
from .serializers import (
    BookingSerializer,
    BookingStatusSerializer,
    FeedbackSerializer,
    MenuItemSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    OrderStatusSerializer,
    booking_start,
    slot_label,
)


def _parse_date(value, default=None):
    if not value:
        return default
    try:
        return date_cls.fromisoformat(value)
    except ValueError as exc:
        raise ValidationError({"date": "Use YYYY-MM-DD."}) from exc


# ─── Public ───────────────────────────────────────────────────────────────────


class MenuView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        items = MenuItem.objects.all()
        return Response(MenuItemSerializer(items, many=True).data)


class CafeInfoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "open_hour": settings.CAFE_OPEN_HOUR,
            "close_hour": settings.CAFE_CLOSE_HOUR,
            "seats_per_slot": settings.CAFE_SEATS_PER_SLOT,
            "booking_days_ahead": settings.CAFE_BOOKING_DAYS_AHEAD,
            "categories": [{"id": k, "label": v} for k, v in MenuItem.CATEGORY_CHOICES],
            "pets": [{"id": k, "label": v} for k, v in Booking.PET_CHOICES],
        })


class AvailabilityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        day = _parse_date(request.query_params.get("date"), timezone.localdate())
        now = timezone.now()
        seats = services.availability(day)
        return Response({
            "date": day.isoformat(),
            "slots": [
                {"slot": s, "label": slot_label(s), "seats_left": left, "past": booking_start(day, s) <= now}
                for s, left in seats.items()
            ],
        })


class FeedbackCreateView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "feedback"

    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user if request.user.is_authenticated else None)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ─── Customer (login required) ────────────────────────────────────────────────


class OrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    throttle_scope = "orders"

    def get_throttles(self):
        return [ScopedRateThrottle()] if self.action == "create" else []

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items").select_related("user")

    def create(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.place_order(request.user, serializer.validated_data)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = services.set_order_status(self.get_object(), Order.STATUS_CANCELLED, by_customer=True)
        return Response(OrderSerializer(order).data)


class BookingViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related("user").order_by("-date", "-slot")

    def create(self, request):
        serializer = BookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = {k: v for k, v in serializer.validated_data.items()}
        booking = services.create_booking(request.user, data)
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if not BookingSerializer().get_can_cancel(booking):
            raise services.Conflict("This booking can't be cancelled any more.")
        booking.status = Booking.STATUS_CANCELLED
        booking.save(update_fields=["status"])
        return Response(BookingSerializer(booking).data)


# ─── Staff ────────────────────────────────────────────────────────────────────


class StaffOrderViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Order.objects.prefetch_related("items").select_related("user")
        state = self.request.query_params.get("status", "open")
        if state == "open":
            qs = qs.filter(status__in=Order.OPEN_STATUSES).order_by("created_at")
        elif state == "today":
            qs = qs.filter(created_at__date=timezone.localdate())
        elif state in dict(Order.STATUS_CHOICES):
            qs = qs.filter(status=state)
        return qs[:300]

    @action(detail=True, methods=["post"])
    def status(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)
        body = OrderStatusSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        order = services.set_order_status(order, body.validated_data["status"])
        return Response(OrderSerializer(order).data)


class StaffBookingViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        day = _parse_date(self.request.query_params.get("date"), timezone.localdate())
        return Booking.objects.filter(date=day).select_related("user").order_by("slot", "created_at")

    @action(detail=True, methods=["post"])
    def status(self, request, pk=None):
        booking = get_object_or_404(Booking, pk=pk)
        body = BookingStatusSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        booking.status = body.validated_data["status"]
        booking.save(update_fields=["status"])
        return Response(BookingSerializer(booking).data)


class StaffMenuViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminUser]
    queryset = MenuItem.objects.all()


class StaffFeedbackViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = FeedbackSerializer
    permission_classes = [IsAdminUser]
    queryset = Feedback.objects.all()[:200]


class StaffStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.localdate()
        week_start = today - timedelta(days=6)
        paid = Order.objects.exclude(status=Order.STATUS_CANCELLED)
        today_orders = paid.filter(created_at__date=today)
        daily = {
            row["created_at__date"]: row
            for row in paid.filter(created_at__date__gte=week_start)
            .values("created_at__date").annotate(revenue=Sum("total"), count=Count("id"))
        }
        top = (
            paid.filter(created_at__date__gte=week_start)
            .values("items__name").annotate(qty=Sum("items__quantity"))
            .exclude(items__name=None).order_by("-qty")[:5]
        )
        bookings_today = Booking.objects.filter(date=today, status__in=[Booking.STATUS_CONFIRMED, Booking.STATUS_COMPLETED])
        return Response({
            "today_revenue": str(today_orders.aggregate(s=Sum("total"))["s"] or Decimal("0.00")),
            "today_orders": today_orders.count(),
            "open_orders": Order.objects.filter(status__in=Order.OPEN_STATUSES).count(),
            "today_bookings": bookings_today.count(),
            "today_guests": bookings_today.aggregate(s=Sum("guests"))["s"] or 0,
            "avg_rating": round(Feedback.objects.aggregate(a=Avg("rating"))["a"] or 0, 1),
            "feedback_count": Feedback.objects.count(),
            "revenue_7d": [
                {
                    "date": (week_start + timedelta(days=i)).isoformat(),
                    "revenue": str(daily.get(week_start + timedelta(days=i), {}).get("revenue") or Decimal("0.00")),
                    "orders": daily.get(week_start + timedelta(days=i), {}).get("count", 0),
                }
                for i in range(7)
            ],
            "top_items": [{"name": t["items__name"], "quantity": t["qty"]} for t in top],
        })

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("orders", views.OrderViewSet, basename="order")
router.register("bookings", views.BookingViewSet, basename="booking")
router.register("staff/orders", views.StaffOrderViewSet, basename="staff-order")
router.register("staff/bookings", views.StaffBookingViewSet, basename="staff-booking")
router.register("staff/menu", views.StaffMenuViewSet, basename="staff-menu")
router.register("staff/feedback", views.StaffFeedbackViewSet, basename="staff-feedback")

urlpatterns = [
    path("menu/", views.MenuView.as_view(), name="menu"),
    path("info/", views.CafeInfoView.as_view(), name="info"),
    path("availability/", views.AvailabilityView.as_view(), name="availability"),
    path("feedback/", views.FeedbackCreateView.as_view(), name="feedback"),
    path("staff/stats/", views.StaffStatsView.as_view(), name="staff-stats"),
    path("", include(router.urls)),
]

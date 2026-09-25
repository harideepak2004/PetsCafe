from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Booking, MenuItem, Order


@override_settings(
    EMAIL_ASYNC=False,
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    CAFE_OPEN_HOUR=0, CAFE_CLOSE_HOUR=24, CAFE_SEATS_PER_SLOT=6,
)
class CafeTestCase(TestCase):
    def setUp(self):
        cache.clear()
        MenuItem.objects.all().delete()  # drop the seeded menu
        self.alice = User.objects.create_user("alice", "alice@example.com", "Str0ng-pass!")
        self.bob = User.objects.create_user("bob", "bob@example.com", "Str0ng-pass!")
        self.staff = User.objects.create_user("staff", "staff@example.com", "Str0ng-pass!", is_staff=True)
        self.latte = MenuItem.objects.create(name="Latte", category="coffee", price=Decimal("150"))
        self.puff = MenuItem.objects.create(name="Egg Puff", category="snacks", price=Decimal("50"), is_veg=False)
        self.anon = APIClient()

    def client_for(self, user):
        c = APIClient()
        c.force_authenticate(user)
        return c

    def order(self, user=None, **overrides):
        body = {"items": [{"id": self.latte.id, "quantity": 2}, {"id": self.puff.id, "quantity": 3}],
                "order_type": "dine_in", "table_number": "4"}
        body.update(overrides)
        with self.captureOnCommitCallbacks(execute=True):
            return self.client_for(user or self.alice).post("/api/orders/", body, format="json")

    def future_slot(self, hours=3):
        start = timezone.localtime() + timedelta(hours=hours)
        return start.date().isoformat(), start.hour


class AuthTests(CafeTestCase):
    def test_register_and_me_shows_staff_flag(self):
        res = self.anon.post("/api/auth/register/", {"username": "new", "email": "n@example.com",
                                                      "first_name": "N", "password": "Pets#Cafe2026"}, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertFalse(res.data["user"]["is_staff"])
        self.assertTrue(self.client_for(self.staff).get("/api/auth/me/").data["is_staff"])


class MenuTests(CafeTestCase):
    def test_menu_is_public(self):
        res = self.anon.get("/api/menu/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual({m["name"] for m in res.data}, {"Latte", "Egg Puff"})

    def test_only_staff_can_edit_menu(self):
        self.assertEqual(self.client_for(self.alice).post("/api/staff/menu/", {}).status_code, 403)
        res = self.client_for(self.staff).post("/api/staff/menu/", {"name": "Mocha", "category": "coffee", "price": "170"})
        self.assertEqual(res.status_code, 201, res.data)
        res = self.client_for(self.staff).patch(f"/api/staff/menu/{self.latte.id}/", {"is_available": False})
        self.assertFalse(res.data["is_available"])


class OrderTests(CafeTestCase):
    def test_login_required(self):
        self.assertEqual(self.anon.post("/api/orders/", {}, format="json").status_code, 401)

    def test_totals_computed_on_server_and_email_sent(self):
        res = self.order(items=[{"id": self.latte.id, "quantity": 2}, {"id": self.puff.id, "quantity": 3},
                                {"id": self.latte.id, "quantity": 1}])
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(Decimal(res.data["total"]), Decimal("600.00"))  # 3×150 + 3×50
        self.assertEqual(len(res.data["items"]), 2)
        self.assertEqual(len(mail.outbox), 1)

    def test_dine_in_needs_table_takeaway_does_not(self):
        self.assertEqual(self.order(table_number="").status_code, 400)
        res = self.order(order_type="takeaway", table_number="9")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["table_number"], "")

    def test_sold_out_and_unknown_items_rejected(self):
        self.puff.is_available = False
        self.puff.save()
        self.assertEqual(self.order().status_code, 400)
        self.assertEqual(self.order(items=[{"id": 9999, "quantity": 1}]).status_code, 400)

    def test_price_snapshot_survives_menu_change(self):
        order_id = self.order().data["id"]
        self.latte.price = Decimal("999")
        self.latte.save()
        res = self.client_for(self.alice).get(f"/api/orders/{order_id}/")
        self.assertEqual(Decimal(res.data["total"]), Decimal("450.00"))

    def test_users_only_see_their_orders(self):
        order_id = self.order().data["id"]
        bob = self.client_for(self.bob)
        self.assertEqual(bob.get("/api/orders/").data, [])
        self.assertEqual(bob.get(f"/api/orders/{order_id}/").status_code, 404)

    def test_customer_cancel_only_while_pending(self):
        order_id = self.order().data["id"]
        alice = self.client_for(self.alice)
        self.client_for(self.staff).post(f"/api/staff/orders/{order_id}/status/", {"status": "preparing"})
        self.assertEqual(alice.post(f"/api/orders/{order_id}/cancel/").status_code, 409)
        other = self.order().data["id"]
        self.assertEqual(alice.post(f"/api/orders/{other}/cancel/").data["status"], "cancelled")

    def test_staff_status_flow(self):
        order_id = self.order().data["id"]
        staff = self.client_for(self.staff)
        self.assertEqual(self.client_for(self.alice).get("/api/staff/orders/").status_code, 403)
        self.assertEqual(len(staff.get("/api/staff/orders/").data), 1)
        self.assertEqual(staff.post(f"/api/staff/orders/{order_id}/status/", {"status": "completed"}).status_code, 409)
        mail.outbox.clear()
        for s in ["preparing", "ready", "completed"]:
            with self.captureOnCommitCallbacks(execute=True):
                res = staff.post(f"/api/staff/orders/{order_id}/status/", {"status": s})
            self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(len(mail.outbox), 1)  # "ready" email
        self.assertEqual(staff.get("/api/staff/orders/").data, [])

    def test_stats(self):
        self.order()
        stats = self.client_for(self.staff).get("/api/staff/stats/").data
        self.assertEqual(Decimal(stats["today_revenue"]), Decimal("450.00"))
        self.assertEqual(stats["open_orders"], 1)
        self.assertEqual(stats["top_items"][0]["name"], "Egg Puff")
        self.assertEqual(len(stats["revenue_7d"]), 7)


class BookingTests(CafeTestCase):
    def book(self, user=None, **overrides):
        day, slot = self.future_slot()
        body = {"date": day, "slot": slot, "guests": 2, "pet_preference": "cat", "phone": "98765 43210"}
        body.update(overrides)
        with self.captureOnCommitCallbacks(execute=True):
            return self.client_for(user or self.alice).post("/api/bookings/", body, format="json")

    def test_book_and_availability(self):
        res = self.book()
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(len(mail.outbox), 1)
        day, slot = self.future_slot()
        avail = self.anon.get(f"/api/availability/?date={day}").data
        row = next(s for s in avail["slots"] if s["slot"] == slot)
        self.assertEqual(row["seats_left"], 4)

    def test_capacity_enforced(self):
        self.assertEqual(self.book(guests=5).status_code, 201)
        res = self.book(user=self.bob, guests=2)
        self.assertEqual(res.status_code, 409)
        self.assertIn("Only 1 seat", str(res.data))
        self.assertEqual(self.book(user=self.bob, guests=1).status_code, 201)

    def test_past_and_far_future_rejected(self):
        past = timezone.localtime() - timedelta(hours=2)
        self.assertEqual(self.book(date=past.date().isoformat(), slot=past.hour).status_code, 400)
        far = (timezone.localdate() + timedelta(days=60)).isoformat()
        self.assertEqual(self.book(date=far, slot=12).status_code, 400)

    def test_duplicate_booking_same_slot(self):
        self.book()
        self.assertEqual(self.book().status_code, 409)

    def test_cancel_frees_seats_and_is_owner_only(self):
        booking_id = self.book(guests=6).data["id"]
        self.assertEqual(self.client_for(self.bob).post(f"/api/bookings/{booking_id}/cancel/").status_code, 404)
        res = self.client_for(self.alice).post(f"/api/bookings/{booking_id}/cancel/")
        self.assertEqual(res.data["status"], "cancelled")
        self.assertEqual(self.book(user=self.bob, guests=6).status_code, 201)

    def test_staff_sees_day_and_marks_visited(self):
        booking_id = self.book().data["id"]
        day, _ = self.future_slot()
        staff = self.client_for(self.staff)
        self.assertEqual(len(staff.get(f"/api/staff/bookings/?date={day}").data), 1)
        res = staff.post(f"/api/staff/bookings/{booking_id}/status/", {"status": "completed"})
        self.assertEqual(res.data["status"], "completed")


class FeedbackTests(CafeTestCase):
    def test_anyone_can_leave_feedback_staff_can_read(self):
        res = self.anon.post("/api/feedback/", {"name": "Ann", "email": "a@example.com", "rating": 4,
                                                "message": "Loved the cats!"}, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(self.client_for(self.alice).get("/api/staff/feedback/").status_code, 403)
        self.assertEqual(len(self.client_for(self.staff).get("/api/staff/feedback/").data), 1)
        self.assertEqual(self.anon.post("/api/feedback/", {"name": "x", "email": "bad", "message": "hi"}).status_code, 400)

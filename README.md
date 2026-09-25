# Pets Cafe

Website for Pets Cafe, Tuticorin. Customers browse the menu, order from their table or for takeaway, and book an
hour with the cafe's pets. Staff get a live dashboard for orders, bookings, the menu and feedback.

```
backend/    Django 5.2 + Django REST Framework API (token auth)
frontend/   React 19 + Vite single-page app
render.yaml Render blueprint for the API + Postgres
```

## Features

**Customers**
- Menu with categories, veg/non-veg marks, search and a "veg only" filter; sold-out items are greyed out
- Cart that survives page reloads; checkout for dine-in (table number) or takeaway, with notes for the kitchen
- **My orders** with live status (Received → Preparing → Ready → Served), cancel while not yet started, "order again"
- **Book a visit**: pick a day (up to 30 days ahead), a one-hour slot with live seats left, guests and which pets you want to meet
- **My bookings** with cancel
- Feedback with a star rating (no login needed)
- Emails: order received, order ready, booking confirmed

**Staff** (`/staff`, for accounts with staff access)
- Orders board — New / Preparing / Ready columns, refreshes every 10 seconds, one tap to move an order along
- Bookings per day — mark guests as arrived or no-show
- Menu manager — add/edit/delete items, toggle "available" when something sells out, choose what's on the home page
- Feedback inbox, today's sales, 7-day sales chart and top items
- Everything is also in Django admin at `/admin`

Prices are always worked out on the server, and each order keeps the price at the time it was placed.
Bookings can't go over the seats per slot (`CAFE_SEATS_PER_SLOT`, 20 by default).

## Run locally

**API** (terminal 1):

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env         # macOS/Linux: cp .env.example .env
python manage.py migrate       # also adds a starter menu
python manage.py createsuperuser   # your staff login
python manage.py runserver
```

**Frontend** (terminal 2):

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173 (proxies /api to :8000)
```

Without `EMAIL_HOST_USER`, emails are printed in the Django terminal.
Tests: `python manage.py test` in `backend/`, `npm run lint` in `frontend/`.

## Deploy

### API on Render

Create a **Postgres** database (Free), then a **Web Service** from this repo:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt && python manage.py collectstatic --noinput` |
| Start Command | `python manage.py migrate --noinput && python manage.py ensure_admin && gunicorn petscafe.wsgi --log-file -` |

Environment variables:

```env
PYTHON_VERSION=3.12.7
DEBUG=false
SECRET_KEY=<long random string>
DATABASE_URL=<External Database URL>?sslmode=require
CORS_ALLOWED_ORIGINS=https://<your-site>.netlify.app
FRONTEND_URL=https://<your-site>.netlify.app
ADMIN_USERNAME=<staff login>
ADMIN_PASSWORD=<strong password>
ADMIN_EMAIL=<your email>
EMAIL_HOST_USER=<gmail>            # optional
EMAIL_HOST_PASSWORD=<app password> # optional
```

Instead of `DATABASE_URL` you can set `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` (the full external host ending
in `.render.com`) and `DB_PORT`. `ensure_admin` creates/updates the staff account from the `ADMIN_*` variables on every
start, so you don't need shell access.

### Frontend on Netlify

Base directory `frontend` (build settings come from `netlify.toml`), and the environment variable
`VITE_API_URL=https://<your-api>.onrender.com` — no `/api`, no trailing slash. Redeploy after changing it.

## API overview

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register/` · `/login/` · `/logout/` · GET `/me/` | — / token |
| GET | `/api/menu/` · `/api/info/` · `/api/availability/?date=YYYY-MM-DD` | — |
| POST | `/api/feedback/` | — |
| GET/POST | `/api/orders/` · POST `/api/orders/{id}/cancel/` | customer |
| GET/POST | `/api/bookings/` · POST `/api/bookings/{id}/cancel/` | customer |
| GET | `/api/staff/orders/?status=open\|today\|<status>` · POST `/api/staff/orders/{id}/status/` | staff |
| GET | `/api/staff/bookings/?date=` · POST `/api/staff/bookings/{id}/status/` | staff |
| CRUD | `/api/staff/menu/` · GET `/api/staff/feedback/` · `/api/staff/stats/` | staff |

## Upgrading from the old version

Old feedback is kept. The old "menu order" records (which had no prices or customer) are dropped and replaced with a
real menu you can edit in the dashboard.

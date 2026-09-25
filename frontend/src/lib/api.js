const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "pc_token";

export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
  },
};

export class ApiError extends Error {
  constructor(status, data) {
    super(extractMessage(data) || `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
  /** Field-level errors from DRF, e.g. { email: "Already used" } */
  get fields() {
    if (!this.data || typeof this.data !== "object") return {};
    return Object.fromEntries(
      Object.entries(this.data)
        .filter(([k]) => k !== "detail" && k !== "non_field_errors")
        .map(([k, v]) => [k, Array.isArray(v) ? v.join(" ") : String(v)])
    );
  }
}

function extractMessage(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (data.non_field_errors) return data.non_field_errors.join(" ");
  const first = Object.values(data)[0];
  return Array.isArray(first) ? first.join(" ") : typeof first === "string" ? first : "";
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

export async function request(path, { method = "GET", body, auth = true, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Token ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method, headers, signal, body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth && token) onUnauthorized();
    throw new ApiError(res.status, data);
  }
  return data;
}

const post = (path, body) => request(path, { method: "POST", body });

export const api = {
  // auth
  login: (body) => request("/auth/login/", { method: "POST", body, auth: false }),
  register: (body) => request("/auth/register/", { method: "POST", body, auth: false }),
  logout: () => post("/auth/logout/"),
  me: () => request("/auth/me/"),
  // public
  menu: () => request("/menu/", { auth: false }),
  info: () => request("/info/", { auth: false }),
  availability: (date) => request(`/availability/?date=${date}`, { auth: false }),
  feedback: (body) => post("/feedback/", body),
  // customer
  placeOrder: (body) => post("/orders/", body),
  myOrders: () => request("/orders/"),
  order: (id) => request(`/orders/${id}/`),
  cancelOrder: (id) => post(`/orders/${id}/cancel/`),
  book: (body) => post("/bookings/", body),
  myBookings: () => request("/bookings/"),
  cancelBooking: (id) => post(`/bookings/${id}/cancel/`),
  // staff
  staffStats: () => request("/staff/stats/"),
  staffOrders: (status = "open") => request(`/staff/orders/?status=${status}`),
  setOrderStatus: (id, status) => post(`/staff/orders/${id}/status/`, { status }),
  staffBookings: (date) => request(`/staff/bookings/?date=${date}`),
  setBookingStatus: (id, status) => post(`/staff/bookings/${id}/status/`, { status }),
  staffMenu: () => request("/staff/menu/"),
  createMenuItem: (body) => post("/staff/menu/", body),
  updateMenuItem: (id, body) => request(`/staff/menu/${id}/`, { method: "PATCH", body }),
  deleteMenuItem: (id) => request(`/staff/menu/${id}/`, { method: "DELETE" }),
  staffFeedback: () => request("/staff/feedback/"),
};

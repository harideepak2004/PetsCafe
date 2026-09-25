import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import About from "./pages/About";
import { Login, Register } from "./pages/Auth";
import Book from "./pages/Book";
import Checkout from "./pages/Checkout";
import Feedback from "./pages/Feedback";
import Home from "./pages/Home";
import MenuPage from "./pages/MenuPage";
import MyBookings from "./pages/MyBookings";
import MyOrders from "./pages/MyOrders";
import NotFound from "./pages/NotFound";
import Staff from "./pages/staff/Staff";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/book" element={<Book />} />
        <Route path="/about" element={<About />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/bookings" element={<MyBookings />} />
        </Route>
        <Route element={<ProtectedRoute staff />}>
          <Route path="/staff" element={<Staff />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

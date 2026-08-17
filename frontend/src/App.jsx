import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/customer/HomePage';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import ContactPage from './pages/customer/ContactPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/layout/ProtectedRoute';

const AppLayout = () => {
  const location = useLocation();
  const isBookingsDashboard = location.pathname === '/my-bookings';
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
        <div className={`min-h-screen bg-[#F8FAF9] text-gray-900 flex flex-col justify-between font-['Kanit',sans-serif] ${isBookingsDashboard || isAdminPage ? 'overflow-x-hidden' : ''}`}>
          {/* แถบเมนูส่วนหัว 100% ตรงตามภาพตัวอย่าง Design Theme */}
          <Navbar />

          {/* ส่วนเนื้อหาหลักและ Routing */}
          <main className={isBookingsDashboard || isAdminPage ? 'w-full flex-1' : 'mx-auto w-full max-w-7xl flex-1 p-3 sm:p-4 lg:p-5'}>
            <Routes>
              {/* หน้าแรก (HomePage 100% Match Page-Home.png) */}
              <Route path="/" element={<HomePage />} />

              {/* หน้า Login และ Register */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <RegisterPage />
                  </GuestRoute>
                }
              />

              {/* หน้ารายการสนาม */}
              <Route path="/courts" element={<HomePage />} />

              {/* หน้าของสมาชิก (Protected Route) */}
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookingsPage />
                  </ProtectedRoute>
                }
              />

              {/* หน้าสำหรับแอดมินเท่านั้น (Admin Route) */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              {/* หน้าติดต่อเรา และเส้นทางเดิมสำหรับลิงก์เก่า */}
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<ContactPage />} />

              {/* หน้า 404 */}
              <Route
                path="*"
                element={
                  <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-xs my-8 text-center">
                    <h2 className="text-4xl font-bold text-[#0B5D2D] mb-2">404</h2>
                    <p className="text-gray-600 mb-6">ไม่พบหน้าที่คุณต้องการ</p>
                    <Link to="/" className="bg-[#0B5D2D] text-white px-6 py-2.5 rounded-xl font-medium">
                      กลับหน้าแรก
                    </Link>
                  </div>
                }
              />
            </Routes>
          </main>

          {/* ฟุตเตอร์ส่วนท้าย (ตรงตามภาพ Page-Home.png 100%) */}
          {!isBookingsDashboard && !isAdminPage && <Footer />}
        </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;

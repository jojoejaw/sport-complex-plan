import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/customer/HomePage';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/layout/ProtectedRoute';
import { Phone, MapPin } from 'lucide-react';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <div className="min-h-screen bg-[#F8FAF9] text-gray-900 flex flex-col justify-between font-['Kanit',sans-serif]">
          {/* แถบเมนูส่วนหัว 100% ตรงตามภาพตัวอย่าง Design Theme */}
          <Navbar />

          {/* ส่วนเนื้อหาหลักและ Routing */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-5">
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
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs my-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">ประวัติการจองของฉัน</h2>
                      <p className="text-gray-600">ยินดีต้อนรับ! หน้านี้สำหรับดูรายการจองสนามของคุณ</p>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* หน้าสำหรับแอดมินเท่านั้น (Admin Route) */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <div className="bg-white rounded-2xl p-8 border border-amber-200 bg-amber-50/20 shadow-xs my-8">
                      <h2 className="text-2xl font-bold text-amber-900 mb-2">แดชบอร์ดแอดมิน (Admin Dashboard)</h2>
                      <p className="text-amber-800">หน้านี้สำหรับแอดมินตรวจสลิป อนุมัติการจอง และจัดการสนาม</p>
                    </div>
                  </AdminRoute>
                }
              />

              {/* หน้าเกี่ยวกับเรา */}
              <Route
                path="/about"
                element={
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs my-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">เกี่ยวกับเรา</h2>
                    <p className="text-gray-600">SPORT COMPLEX ให้บริการสนามฟุตบอล บาสเกตบอล แบดมินตัน และวอลเลย์บอลมาตรฐาน</p>
                  </div>
                }
              />

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
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

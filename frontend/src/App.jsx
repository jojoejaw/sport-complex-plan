import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/layout/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <div className="min-h-screen bg-[#F8FAF9] text-gray-900 flex flex-col justify-between font-['Kanit',sans-serif]">
          {/* แถบเมนูส่วนหัว 100% ตรงตามภาพตัวอย่าง Design Theme */}
          <Navbar />

          {/* ส่วนเนื้อหาหลักและ Routing */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <Routes>
              {/* 1. หน้าแรก (ทุกคนเข้าได้) */}
              <Route
                path="/"
                element={
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs text-center my-8">
                    <div className="w-16 h-16 bg-[#ECFDF5] text-[#0B5D2D] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                      ⚽
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 font-['Kanit',sans-serif]">
                      ยินดีต้อนรับสู่ <span className="text-[#0B5D2D]">SPORT COMPLEX</span>
                    </h1>
                    <p className="text-gray-600 max-w-xl mx-auto mb-6">
                      ระบบจองสนามกีฬาออนไลน์ จ่ายสะดวก รวดเร็ว พร้อมตารางเช็คเวลาว่างแบบ Real-time
                    </p>
                    <div className="flex justify-center gap-4">
                      <Link to="/courts" className="bg-[#0B5D2D] text-white px-6 py-3 rounded-xl font-medium shadow-md hover:bg-[#064E26] transition-all">
                        จองสนามทันที ➔
                      </Link>
                    </div>
                  </div>
                }
              />

              {/* 2. หน้า Login และ Register (หุ้มด้วย GuestRoute: ถ้าล็อกอินแล้วจะเด้งไปหน้าแรก) */}
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

              {/* 3. หน้าของสมาชิก (หุ้มด้วย ProtectedRoute: ต้องล็อกอินก่อนเท่านั้น) */}
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs my-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">ประวัติการจองของฉัน</h2>
                      <p className="text-gray-600">ยินดีต้อนรับ! หน้านี้สำหรับดูรายการจองสนามของคุณ ( Protected Route สำเร็จแล้ว )</p>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* 4. หน้าสำหรับแอดมินเท่านั้น (หุ้มด้วย AdminRoute: ต้องเป็น Role Admin เท่านั้น) */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <div className="bg-white rounded-2xl p-8 border border-amber-200 bg-amber-50/20 shadow-xs my-8">
                      <h2 className="text-2xl font-bold text-amber-900 mb-2">แดชบอร์ดแอดมิน (Admin Dashboard)</h2>
                      <p className="text-amber-800">หน้านี้สำหรับแอดมินตรวจสลิป อนุมัติการจอง และจัดการสนาม ( Admin Route สำเร็จแล้ว )</p>
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

              {/* หน้าไม่พบ (404 Page) */}
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

          {/* ฟุตเตอร์ส่วนท้าย */}
          <footer className="bg-white border-t border-gray-100 py-6 text-center text-sm text-gray-500 font-['Kanit',sans-serif]">
            © 2026 SPORT COMPLEX. All rights reserved.
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

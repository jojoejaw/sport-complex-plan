import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/authContextStore';
import toast from 'react-hot-toast';

// 1. Loading Spinner Component ขณะที่กำลังตรวจสอบ Token
const FullScreenLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
    <div className="w-10 h-10 border-4 border-[#0B5D2D] border-t-transparent rounded-full animate-spin"></div>
    <p className="text-gray-500 font-medium text-sm font-['Kanit',sans-serif]">กำลังตรวจสอบสิทธิ์การใช้งาน...</p>
  </div>
);

// 2. ProtectedRoute: ป้องกันหน้าของสมาชิก (ต้องล็อกอินก่อนเท่านั้น)
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    toast.error('กรุณาเข้าสู่ระบบก่อนทำรายการจอง', { id: 'auth-required' });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

// 3. AdminRoute: ป้องกันหน้าของแอดมิน (ต้องล็อกอินและเป็น Role 'admin' เท่านั้น)
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    toast.error('กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน', { id: 'admin-required' });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (สำหรับแอดมินเท่านั้น)', { id: 'admin-only' });
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

// 4. GuestRoute: ป้องกันหน้า Login / Register (ถ้าล็อกอินอยู่แล้ว จะเด้งไปหน้าแรก)
export const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;

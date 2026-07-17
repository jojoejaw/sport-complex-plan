import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBookings from './pages/MyBookings';
import Booking from './pages/Booking';
import Admin from './pages/Admin';

// ส่วนครอบป้องกัน Route สำหรับ Admin เท่านั้น
function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      {/* แถบนำทางด้านบนจะอยู่คงที่ในทุกๆ หน้าจอ */}
      <Navbar />

      {/* สลับหน้าตามเส้นทาง URL */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        
        {/* เส้นทางสำหรับแอดมิน (ป้องกันด้วย AdminRoute) */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
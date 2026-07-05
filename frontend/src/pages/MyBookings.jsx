import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, DollarSign, FileText, Upload, Trash2, ShieldAlert, Award, Image } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../api';

export default function MyBookings() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // --- States ---
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State คุมการแชร์เวลาปัจจุบันสำหรับทำตัวจับเวลาถอยหลัง (Timer)
  const [now, setNow] = useState(new Date());
  
  // State เก็บไฟล์สลิปของแต่ละใบจองชั่วคราว { [bookingId]: File }
  const [selectedFiles, setSelectedFiles] = useState({});
  const [isUploading, setIsUploading] = useState({}); // { [bookingId]: boolean }
  const [visibleQrId, setVisibleQrId] = useState(null); // ไอดีของใบเสนอจองที่แสดง QR Code อยู่ขณะนั้น

  // รีเฟรชตัวนับเวลาถอยหลังทุกๆ 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ดึงรายการประวัติการจองจากหลังบ้าน
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data || []);
    } catch (error) {
      console.error('Error fetching my bookings:', error);
      if (error.response?.status === 401) {
        // หากสิทธิ์ยืนยันตัวตนหมดอายุ ให้พาลูกค้าล็อกเอาต์
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [token]);

  // ฟังก์ชันคำนวณเวลาถอยหลัง 15 นาทีของตั๋วที่จองใหม่
  const getCountdownText = (createdAt) => {
    const createdTime = new Date(createdAt);
    const expireTime = new Date(createdTime.getTime() + 15 * 60 * 1000); // บวกเพิ่ม 15 นาที
    const diff = expireTime - now;

    if (diff <= 0) {
      return { text: 'หมดอายุการล็อกสนาม', isExpired: true };
    }

    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return {
      text: `โปรดชำระเงินใน ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} นาที`,
      isExpired: false
    };
  };

  // ดักจับการเลือกไฟล์สลิปธนาคาร
  const handleFileChange = (bookingId, e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFiles(prev => ({
        ...prev,
        [bookingId]: file
      }));
    }
  };

  // ฟังก์ชันกดยกเลิกการจองสนาม (Cancel Booking)
  const handleCancelBooking = async (bookingId) => {
    Swal.fire({
      title: 'ต้องการยกเลิกการจองใช่ไหม?',
      text: 'การยกเลิกจะไม่สามารถกู้คืนรายการได้ และจะทำการปล่อยเวลาสนามนี้ให้ผู้อื่นทันที',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ยกเลิกการจอง',
      cancelButtonText: 'ปิด'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.put(`/bookings/${bookingId}/cancel`);
          Swal.fire({
            icon: 'success',
            title: 'ยกเลิกรายการจองสำเร็จ!',
            text: 'ระบบทำการคืนสล็อตและยกเลิกใบเสนอราคาเรียบร้อยแล้ว',
            confirmButtonColor: '#10b981'
          });
          fetchBookings(); // รีโหลดข้อมูลใหม่
        } catch (error) {
          const errMsg = error.response?.data?.message || 'ไม่สามารถยกเลิกได้ในขณะนี้';
          Swal.fire({
            icon: 'error',
            title: 'ผิดพลาด',
            text: errMsg,
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  // ฟังก์ชันอัปโหลดไฟล์รูปภาพสลิปชำระเงินโอน (Upload Slip)
  const handleUploadSubmit = async (bookingId) => {
    const file = selectedFiles[bookingId];
    if (!file) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่พบไฟล์สลิป',
        text: 'กรุณาเลือกไฟล์รูปภาพหลักฐานการโอนเงินก่อนคลิกอัปโหลด',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    setIsUploading(prev => ({ ...prev, [bookingId]: true }));

    try {
      // เตรียมข้อมูล multipart/form-data
      const formData = new FormData();
      formData.append('booking_id', bookingId);
      formData.append('slip', file); // แนบไฟล์สลิป

      const response = await api.post('/payments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // แจ้งป๊อปอัพสีเขียว
      Swal.fire({
        icon: 'success',
        title: 'อัปโหลดสลิปสำเร็จ!',
        text: response.data.message || 'ส่งหลักฐานให้ระบบแสกนเรียบร้อยแล้ว รอระบบยืนยันสิทธิ์',
        confirmButtonColor: '#10b981'
      });

      // ล้างไฟล์ที่เลือกค้างไว้
      setSelectedFiles(prev => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });

      fetchBookings(); // ดึงข้อมูลรายการใหม่

    } catch (error) {
      console.error('Upload slip error:', error);
      const errorMsg = error.response?.data?.message || 'ระบบตรวจสลิปไม่ผ่านหรือรูปไฟล์ไม่ถูกต้อง กรุณาอัปโหลดรูปใหม่อีกครั้ง';
      Swal.fire({
        icon: 'error',
        title: 'ตรวจสอบสลิปไม่ผ่าน',
        text: errorMsg,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsUploading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  // ฟังก์ชันช่วยเหลือระบุคำและสีของ Badge สถานะการจอง
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_payment':
        return { label: 'รอชำระเงิน', color: 'status-pending-pay' };
      case 'pending_approval':
        return { label: 'รออนุมัติสลิป', color: 'status-pending-approve' };
      case 'approved':
        return { label: 'จองสำเร็จ', color: 'status-approved' };
      case 'rejected':
        return { label: 'สลิปไม่ถูกต้อง (โปรดอัปโหลดใหม่)', color: 'status-rejected' };
      case 'cancelled':
        return { label: 'ยกเลิกแล้ว', color: 'status-cancelled' };
      default:
        return { label: status, color: 'status-generic' };
    }
  };

  // ฟังก์ชันแปลงรูปแบบวันที่เข้าเล่นให้อ่านง่ายขึ้น (Thai Date Format)
  const formatThaiDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', options);
  };

  return (
    <div className="bookings-page-container container">
      {/* ส่วนหัวหน้าจอ */}
      <div className="bookings-header">
        <h2>ประวัติการจองของฉัน</h2>
        <p>ตรวจสอบรายละเอียดรายการจองสนาม แนบสลิปชำระเงินโอน หรือยกเลิกการจองได้ที่นี่</p>
      </div>

      {isLoading ? (
        <div className="loading-wrapper" style={{ padding: '80px 20px' }}>
          <Clock className="loading-spinner" size={40} />
          <p>กำลังดึงข้อมูลประวัติการจองของคุณ...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-bookings-card">
          <ShieldAlert size={48} className="empty-icon" />
          <h3>คุณยังไม่มีรายการจองสนามใดๆ ในระบบ</h3>
          <p>มาฟิตร่างกายเพื่อไปออกกำลังกายกับเพื่อนๆ ค้นหาสนามและเวลากีฬาที่เปิดให้บริการได้เลย!</p>
          <Link to="/booking" className="btn btn-primary">
            ค้นหาสนามและจองทันที
          </Link>
        </div>
      ) : (
        <div className="bookings-list-grid">
          {bookings.map((booking) => {
            const statusDetail = getStatusBadge(booking.status);
            const countdown = getCountdownText(booking.created_at);
            const fileSelected = selectedFiles[booking.id];
            const isUploadBtnDisabled = isUploading[booking.id] || !fileSelected;

            // บ่งบอกสัญลักษณ์ประเภทกีฬา
            const getSportEmoji = (sportName) => {
              if (sportName.includes('บอล') || sportName.includes('Football')) return '⚽';
              if (sportName.includes('บาส') || sportName.includes('Basketball')) return '🏀';
              if (sportName.includes('มิน') || sportName.includes('Badminton')) return '🏸';
              if (sportName.includes('เลย์') || sportName.includes('Volleyball')) return '🏐';
              return '🏆';
            };

            return (
              <div key={booking.id} className="booking-card-item">
                
                {/* 1. ส่วนหัวการ์ดใบเสนอจอง */}
                <div className="booking-card-header">
                  <span className="booking-id-text">
                    <FileText size={16} />
                    <span>รหัสใบจอง #{booking.id}</span>
                  </span>
                  <span className={`booking-status-tag ${statusDetail.color}`}>
                    {statusDetail.label}
                  </span>
                </div>

                {/* 2. เนื้อหาข้อมูลรายละเอียดสนาม */}
                <div className="booking-card-body">
                  <div className="booking-court-name">
                    <span className="sport-emoji-large">{getSportEmoji(booking.sport_name)}</span>
                    <div className="court-details">
                      <h4>{booking.court_name}</h4>
                      <span>ประเภทกีฬา: {booking.sport_name}</span>
                    </div>
                  </div>

                  <div className="booking-details-grid">
                    <div className="detail-item">
                      <Calendar size={15} />
                      <span>วันที่เข้าเล่น: {formatThaiDate(booking.booking_date)}</span>
                    </div>
                    <div className="detail-item">
                      <Clock size={15} />
                      <span>
                        เวลาที่เข้าเล่น: {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)} น.
                      </span>
                    </div>
                    <div className="detail-item">
                      <DollarSign size={15} className="text-emerald" />
                      <span>
                        ราคารวมค่าบริการ: <strong className="text-emerald">{parseFloat(booking.total_price).toLocaleString()} บาท</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. ส่วนควบคุมการอัปโหลดสลิปและการยกเลิก */}
                <div className="booking-card-actions">
                  
                  {/* กรณีที่ 1: สถานะรอชำระเงิน (pending_payment) หรือ ถูกปฏิเสธสลิป (rejected) */}
                  {(booking.status === 'pending_payment' || booking.status === 'rejected') && (
                    <div className="action-upload-section">
                      
                      {/* แถบตัวนับเวลาถอยหลัง 15 นาที */}
                      {!countdown.isExpired ? (
                        <div className="countdown-alert-box">
                          <Clock size={14} className="spinner-clock" />
                          <span>{countdown.text}</span>
                        </div>
                      ) : (
                        <div className="countdown-alert-box expired">
                          <ShieldAlert size={14} />
                          <span>หมดเวลาชำระเงิน ระบบกำลังปลดล็อกสนาม</span>
                        </div>
                      )}

                      {/* ข้อมูลการสแกนจ่ายเงินโอนพร้อมเพย์ */}
                      {!countdown.isExpired && (
                        <div className="mybookings-payment-info-area">
                          <button
                            type="button"
                            className="btn-toggle-qr-help"
                            onClick={() => setVisibleQrId(visibleQrId === booking.id ? null : booking.id)}
                          >
                            {visibleQrId === booking.id ? '🙈 ซ่อนคิวอาร์โค้ดชำระเงิน' : '💳 แสดงเลขบัญชี / QR Code สแกนจ่าย'}
                          </button>

                          {visibleQrId === booking.id && (
                            <div className="mybookings-qr-dropdown-box">
                              <p className="qr-pay-instruction">
                                โอนเงินยอด <strong>{parseFloat(booking.total_price).toLocaleString()} บาท</strong> ไปยังพร้อมเพย์:
                              </p>
                              <div className="promptpay-mini-details">
                                <p style={{ color: '#ef4444', fontWeight: '600', margin: '0 0 6px 0' }}>
                                  ⚠️ กรุณาโอนเงินผ่านระบบพร้อมเพย์ (PromptPay) เท่านั้นเพื่อแสกนผ่าน
                                </p>
                                <p><strong>ชื่อบัญชี:</strong> ณรงฤทธิ์ โจทจันทร์</p>
                                <p><strong>พร้อมเพย์ (PromptPay):</strong> <span className="copyable-text">090-221-4698</span></p>
                              </div>
                              <div className="mybookings-qr-image-wrapper">
                                <img
                                  src={`https://promptpay.io/0902214698/${parseFloat(booking.total_price)}.png`}
                                  alt="PromptPay QR Code"
                                  className="promptpay-qr-mini"
                                />
                                <span className="qr-caption-text">
                                  สแกนคิวอาร์โค้ดยอด {parseFloat(booking.total_price).toLocaleString()} บาท
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ช่องอัปโหลดไฟล์รูปภาพสลิป */}
                      <div className="slip-upload-control">
                        <label className="btn-file-select">
                          <Upload size={15} />
                          <span>{fileSelected ? fileSelected.name : 'เลือกรูปภาพสลิปโอนเงิน'}</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => handleFileChange(booking.id, e)}
                            disabled={isUploading[booking.id] || countdown.isExpired}
                          />
                        </label>

                        <button
                          onClick={() => handleUploadSubmit(booking.id)}
                          className="btn btn-primary btn-upload-submit"
                          disabled={isUploadBtnDisabled || countdown.isExpired}
                        >
                          {isUploading[booking.id] ? 'กำลังแสกน...' : 'แสกนและส่งสลิป'}
                        </button>
                      </div>

                      {/* แสดงข้อความเตือนหากอัปโหลดสลิปพัง (Rejected) */}
                      {booking.status === 'rejected' && (
                        <div className="reject-reason-alert">
                          ⚠️ หลักฐานก่อนหน้าถูกปฏิเสธเนื่องจากสลิปโอนเงินซ้ำ หรือยอดเงินโอนไม่ตรง โปรดแนบหลักฐานชำระเงินจริงที่ถูกต้องใหม่อีกครั้ง
                        </div>
                      )}
                    </div>
                  )}

                  {/* กรณีที่ 2: รอแอดมินอนุมัติสลิป (pending_approval) */}
                  {booking.status === 'pending_approval' && (
                    <div className="action-success-pending">
                      <div className="alert-approval-waiting">
                        <Clock size={16} />
                        <span>ระบบแสกนสลิปผ่านแล้ว กำลังรอแอดมินตรวจสอบความถูกต้องสุดท้ายในระบบอีกครั้ง</span>
                      </div>
                      
                      {/* ปุ่มขยายดูรูปสลิปที่แนบไป */}
                      {booking.slip_image_path && (
                        <a
                          href={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/${booking.slip_image_path}` : `http://localhost:5000/${booking.slip_image_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-light view-slip-btn"
                        >
                          <Image size={15} />
                          <span>เปิดดูภาพหลักฐานสลิปโอน</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* กรณีที่ 3: จองสำเร็จลุล่วง (approved) */}
                  {booking.status === 'approved' && (
                    <div className="action-success-approved">
                      <div className="alert-approved-box">
                        <Award size={18} />
                        <span>จองสนามฟุตบอล/กีฬาสำเร็จ! กรุณาเตรียมสวมชุดกีฬาไปยื่นยืนยันตัวตนที่เคาน์เตอร์บริการตามวันเวลาที่กำหนดได้เลยครับ</span>
                      </div>
                    </div>
                  )}

                  {/* ปุ่มยกเลิกจอง: อนุญาตให้ยกเลิกได้เฉพาะเมื่อยังไม่ได้อนุมัติเท่านั้น */}
                  {['pending_payment', 'rejected'].includes(booking.status) && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="btn-cancel-action"
                      disabled={isUploading[booking.id]}
                    >
                      <Trash2 size={15} />
                      <span>ยกเลิกใบจองสนาม</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

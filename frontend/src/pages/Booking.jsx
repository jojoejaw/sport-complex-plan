import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Phone, AlertCircle, ShieldCheck, Upload, Image, ArrowLeft, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../api';

export default function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // ตรวจจับ Query Parameter (?court_id=...) จากหน้าแรก
  const urlCourtId = searchParams.get('court_id');

  // ดึงวันปัจจุบันสำหรับเป็นวันเริ่มต้นจอง (Format YYYY-MM-DD)
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ดึง Token ตรวจเช็คสถานะการเข้าสู่ระบบ
  const token = localStorage.getItem('token');

  // --- States ของฟังก์ชันจอง ---
  const [courts, setCourts] = useState([]); // รายชื่อสนามทั้งหมด
  const [selectedCourtId, setSelectedCourtId] = useState(urlCourtId || ''); // สนามที่เลือก
  const [selectedDate, setSelectedDate] = useState(getTodayString()); // วันที่ต้องการจอง
  const [slots, setSlots] = useState([]); // สล็อตเวลาที่ว่างดึงมาจาก API
  const [selectedSlots, setSelectedSlots] = useState([]); // สล็อตที่ผู้ใช้จิ้มเลือกไว้
  const [contactPhone, setContactPhone] = useState(''); // เบอร์โทรศัพท์ลูกค้า
  
  // States จัดการการโหลดข้อมูล
  const [isLoadingCourts, setIsLoadingCourts] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- States สำหรับการดำเนินการชำระเงินแบบทันที (Instant Checkout) ---
  const [createdBooking, setCreatedBooking] = useState(null); // บันทึกข้อมูลใบจองเมื่อกดยืนยันแล้ว
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(900); // ตัวจับเวลาถอยหลัง (15 นาที = 900 วินาที)
  const [selectedSlipFile, setSelectedSlipFile] = useState(null); // ไฟล์รูปสลิปโอนเงิน
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);

  // ดึงรายชื่อสนามทั้งหมดตอนหน้าเว็บโหลด
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setIsLoadingCourts(true);
        const res = await api.get('/courts');
        const activeCourts = res.data.filter(c => c.status === 'active');
        setCourts(activeCourts);
        
        // หากส่ง court_id มาทาง URL และสนามนั้นยังเปิดบริการอยู่ ให้เซ็ตค่าเริ่มต้น
        if (urlCourtId && activeCourts.some(c => c.id === parseInt(urlCourtId))) {
          setSelectedCourtId(urlCourtId);
        } else if (activeCourts.length > 0) {
          setSelectedCourtId(activeCourts[0].id.toString());
        }
      } catch (error) {
        console.error('Error fetching courts:', error);
      } finally {
        setIsLoadingCourts(false);
      }
    };

    fetchCourts();
  }, [urlCourtId]);

  // ดึงตารางความว่างของสนาม (Availability) เมื่อเลือกสนามหรือเปลี่ยนวันที่จอง
  useEffect(() => {
    if (!selectedCourtId || !selectedDate) return;

    const fetchAvailability = async () => {
      try {
        setIsLoadingSlots(true);
        setSelectedSlots([]); // รีเซ็ตการเลือกสล็อตเก่าออกเมื่อสลับวัน/สนาม
        
        const res = await api.get(`/bookings/availability?court_id=${selectedCourtId}&date=${selectedDate}`);
        
        if (res.data.court_status === 'maintenance') {
          setSlots([]);
          Swal.fire({
            icon: 'warning',
            title: 'สนามปิดปรับปรุง',
            text: 'สนามที่คุณเลือกอยู่ในระหว่างบำรุงรักษาชั่วคราว กรุณาเลือกสนามอื่น',
            confirmButtonColor: '#fbbf24'
          });
        } else {
          setSlots(res.data.slots || []);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [selectedCourtId, selectedDate]);

  // ตัวนับเวลาถอยหลัง 15 นาทีสำหรับหน้ารวมการชำระเงินทันที
  useEffect(() => {
    if (!createdBooking) return;

    const timer = setInterval(() => {
      setPaymentTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [createdBooking]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} นาที`;
  };

  // ค้นหารายละเอียดสนามปัจจุบันที่เลือกอยู่
  const currentCourt = courts.find(c => c.id === parseInt(selectedCourtId));

  // ตรรกะการจิ้มเลือกสล็อตเวลา (จำกัด 3 ชั่วโมงติดต่อกัน)
  const handleSlotClick = (clickedSlot) => {
    if (clickedSlot.status !== 'available') return;

    const clickedStart = parseInt(clickedSlot.start_time.split(':')[0]);

    if (selectedSlots.length === 0) {
      setSelectedSlots([clickedSlot]);
      return;
    }

    const selectedHours = selectedSlots.map(s => parseInt(s.start_time.split(':')[0])).sort((a, b) => a - b);
    const minSelected = selectedHours[0];
    const maxSelected = selectedHours[selectedHours.length - 1];

    if (selectedSlots.some(s => s.start_time === clickedSlot.start_time)) {
      const newSelection = selectedSlots.filter(s => s.start_time !== clickedSlot.start_time);
      const remainingHours = newSelection.map(s => parseInt(s.start_time.split(':')[0])).sort((a, b) => a - b);
      let isConsecutive = true;
      for (let i = 0; i < remainingHours.length - 1; i++) {
        if (remainingHours[i + 1] - remainingHours[i] !== 1) {
          isConsecutive = false;
          break;
        }
      }
      if (isConsecutive) {
        setSelectedSlots(newSelection);
      } else {
        setSelectedSlots([clickedSlot]);
      }
      return;
    }

    const isAdjacent = clickedStart === minSelected - 1 || clickedStart === maxSelected + 1;
    const willExceedLimit = selectedSlots.length >= 3;

    if (isAdjacent && !willExceedLimit) {
      const newSelection = [...selectedSlots, clickedSlot].sort((a, b) => {
        return parseInt(a.start_time.split(':')[0]) - parseInt(b.start_time.split(':')[0]);
      });
      setSelectedSlots(newSelection);
    } else {
      setSelectedSlots([clickedSlot]);
    }
  };

  const totalHours = selectedSlots.length;
  const totalPrice = currentCourt ? currentCourt.price_per_hour * totalHours : 0;

  const getSelectedTimeRange = () => {
    if (selectedSlots.length === 0) return { start: '', end: '' };
    const sorted = [...selectedSlots].sort((a, b) => parseInt(a.start_time.split(':')[0]) - parseInt(b.start_time.split(':')[0]));
    return {
      start: sorted[0].start_time,
      end: sorted[sorted.length - 1].end_time
    };
  };

  // ขั้นตอนส่งคำขอสร้างใบจองเพื่อเตรียมล็อกสนาม 15 นาที
  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      Swal.fire({
        icon: 'info',
        title: 'จำเป็นต้องเข้าสู่ระบบ',
        text: 'กรุณาเข้าสู่ระบบก่อนทำการจองสนามกีฬาทุกครั้งครับ',
        confirmButtonText: 'ไปหน้าเข้าสู่ระบบ',
        confirmButtonColor: '#10b981',
        showCancelButton: true,
        cancelButtonText: 'ยกเลิก'
      }).then((result) => {
        if (result.isConfirmed) navigate('/login');
      });
      return;
    }

    if (selectedSlots.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกช่วงเวลา',
        text: 'โปรดเลือกชั่วโมงที่คุณต้องการเข้าเล่นอย่างน้อย 1 ชั่วโมงในตารางเวลา',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    if (!contactPhone.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'ระบุเบอร์โทรศัพท์ติดต่อ',
        text: 'กรุณากรอกเบอร์โทรศัพท์จริงสำหรับการยืนยันการจอง',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const { start, end } = getSelectedTimeRange();
    setIsSubmitting(true);

    try {
      const response = await api.post('/bookings', {
        court_id: parseInt(selectedCourtId),
        booking_date: selectedDate,
        start_time: start,
        end_time: end,
        contact_phone: contactPhone.trim()
      });

      // สมัครสำเร็จ: ให้เซ็ตข้อมูลจองลง State เพื่อสลับหน้าแสดง UI ชำระเงินทันที!
      setCreatedBooking({
        id: response.data.bookingId,
        totalPrice: response.data.total_price,
        date: selectedDate,
        courtName: currentCourt.name,
        timeRange: { start, end },
        phone: contactPhone.trim()
      });
      
      setPaymentTimeLeft(900); // รีเซ็ตตัวนับถอยหลังเป็น 15 นาทีจริง
      setSelectedSlipFile(null); // เคลียร์ไฟล์รูปสลิปเก่า

      Swal.fire({
        icon: 'success',
        title: 'ล็อกสนามให้คุณเรียบร้อย!',
        text: 'ระบบล็อกสนามและห้องจองนี้ให้คุณแล้วเป็นเวลา 15 นาที โปรดดำเนินการชำระเงินโอนทันทีในหน้านี้',
        confirmButtonColor: '#10b981',
        timer: 3000
      });

    } catch (error) {
      console.error('Booking creation error:', error);
      const errorMessage = error.response?.data?.message || 'ไม่สามารถทำรายการจองได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';
      Swal.fire({
        icon: 'error',
        title: 'จองสนามไม่สำเร็จ',
        text: errorMessage,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ดักจับการอัปโหลดไฟล์สลิปของหน้าชำระเงินทันที
  const handleSlipChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedSlipFile(file);
  };

  // ฟังก์ชันยิงอัปโหลดและแสกนสลิปทันที
  const handleSlipUploadSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSlipFile) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่พบรูปภาพสลิป',
        text: 'กรุณาอัปโหลดไฟล์รูปภาพหลักฐานการโอนเงินเพื่อตรวจสลิป',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    setIsUploadingSlip(true);

    try {
      const formData = new FormData();
      formData.append('booking_id', createdBooking.id);
      formData.append('slip', selectedSlipFile);

      const response = await api.post('/payments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      Swal.fire({
        icon: 'success',
        title: 'ชำระเงินสำเร็จ!',
        text: response.data.message || 'ระบบตรวจสลิปโอนผ่านแล้ว รอแอดมินยืนยันผลชิ้นสุดท้าย คุณสามารถติดตามประวัติและรับบัตรเข้าเล่นได้ในหน้าประวัติ',
        confirmButtonColor: '#10b981'
      }).then(() => {
        // ย้ายลูกค้าไปที่หน้าประวัติการจองเพื่อติดตามผล
        navigate('/my-bookings');
      });

    } catch (error) {
      console.error('Instant Checkout slip upload error:', error);
      const errorMsg = error.response?.data?.message || 'ระบบตรวจสลิปไม่ผ่านหรือรูปไฟล์ไม่ถูกต้อง โปรดตรวจสอบรูปและข้อมูลปลายทางแล้วลองอีกครั้ง';
      Swal.fire({
        icon: 'error',
        title: 'ตรวจสอบสลิปไม่สำเร็จ',
        text: errorMsg,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const getSlotStatusClass = (status) => {
    switch (status) {
      case 'available': return 'slot-available';
      case 'unavailable': return 'slot-unavailable';
      case 'pending_approval': return 'slot-pending-approval';
      case 'locked': return 'slot-locked';
      default: return '';
    }
  };

  const getSlotStatusText = (status) => {
    switch (status) {
      case 'available': return 'ว่าง';
      case 'unavailable': return 'ไม่ว่าง';
      case 'pending_approval': return 'รออนุมัติสลิป';
      case 'locked': return 'ล็อกชำระเงิน (15น.)';
      default: return 'ไม่พร้อมใช้';
    }
  };

  // --- กรณีที่ 1: ผู้ใช้กดยืนยันแล้ว กำลังอยู่ในสถานะรอชำระเงินทันที (Instant Checkout View) ---
  if (createdBooking) {
    const isExpired = paymentTimeLeft <= 0;
    
    // สร้างลิงก์ QR Code แบบสแกน PromptPay แบบไดนามิก (EMVCo Standard) ตรงจาก API ของ promptpay.io
    const qrCodeUrl = `https://promptpay.io/0902214698/${createdBooking.totalPrice}.png`;

    return (
      <div className="booking-page-container container">
        <div className="checkout-card-wrapper">
          <div className="checkout-header">
            <h2>ดำเนินการชำระเงินทันที</h2>
            <p>กรุณาโอนเงินและแนบหลักฐานสลิปโอนเงินภายในเวลาที่กำหนดเพื่อยืนยันสิทธิ์ล็อกสนาม</p>
          </div>

          <div className="checkout-grid">
            {/* ฝั่งซ้าย: ข้อมูลใบเสนอราคาและคิวอาร์โค้ด */}
            <div className="checkout-info-card">
              <div className="checkout-timer-section">
                <Clock className="spinner-clock" size={20} />
                {!isExpired ? (
                  <span className="timer-text text-warning">
                    เวลาที่เหลือในการชำระเงิน: <strong>{formatCountdown(paymentTimeLeft)}</strong>
                  </span>
                ) : (
                  <span className="timer-text text-danger">
                    <strong>หมดอายุการล็อกสนาม</strong> (ใบจองนี้ถูกยกเลิกแล้ว)
                  </span>
                )}
              </div>

              <div className="booking-summary-details">
                <h4>รายละเอียดใบเสนอจอง #{createdBooking.id}</h4>
                <div className="details-list">
                  <div className="d-row"><span>สนาม:</span><strong>{createdBooking.courtName}</strong></div>
                  <div className="d-row"><span>วันที่เข้าเล่น:</span><strong>{createdBooking.date.split('-').reverse().join('/')}</strong></div>
                  <div className="d-row"><span>เวลาเข้าเล่น:</span><strong>{createdBooking.timeRange.start.substring(0, 5)} - {createdBooking.timeRange.end.substring(0, 5)} น.</strong></div>
                  <div className="d-row"><span>เบอร์ติดต่อ:</span><strong>{createdBooking.phone}</strong></div>
                  <div className="d-row highlight-price">
                    <span>ยอดโอนชำระเงิน:</span>
                    <strong className="text-emerald">{createdBooking.totalPrice.toLocaleString()} บาท</strong>
                  </div>
                </div>
              </div>

              {/* ข้อมูล QR Code พร้อมเพย์ */}
              <div className="promptpay-qr-section">
                <h5>สแกนชำระเงินผ่าน Mobile Banking</h5>
                <div className="qr-code-box">
                  {!isExpired ? (
                    <img src={qrCodeUrl} alt="PromptPay QR Code" className="qr-image" />
                  ) : (
                    <div className="qr-expired-placeholder">
                      <AlertCircle size={40} className="text-danger" />
                      <span>ตั๋วหมดอายุแล้ว</span>
                    </div>
                  )}
                </div>
                <div className="promptpay-text-details" style={{ width: '100%' }}>
                  <p style={{ color: '#ef4444', fontWeight: '600', fontSize: '13px', margin: '0 0 10px 0', textAlign: 'center' }}>
                    ⚠️ กรุณาโอนเงินผ่านระบบพร้อมเพย์ (PromptPay) เท่านั้น เพื่อระบบสแกนสลิปผ่านอัตโนมัติ
                  </p>
                  <p><strong>ชื่อบัญชี:</strong> ณรงฤทธิ์ โจทจันทร์</p>
                  <p><strong>พร้อมเพย์ (PromptPay):</strong> <span className="text-copy">090-221-4698</span></p>
                </div>
              </div>
            </div>

            {/* ฝั่งขวา: ช่องสำหรับอัปโหลดและสแกนสลิป */}
            <div className="checkout-upload-card">
              <h3>แนบหลักฐานชำระเงิน</h3>
              <p className="upload-subtitle">อัปโหลดสลิปโอนเงินจริงเพื่อให้ระบบอัจฉริยะตรวจแสกนยอดเงินทันที</p>

              <form onSubmit={handleSlipUploadSubmit} className="checkout-upload-form">
                <label className="checkout-file-select">
                  <Upload size={18} />
                  <span>{selectedSlipFile ? selectedSlipFile.name : 'คลิกเลือกรูปภาพสลิปโอนเงิน'}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    disabled={isUploadingSlip || isExpired}
                    onChange={handleSlipChange}
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="btn btn-primary btn-checkout-upload"
                  disabled={isUploadingSlip || !selectedSlipFile || isExpired}
                >
                  {isUploadingSlip ? 'กำลังตรวจแสกนหลักฐาน...' : 'แสกนและส่งสลิปชำระเงิน'}
                </button>

                <div className="checkout-navigation-options">
                  <button
                    type="button"
                    onClick={() => {
                      Swal.fire({
                        title: 'ชำระเงินภายหลัง?',
                        text: 'คุณสามารถไปดำเนินการชำระเงินต่อได้ที่หน้าประวัติการจองของฉันภายในระยะเวลา 15 นาทีที่ระบบล็อกไว้',
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonColor: '#10b981',
                        cancelButtonColor: '#94a3b8',
                        confirmButtonText: 'ไปหน้าประวัติจอง',
                        cancelButtonText: 'ยกเลิก'
                      }).then((result) => {
                        if (result.isConfirmed) navigate('/my-bookings');
                      });
                    }}
                    className="btn-pay-later"
                  >
                    ชำระเงินภายหลังที่หน้าประวัติการจอง
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreatedBooking(null)}
                    className="btn-go-back-booking"
                  >
                    <ArrowLeft size={14} />
                    <span>กลับไปจองสนามใหม่</span>
                  </button>
                </div>
              </form>

              <div className="booking-notice-card" style={{ marginTop: '24px' }}>
                <ShieldCheck size={18} className="notice-icon" />
                <div className="notice-text">
                  <strong>ข้อแนะนำการแสกนสลิป:</strong>
                  <p>กรุณาตรวจสอบให้แน่ใจว่ารูปภาพสลิปเห็นรหัส QR Code คมชัด และยอดโอนเงินตรงกับใบเสนอเสนอราคาจริง ระบบถึงจะอนุมัติใบเสนอได้รวดเร็วที่สุดครับ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- กรณีที่ 2: สถานะดั้งเดิม แสดงผลกริดเวลาสำหรับค้นหาและกดจองคิว ---
  return (
    <div className="booking-page-container container">
      {/* ส่วนหัวหน้าจอ */}
      <div className="booking-header">
        <h2>ค้นหาเวลาว่างและจองสนาม</h2>
        <p>ระบุสนามกีฬากับวันที่ต้องการเล่น และจิ้มเลือกสล็อตเวลาได้ตามใจชอบสูงสุด 3 ชั่วโมงติดต่อกัน</p>
      </div>

      <div className="booking-grid">
        {/* คอลัมน์ซ้าย: ฟอร์มเลือกสนาม / วันที่ และตารางเวลาสล็อต */}
        <div className="booking-form-card">
          
          {/* ส่วนตัวเลือกควบคุม (Controls) */}
          <div className="booking-controls">
            <div className="control-group">
              <label htmlFor="court-select">เลือกสนามที่ต้องการจอง</label>
              {isLoadingCourts ? (
                <div className="control-loading">กำลังดึงข้อมูลคอร์ทสนาม...</div>
              ) : (
                <select
                  id="court-select"
                  value={selectedCourtId}
                  onChange={(e) => setSelectedCourtId(e.target.value)}
                >
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name} ({parseFloat(court.price_per_hour).toLocaleString()} บาท/ชม.)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="control-group">
              <label htmlFor="date-select">ระบุวันที่เข้าเล่น</label>
              <div className="date-input-wrapper">
                <Calendar className="date-icon" size={18} />
                <input
                  type="date"
                  id="date-select"
                  value={selectedDate}
                  min={getTodayString()} // ล็อกไม่ให้เลือกวันย้อนหลัง
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* สัญลักษณ์แนะนำสีของสถานะเวลา (Color Legend) */}
          <div className="slots-legend">
            <div className="legend-item"><span className="legend-dot dot-available"></span> ว่าง</div>
            <div className="legend-item"><span className="legend-dot dot-locked"></span> อยู่ระหว่างโอนเงิน (15น.)</div>
            <div className="legend-item"><span className="legend-dot dot-pending"></span> รออนุมัติสลิป</div>
            <div className="legend-item"><span className="legend-dot dot-unavailable"></span> จองแล้ว</div>
          </div>

          {/* ตารางแสดงสล็อตเวลารายชั่วโมง (Slots Grid) */}
          <h3 className="section-title">
            <Clock size={18} />
            <span>ตารางความว่างสนามประจำวันที่ {selectedDate.split('-').reverse().join('/')}</span>
          </h3>

          {isLoadingSlots ? (
            <div className="slots-loading">
              <Clock className="spinner-clock" size={32} />
              <p>กำลังตรวจสอบเวลาสนามว่าง...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="slots-empty-notice">
              <AlertCircle size={28} />
              <p>ไม่พบช่วงเวลาเปิดให้บริการในขณะนี้ หรือสนามปิดปรับปรุง</p>
            </div>
          ) : (
            <div className="slots-selector-grid">
              {slots.map((slot) => {
                const isSelected = selectedSlots.some(s => s.start_time === slot.start_time);
                const isAvailable = slot.status === 'available';

                return (
                  <button
                    key={slot.start_time}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleSlotClick(slot)}
                    className={`time-slot-btn ${getSlotStatusClass(slot.status)} ${isSelected ? 'selected' : ''}`}
                  >
                    <span className="slot-time-text">{slot.label}</span>
                    <span className="slot-status-text">
                      {isSelected ? 'เลือกอยู่' : getSlotStatusText(slot.status)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* คอลัมน์ขวา: ใบสรุปรายการจองชำระเงิน (Invoice Card Summary) */}
        <div className="booking-summary-card">
          <h3>สรุปใบเสนอรายการจอง</h3>
          
          <div className="summary-list">
            <div className="summary-row">
              <span className="summary-label">สนามที่จอง:</span>
              <span className="summary-value text-bold">{currentCourt ? currentCourt.name : '-'}</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">วันที่เข้าเล่น:</span>
              <span className="summary-value">{selectedDate.split('-').reverse().join('/')}</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">ช่วงเวลาที่เลือก:</span>
              <span className="summary-value text-bold text-emerald">
                {selectedSlots.length > 0 
                  ? `${getSelectedTimeRange().start.substring(0, 5)} - ${getSelectedTimeRange().end.substring(0, 5)} น.`
                  : 'ยังไม่ได้เลือกเวลา'}
              </span>
            </div>

            <div className="summary-row">
              <span className="summary-label">จำนวนชั่วโมงรวม:</span>
              <span className="summary-value">{totalHours} ชั่วโมง</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row price-row">
              <span className="summary-label text-bold">ราคารวมทั้งสิ้น:</span>
              <span className="summary-value total-price-text">
                {totalPrice.toLocaleString()} บาท
              </span>
            </div>
          </div>

          {/* ฟอร์มการยืนยันเบอร์โทรศัพท์ */}
          <form onSubmit={handleBookingSubmit} className="booking-submit-form">
            <div className="form-group" style={{ gap: '6px' }}>
              <label htmlFor="contact-phone" className="text-bold" style={{ fontSize: '13px' }}>
                <Phone size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                <span>เบอร์โทรศัพท์ติดต่อสำหรับการจอง</span>
              </label>
              <input
                type="tel"
                id="contact-phone"
                placeholder="กรอกเบอร์โทร 10 หลัก (เช่น 0891234567)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value.replace(/[^0-9]/g, ''))} // รับเฉพาะตัวเลข
                maxLength={10}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* ปุ่มทำรายการยืนยัน */}
            {token ? (
              <button
                type="submit"
                className="btn btn-primary btn-confirm-booking"
                disabled={isSubmitting || selectedSlots.length === 0}
              >
                {isSubmitting ? 'กำลังส่งข้อมูลจองสนาม...' : 'ยืนยันจองสนาม (ล็อกเวลา 15 นาที)'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  Swal.fire({
                    icon: 'info',
                    title: 'จำเป็นต้องล็อกอิน',
                    text: 'กรุณาเข้าสู่ระบบก่อนเพื่อทำการจองและเข้าใช้บริการสนาม',
                    confirmButtonColor: '#10b981',
                    confirmButtonText: 'ไปหน้าเข้าสู่ระบบ',
                    showCancelButton: true,
                    cancelButtonText: 'ยกเลิก'
                  }).then((result) => {
                    if (result.isConfirmed) navigate('/login');
                  });
                }}
                className="btn btn-primary btn-confirm-booking btn-warning-login"
              >
                กรุณาเข้าสู่ระบบก่อนจองสนาม
              </button>
            )}
          </form>

          {/* ป้ายเตือนความปลอดภัย */}
          <div className="booking-notice-card">
            <ShieldCheck size={18} className="notice-icon" />
            <div className="notice-text">
              <strong>กฎระเบียบการล็อกสนาม:</strong>
              <p>ระบบจะช่วยล็อกสนามพรีเมียมให้คุณ 15 นาที โปรดชำระเงินโอนและแนบสลิปที่หน้าประวัติจอง หากชำระช้าเกินกำหนดรายการจองจะถูกปลดล็อกให้ผู้อื่นจองทันที</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

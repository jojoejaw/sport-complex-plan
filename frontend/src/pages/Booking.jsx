import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Phone, AlertCircle, ShieldCheck, Upload, ArrowLeft } from 'lucide-react';
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

  const getSportLabel = (sportId) => {
    switch (parseInt(sportId)) {
      case 1: return 'ฟุตบอล';
      case 2: return 'บาสเกตบอล';
      case 3: return 'แบดมินตัน';
      case 4: return 'วอลเลย์บอล';
      default: return 'กีฬา';
    }
  };

  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0]) + 543;
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${day} ${thaiMonths[month - 1]} ${year}`;
  };

  // --- กรณีที่ 1: ผู้ใช้กดยืนยันแล้ว กำลังอยู่ในสถานะรอชำระเงินทันที (Instant Checkout View) ---
  if (createdBooking) {
    const isExpired = paymentTimeLeft <= 0;

    // สร้างลิงก์ QR Code แบบสแกน PromptPay แบบไดนามิกตามจำนวนราคารวมจริงด้วย API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://promptpay.io/0891234567/${createdBooking.totalPrice}`;

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
              <div className={`checkout-timer-section ${!isExpired ? 'text-warning' : 'text-danger'}`}>
                <Clock className="spinner-clock" size={20} />
                {!isExpired ? (
                  <span className="timer-text">
                    เวลาที่เหลือในการชำระเงิน: <strong>{formatCountdown(paymentTimeLeft)}</strong>
                  </span>
                ) : (
                  <span className="timer-text">
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
                <div className="promptpay-text-details">
                  <p><strong>ชื่อบัญชี:</strong> บจก. สปอร์ตคอมเพล็กซ์ บุ๊คกิ้ง (Sport Complex Co., Ltd.)</p>
                  <p><strong>พร้อมเพย์ (PromptPay):</strong> <span className="text-copy">089-123-4567</span></p>
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

  return (
    <div className="booking-page-container container">
      {/* ส่วนหัวนำทางย้อนกลับและ Stepper ตามรูปต้นฉบับ */}
      <div className="booking-page-navigation-header">


        <div className="booking-page-header-row">
          <div className="header-title-box">
            <h1>จองสนามกีฬา</h1>
            <p>เลือกสนาม วันที่ และเวลาที่ต้องการ</p>
          </div>

          <div className="booking-stepper-progress">
            <div className="step-item active">
              <span className="step-number">1</span>
              <span className="step-label">เลือกสนามและเวลา</span>
            </div>
            <div className="step-line"></div>
            <div className="step-item">
              <span className="step-number">2</span>
              <span className="step-label">ตรวจสอบข้อมูล</span>
            </div>
            <div className="step-line"></div>
            <div className="step-item">
              <span className="step-number">3</span>
              <span className="step-label">ชำระเงิน</span>
            </div>
          </div>
        </div>
      </div>

      <div className="booking-grid">
        {/* คอลัมน์ซ้าย: ตัวเลือกสนาม / วันที่ / เบอร์โทร และตารางเวลากลีด */}
        <div className="booking-main-content-layout">

          {/* ส่วนตัวเลือกควบคุม (Controls) 3 คอลัมน์แถวเดี่ยวตามรูป */}
          <div className="booking-inputs-card">
            <div className="booking-inputs-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {/* เลือกสนาม */}
              <div className="input-group-premium">
                <label htmlFor="court-select" className="input-label-with-icon">
                  <span className="input-icon-wrapper-green">⚽</span>
                  <span>เลือกสนามกีฬา</span>
                </label>
                {isLoadingCourts ? (
                  <select id="court-select" disabled><option>กำลังดึงข้อมูล...</option></select>
                ) : (
                  <select
                    id="court-select"
                    value={selectedCourtId}
                    onChange={(e) => setSelectedCourtId(e.target.value)}
                  >
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* เลือกวันที่ */}
              <div className="input-group-premium">
                <label htmlFor="date-select" className="input-label-with-icon">
                  <span className="input-icon-wrapper-green">📅</span>
                  <span>เลือกวันที่</span>
                </label>
                <div className="input-wrapper" style={{ width: '100%', position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', pointerEvents: 'none' }} />
                  <input
                    type="date"
                    id="date-select"
                    value={selectedDate}
                    min={getTodayString()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>

              {/* เบอร์โทรศัพท์ติดต่อ */}
              <div className="input-group-premium">
                <label htmlFor="contact-phone" className="input-label-with-icon">
                  <span className="input-icon-wrapper-green">📞</span>
                  <span>เบอร์โทรติดต่อ</span>
                </label>
                <div className="input-wrapper" style={{ width: '100%', position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', pointerEvents: 'none' }} />
                  <input
                    type="tel"
                    id="contact-phone"
                    placeholder="กรอกเบอร์โทร (เช่น 0812345678)"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={10}
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
            </div>

            {/* แถบข้อมูลประกาศแถวขนานสามรายการ */}
            <div className="booking-info-row justify-space-between">
              <div className="info-item">เปิดบริการ 10:00 - 22:00 น.</div>
              <div className="info-divider"></div>
              <div className="info-item">จองล่วงหน้าได้เลย</div>
              <div className="info-divider"></div>
              <div className="info-item">จำกัดการจองสูงสุด 3 ชั่วโมง/ครั้ง</div>
            </div>
          </div>

          {/* ตารางสล็อตเวลาเลือกช่วงเวลา */}
          <div className="time-slots-card-premium">
            <div className="slots-card-header">
              <div className="slots-header-text">
                <h3>เลือกช่วงเวลา</h3>
                <p>คลิกเลือกช่วงเวลาที่ต้องการ (เลือกได้สูงสุด 3 ชั่วโมงติดต่อกัน)</p>
              </div>

              {/* Legend สีสถานะปุ่มตามแบบภาพ */}
              <div className="slots-legend-premium">
                <div className="legend-item"><span className="legend-color-dot dot-available"></span> ว่าง</div>
                <div className="legend-item"><span className="legend-color-dot dot-unavailable"></span> ไม่ว่าง</div>
                <div className="legend-item"><span className="legend-color-dot dot-pending"></span> กำลังจอง</div>
                <div className="legend-item"><span className="legend-color-dot dot-selected"></span> เลือกแล้ว</div>
              </div>
            </div>

            {isLoadingSlots ? (
              <div className="slots-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px' }}>
                <Clock className="spinner-clock" size={32} />
                <p style={{ fontSize: '14px', color: '#64748b' }}>กำลังตรวจสอบเวลาสนามว่าง...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="slots-empty-notice" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <AlertCircle size={28} style={{ margin: '0 auto 10px auto', display: 'block' }} />
                <p>ไม่พบช่วงเวลาเปิดให้บริการในขณะนี้ หรือสนามปิดปรับปรุง</p>
              </div>
            ) : (
              <>
                <div className="slots-grid-premium-layout">
                  {slots.map((slot) => {
                    const isSelected = selectedSlots.some(s => s.start_time === slot.start_time);
                    const isAvailable = slot.status === 'available';

                    return (
                      <button
                        key={slot.start_time}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleSlotClick(slot)}
                        className={`time-slot-btn-premium ${getSlotStatusClass(slot.status)} ${isSelected ? 'selected' : ''}`}
                      >
                        <span className="slot-time-text">{slot.label}</span>
                        <span className="slot-status-text">
                          {isSelected ? 'เลือกแล้ว' : getSlotStatusText(slot.status)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* กล่องคำแนะนำคำนวณสะสมช่วงเวลา */}
                {selectedSlots.length > 0 && (
                  <div className="selection-helper-alert">
                    <span className="alert-badge-icon">✔️</span>
                    <div className="helper-alert-text">
                      <strong>คุณเลือกช่วงเวลาได้ต่อเนื่อง {totalHours} ชั่วโมง</strong>
                      {totalHours < 3 ? (
                        <span>สามารถเลือกเพิ่มได้อีก {3 - totalHours} ชั่วโมง (รวมสูงสุด 3 ชั่วโมง)</span>
                      ) : (
                        <span>เลือกครบจำนวนชั่วโมงสูงสุดที่กำหนดแล้ว (สูงสุด 3 ชั่วโมง)</span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* การ์ดรายละเอียดสนามกีฬานี้ */}
          {currentCourt && (
            <div className="court-details-card-premium">
              <h3>ข้อมูลสนามที่เลือก</h3>
              <div className="court-details-grid-layout">
                <div className="court-detail-image-box">
                  {currentCourt.image_url ? (
                    <img src={currentCourt.image_url} alt={currentCourt.name} />
                  ) : (
                    <div className="court-placeholder-img">ไม่มีรูปภาพ</div>
                  )}

                </div>

                <div className="court-detail-info-box">
                  <div className="court-info-header-row">
                    <h4>{currentCourt.name}</h4>
                  </div>
                </div>

                <div className="court-detail-price-box">
                  <div className="price-tag-value-box">
                    <strong>฿{parseFloat(currentCourt.price_per_hour).toLocaleString()}</strong>
                    <span> / ชั่วโมง</span>
                  </div>
                  <div className="price-desc-sub">ราคาต่อชั่วโมง</div>
                  <button
                    type="button"
                    onClick={() => {
                      Swal.fire({
                        title: currentCourt.name,
                        text: `อัตราค่าบริการสนาม: ฿${parseFloat(currentCourt.price_per_hour).toLocaleString()} บาทต่อชั่วโมง | ประเภทกีฬา: ${getSportLabel(currentCourt.sport_id)}`,
                        imageUrl: currentCourt.image_url || undefined,
                        imageWidth: 400,
                        confirmButtonColor: '#10b981'
                      });
                    }}
                    className="btn-view-court-details"
                  >
                    ดูรายละเอียดสนาม <span className="arrow-right-icon">→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* นโยบายบริการสามคอลัมน์ล่างสุดตามแบบต้นฉบับภาพ */}
          <div className="booking-footer-benefits-grid">
            <div className="benefit-col-item">
              <span className="icon-badge font-red">❌</span>
              <div className="benefit-info-text">
                <strong>ยกเลิกฟรี</strong>
                <span>ยกเลิกการจองได้ก่อนเวลา 24 ชั่วโมง</span>
              </div>
            </div>
            <div className="benefit-col-item">
              <span className="icon-badge font-green">🛡️</span>
              <div className="benefit-info-text">
                <strong>คืนเงิน 100%</strong>
                <span>หากสนามไม่สามารถใช้งานได้</span>
              </div>
            </div>
            <div className="benefit-col-item">
              <span className="icon-badge font-green">📞</span>
              <div className="benefit-info-text">
                <strong>ทีมงานดูแล 24 ชม.</strong>
                <span>พร้อมให้บริการคุณตลอดเวลา</span>
              </div>
            </div>
          </div>

        </div>

        {/* คอลัมน์ขวา: ใบสรุปรายการจองชำระเงิน (Invoice Card Summary) */}
        <div className="summary-sidebar-wrapper">
          <div className="summary-invoice-card-premium">
            <div className="invoice-card-header">
              <h3>สรุปการจอง</h3>
              <ShieldCheck size={18} className="shield-secure-icon" />
            </div>

            <div className="invoice-card-body">
              {/* Profile ย่อสนาม */}
              <div className="court-mini-profile-row">
                {currentCourt && currentCourt.image_url ? (
                  <img src={currentCourt.image_url} alt={currentCourt.name} className="court-circle-avatar" />
                ) : (
                  <div className="court-circle-avatar-placeholder">🏟️</div>
                )}
                <div className="court-mini-name-info">
                  <h4>{currentCourt ? currentCourt.name : '-'}</h4>
                  <span>{currentCourt ? (currentCourt.location || 'อาคารกีฬา 1') : '-'}</span>
                </div>
              </div>

              {/* รายการข้อมูลสรุป */}
              <div className="invoice-summary-details-list">
                <div className="detail-row-item">
                  <span className="label-col">📅 วันที่จอง:</span>
                  <span className="value-col">{formatThaiDate(selectedDate)}</span>
                </div>
                <div className="detail-row-item">
                  <span className="label-col">⏱️ ช่วงเวลา:</span>
                  <span className="value-col text-bold text-emerald">
                    {selectedSlots.length > 0
                      ? `${getSelectedTimeRange().start.substring(0, 5)} - ${getSelectedTimeRange().end.substring(0, 5)} (${totalHours} ชั่วโมง)`
                      : 'ยังไม่ได้เลือก'}
                  </span>
                </div>
                <div className="detail-row-item">
                  <span className="label-col">📞 เบอร์โทรติดต่อ:</span>
                  <span className="value-col">{contactPhone || '-'}</span>
                </div>
              </div>

              {/* รายละเอียดราคา */}
              <div className="invoice-pricing-breakdown">
                <span className="breakdown-title">สรุปราคา</span>
                <div className="breakdown-calculation-row">
                  <span>{totalHours} ชั่วโมง x ฿{currentCourt ? parseFloat(currentCourt.price_per_hour).toLocaleString() : 0}</span>
                  <strong>฿{totalPrice.toLocaleString()}</strong>
                </div>
                <div className="breakdown-total-row">
                  <span>รวมทั้งสิ้น</span>
                  <span className="total-grand-price text-emerald">฿{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* แถบการันตีความปลอดภัย */}
              <div className="invoice-secure-banner">
                <ShieldCheck size={14} style={{ flexShrink: 0 }} />
                <span>ระบบชำระเงินปลอดภัย 100%<br />ข้อมูลของคุณจะถูกเข้ารหัสและปกป้อง</span>
              </div>

              {/* ฟอร์มการยืนยันดำเนินการต่อ */}
              <form onSubmit={handleBookingSubmit} className="booking-submit-form" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {token ? (
                  <button
                    type="submit"
                    className="btn-confirm-booking-premium"
                    disabled={isSubmitting || selectedSlots.length === 0 || !contactPhone}
                  >
                    <span>ดำเนินการต่อ</span>
                    <span className="arrow-right-icon">→</span>
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
                    className="btn-confirm-booking-premium btn-warning-login-premium"
                  >
                    กรุณาเข้าสู่ระบบก่อนจองสนาม
                  </button>
                )}
                <span className="secure-sub-notice">คุณจะไปยังหน้าชำระเงินที่ปลอดภัย</span>
              </form>
            </div>
          </div>

          {/* วิธีการชำระเงินรองรับ */}
          <div className="payment-methods-notice-card">
            <h4>วิธีการชำระเงิน</h4>
            <div className="payment-methods-list">
              <div className="method-item">
                <span className="method-bullet">🟢</span>
                <div className="method-text">
                  <strong>สแกน QR Code / Mobile Banking</strong>
                  <span>รองรับทุกธนาคาร</span>
                </div>
              </div>
              <div className="method-item">
                <span className="method-bullet">🟠</span>
                <div className="method-text">
                  <strong>โอนเงินผ่านบัญชีธนาคาร</strong>
                  <span>อัปโหลดสลิปเพื่อยืนยันการชำระเงิน</span>
                </div>
              </div>
            </div>
          </div>



        </div>
      </div>
    </div>
  );
}

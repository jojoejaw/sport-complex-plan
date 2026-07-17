import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Settings, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  Plus, 
  Clock, 
  DollarSign, 
  Eye, 
  Smartphone, 
  Info,
  Search
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../api';

export default function Admin() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // --- Navigation & Filter States ---
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'courts'
  const [bookingFilter, setBookingFilter] = useState('all'); // 'all' | 'pending_payment' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled'
  const [courtSportFilter, setCourtSportFilter] = useState('all'); // 'all' | sport_id string
  const [searchQuery, setSearchQuery] = useState('');

  // --- Data States ---
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [sports, setSports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Slip View Modal State ---
  const [slipModalBooking, setSlipModalBooking] = useState(null);

  // --- Court Edit/Add Modal State ---
  const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);
  const [courtModalMode, setCourtModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedCourtId, setSelectedCourtId] = useState(null);
  
  // Court Form Fields
  const [formSportId, setFormSportId] = useState('');
  const [formCourtName, setFormCourtName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPricePerHour, setFormPricePerHour] = useState('');
  const [formStatus, setFormStatus] = useState('active'); // 'active' | 'maintenance'
  const [formImageUrl, setFormImageUrl] = useState('');

  // --- Check Authorization ---
  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      Swal.fire({
        title: 'ปฏิเสธการเข้าถึง',
        text: 'หน้านี้สำหรับแอดมินเท่านั้น',
        icon: 'error',
        confirmButtonText: 'ตกลง'
      });
      navigate('/', { replace: true });
    }
  }, [token, user?.role, navigate]);

  // --- Data Fetching ---
  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get('/bookings/admin/list');
      setBookings(res.data || []);
    } catch (error) {
      console.error('Error fetching admin bookings:', error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลรายการจองได้', 'error');
    }
  }, []);

  const fetchCourts = useCallback(async () => {
    try {
      const res = await api.get('/courts');
      setCourts(res.data || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลสนามได้', 'error');
    }
  }, []);

  const fetchSports = useCallback(async () => {
    try {
      const res = await api.get('/sports');
      setSports(res.data || []);
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  }, []);

  // Fetch initial data ONCE on mount (with full loading spinner)
  useEffect(() => {
    if (token && user?.role === 'admin') {
      const initData = async () => {
        setIsLoading(true);
        await Promise.all([
          fetchSports(),
          fetchBookings(),
          fetchCourts()
        ]);
        setIsLoading(false);
      };
      initData();
    }
  }, [token, user?.role, fetchSports, fetchBookings, fetchCourts]);

  // --- Helper: Get Slip Image URL ---
  const getSlipUrl = (filename) => {
    if (!filename) return '';
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    const base = api.defaults.baseURL || 'http://localhost:5000/api';
    const serverBase = base.replace(/\/api$/, '');
    
    let cleanPath = filename;
    if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.substring('uploads/'.length);
    } else if (cleanPath.startsWith('/uploads/')) {
      cleanPath = cleanPath.substring('/uploads/'.length);
    }
    
    return `${serverBase}/uploads/${cleanPath}`;
  };

  // --- Format Functions ---
  const formatThaiDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', options);
  };

  const formatThaiDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('th-TH', options) + ' น.';
  };

  // --- Booking Verification Handlers ---
  const handleVerifyBooking = async (bookingId, status, rejectReason = null) => {
    // Confirm Action first
    const actionText = status === 'approved' ? 'อนุมัติการจองนี้' : 'ปฏิเสธการจองนี้';
    const confirmColor = status === 'approved' ? '#15803d' : '#ef4444';

    Swal.fire({
      title: `ยืนยันที่จะ${actionText}?`,
      text: status === 'approved' 
        ? 'สนามจะถูกอนุมัติและแจ้งยืนยันให้ลูกค้าทราบ' 
        : `เหตุผลการปฏิเสธ: ${rejectReason}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ดำเนินการ',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const body = { status };
          if (rejectReason) {
            body.reject_reason = rejectReason;
          }

          const res = await api.put(`/bookings/${bookingId}/verify`, body);
          Swal.fire('สำเร็จ', res.data.message || 'บันทึกสถานะการจองเรียบร้อย', 'success');
          
          // Close modal if open
          setSlipModalBooking(null);
          // Refresh list
          fetchBookings();
        } catch (error) {
          console.error('Verify booking error:', error);
          Swal.fire('เกิดข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถบันทึกสถานะได้', 'error');
        }
      }
    });
  };

  const triggerEditStatusPrompt = (bookingId, currentStatus) => {
    Swal.fire({
      title: 'ปรับปรุงสถานะการจอง',
      input: 'select',
      inputOptions: {
        'pending_payment': '⌛ ค้างชำระ (รอโอนเงิน)',
        'pending_approval': '🔍 รอแอดมินตรวจสลิป',
        'approved': '✅ ยืนยันแล้ว (อนุมัติการจอง)',
        'rejected': '❌ ปฏิเสธการจอง (ส่งสลิปใหม่)',
        'cancelled': '🚫 ยกเลิกการจอง'
      },
      inputValue: currentStatus,
      inputPlaceholder: 'เลือกสถานะการจอง',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#94a3b8'
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const newStatus = result.value;
        if (newStatus === 'rejected') {
          triggerRejectReasonPrompt(bookingId);
        } else {
          try {
            const res = await api.put(`/bookings/${bookingId}/verify`, { status: newStatus });
            Swal.fire('สำเร็จ', res.data.message || 'บันทึกสถานะเรียบร้อย', 'success');
            fetchBookings();
          } catch (error) {
            console.error('Update status error:', error);
            Swal.fire('เกิดข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
          }
        }
      }
    });
  };

  const triggerRejectReasonPrompt = (bookingId) => {
    Swal.fire({
      title: 'ระบุเหตุผลที่ปฏิเสธการจอง',
      input: 'text',
      inputPlaceholder: 'กรอกเหตุผล เช่น สลิปโอนเงินไม่ถูกต้อง, ยอดโอนไม่ครบ...',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      inputValidator: (value) => {
        if (!value) {
          return 'กรุณากรอกเหตุผลด้วยครับ!';
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const res = await api.put(`/bookings/${bookingId}/verify`, { status: 'rejected', reject_reason: result.value });
          Swal.fire('สำเร็จ', res.data.message || 'ปฏิเสธการจองและบันทึกเหตุผลเรียบร้อย', 'success');
          fetchBookings();
        } catch (error) {
          console.error('Update status error:', error);
          Swal.fire('เกิดข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
        }
      }
    });
  };

  // --- Court Form Modal Helpers ---
  const openAddCourtModal = () => {
    setCourtModalMode('add');
    setSelectedCourtId(null);
    setFormSportId(sports[0]?.id || '');
    setFormCourtName('');
    setFormDescription('');
    setFormPricePerHour('');
    setFormStatus('active');
    setFormImageUrl('');
    setIsCourtModalOpen(true);
  };

  const openEditCourtModal = (court) => {
    setCourtModalMode('edit');
    setSelectedCourtId(court.id);
    setFormSportId(court.sport_id);
    setFormCourtName(court.name);
    setFormDescription(court.description || '');
    setFormPricePerHour(parseFloat(court.price_per_hour));
    setFormStatus(court.status);
    setFormImageUrl(court.image_url || '');
    setIsCourtModalOpen(true);
  };

  const handleSaveCourt = async (e) => {
    e.preventDefault();

    if (!formSportId || !formCourtName || !formPricePerHour) {
      Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกประเภทกีฬา ชื่อสนาม และราคาต่อชั่วโมง', 'warning');
      return;
    }

    const price = parseFloat(formPricePerHour);
    if (isNaN(price) || price <= 0) {
      Swal.fire('ข้อมูลไม่ถูกต้อง', 'ราคาต่อชั่วโมงต้องมากกว่า 0 บาท', 'warning');
      return;
    }

    try {
      const payload = {
        sport_id: parseInt(formSportId),
        name: formCourtName,
        description: formDescription || null,
        price_per_hour: price,
        status: formStatus,
        image_url: formImageUrl || null
      };

      if (courtModalMode === 'add') {
        await api.post('/courts', payload);
        Swal.fire('สำเร็จ', 'เพิ่มสนามใหม่เรียบร้อยแล้ว!', 'success');
      } else {
        await api.put(`/courts/${selectedCourtId}`, payload);
        Swal.fire('สำเร็จ', 'อัปเดตข้อมูลสนามเรียบร้อยแล้ว!', 'success');
      }

      setIsCourtModalOpen(false);
      fetchCourts();
    } catch (error) {
      console.error('Error saving court:', error);
      Swal.fire('ล้มเหลว', error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสนาม', 'error');
    }
  };

  const handleDeleteCourt = async (courtId) => {
    Swal.fire({
      title: 'ต้องการลบสนามนี้ใช่ไหม?',
      text: 'การลบจะไม่สามารถกู้คืนได้ และไม่สามารถลบสนามที่มีประวัติการจองอยู่แล้วในระบบได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ลบสนาม',
      cancelButtonText: 'ปิด'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await api.delete(`/courts/${courtId}`);
          Swal.fire('สำเร็จ', res.data.message || 'ลบสนามเรียบร้อยแล้ว', 'success');
          fetchCourts();
        } catch (error) {
          console.error('Error deleting court:', error);
          Swal.fire('ไม่สามารถลบได้', error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบสนาม', 'error');
        }
      }
    });
  };

  // --- Sport Style Helper mappings ---
  const getSportEmoji = (sportName) => {
    if (!sportName) return '⚽';
    const name = sportName.toLowerCase();
    if (name.includes('ฟุต') || name.includes('foot')) return '⚽';
    if (name.includes('บาส') || name.includes('basket')) return '🏀';
    if (name.includes('แบด') || name.includes('badminton')) return '🏸';
    if (name.includes('วอล') || name.includes('volley')) return '🏐';
    return '⚽';
  };

  const getSportColorClass = (sportName) => {
    if (!sportName) return 'football';
    const name = sportName.toLowerCase();
    if (name.includes('ฟุต') || name.includes('foot')) return 'football';
    if (name.includes('บาส') || name.includes('basket')) return 'basketball';
    if (name.includes('แบด') || name.includes('badminton')) return 'badminton';
    if (name.includes('วอล') || name.includes('volley')) return 'volleyball';
    return 'football';
  };

  // --- Calculate Dashboard Stats Metrics ---
  const stats = {
    total: bookings.length,
    pendingApproval: bookings.filter(b => b.status === 'pending_approval').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    cancelledOrRejected: bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length
  };

  // --- Filtering & Search Logic for Bookings ---
  const filteredBookings = bookings.filter(b => {
    // 1. Filter by status
    const matchesStatus = 
      bookingFilter === 'all' || 
      (bookingFilter === 'rejected' ? (b.status === 'rejected' || b.status === 'cancelled') : b.status === bookingFilter);
    
    // 2. Filter by search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;
    
    const matchesSearch = 
      b.id.toString().includes(q) ||
      b.username.toLowerCase().includes(q) ||
      b.email.toLowerCase().includes(q) ||
      b.contact_phone.includes(q) ||
      b.court_name.toLowerCase().includes(q) ||
      b.sport_name.toLowerCase().includes(q);
      
    return matchesStatus && matchesSearch;
  });

  // --- Filtering Logic for Courts ---
  const filteredCourts = courts.filter(court => {
    if (courtSportFilter === 'all') return true;
    return court.sport_id === parseInt(courtSportFilter);
  });

  return (
    <div className="admin-page-container container">
      {/* ส่วนหัวหน้าเว็บแอดมิน */}
      <header className="admin-header">
        <h1>
          <Settings size={28} className="text-emerald" />
          <span>ระบบจัดการหลังบ้านแอดมิน</span>
        </h1>
        {activeTab === 'courts' && (
          <button onClick={openAddCourtModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            <span>เพิ่มสนามใหม่</span>
          </button>
        )}
      </header>

      {/* แถบสลับแท็บการทำงานสไตล์มินิมอล */}
      <div className="admin-segmented-control-container">
        <nav className="admin-minimal-tabs">
          <button 
            type="button"
            onClick={() => setActiveTab('bookings')} 
            className={`admin-tab-link ${activeTab === 'bookings' ? 'active' : ''}`}
          >
            <Calendar size={16} />
            <span>รายการเสนอจอง</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('courts')} 
            className={`admin-tab-link ${activeTab === 'courts' ? 'active' : ''}`}
          >
            <Settings size={16} />
            <span>จัดการสนาม</span>
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="loading-wrapper" style={{ padding: '80px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '12px' }}>
          <Clock className="loading-spinner" size={40} style={{ animation: 'spin 2s linear infinite', color: '#15803d' }} />
          <span style={{ color: '#64748b', fontWeight: '500' }}>กำลังโหลดข้อมูลระบบหลังบ้าน...</span>
        </div>
      ) : (
        <>
          {/* ==============================================
              TAB: BOOKINGS (จัดการการจอง)
              ============================================== */}
          {activeTab === 'bookings' && (
            <div>
              {/* แถบตัวเลขสถานะแบบจุดสถานะมินิมอล (Slack/GitHub Status Row) */}
              <div className="admin-inline-metrics">
                <button 
                  type="button"
                  onClick={() => { setBookingFilter('all'); }} 
                  className={`metric-dot-link ${bookingFilter === 'all' ? 'active' : ''}`}
                >
                  <span className="status-dot gray"></span>
                  <span>ทั้งหมด ({stats.total})</span>
                </button>

                <button 
                  type="button"
                  onClick={() => { setBookingFilter('pending_approval'); }} 
                  className={`metric-dot-link ${bookingFilter === 'pending_approval' ? 'active' : ''}`}
                >
                  <span className={`status-dot yellow ${stats.pendingApproval > 0 ? 'pulse' : ''}`}></span>
                  <span>รอตรวจสลิป ({stats.pendingApproval})</span>
                </button>

                <button 
                  type="button"
                  onClick={() => { setBookingFilter('approved'); }} 
                  className={`metric-dot-link ${bookingFilter === 'approved' ? 'active' : ''}`}
                >
                  <span className="status-dot green"></span>
                  <span>อนุมัติแล้ว ({stats.approved})</span>
                </button>

                <button 
                  type="button"
                  onClick={() => { setBookingFilter('rejected'); }} 
                  className={`metric-dot-link ${bookingFilter === 'rejected' ? 'active' : ''}`}
                >
                  <span className="status-dot red"></span>
                  <span>ถูกปฏิเสธ/ยกเลิก ({stats.cancelledOrRejected})</span>
                </button>
              </div>

              {/* ช่องค้นหาไร้ขอบสไตล์มินิมอล (Borderless Underline Input) */}
              <div className="admin-search-minimal">
                <Search size={16} className="search-icon-gray" />
                <input 
                  type="text" 
                  className="borderless-search-input" 
                  placeholder="ค้นหาตามชื่อลูกค้า, เบอร์โทร, สนาม หรือเลขที่เสนอจอง..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')}
                    className="filter-reset-btn"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>

              {/* รายการจองดีไซน์แถวเรียบแบบแบน (Flat separated list rows) */}
              {/* รายการจองดีไซน์แถวเรียบแบบแบนพร้อมหัวตาราง (Flat structured list rows) */}
              <div className="booking-flat-list">
                {filteredBookings.length > 0 && (
                  <div className="booking-list-header">
                    <span>กีฬา / ID</span>
                    <span>ผู้จอง</span>
                    <span>สนาม / วันเวลา</span>
                    <span>ยอดชำระ / สลิป</span>
                    <span>สถานะ</span>
                    <span style={{ textAlign: 'right' }}>การจัดการ</span>
                  </div>
                )}

                {filteredBookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', backgroundColor: 'var(--bg-white)', borderRadius: '12px' }}>
                    <Info size={36} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                    <p style={{ fontWeight: '500', fontSize: '14px' }}>ไม่มีข้อมูลที่สอดคล้องกับตัวกรอง</p>
                  </div>
                ) : (
                  filteredBookings.map((booking) => {
                    const customerInitial = booking.username ? booking.username.charAt(0) : 'U';

                    return (
                      <div key={booking.id} className={`booking-flat-row status-${booking.status}`} id={`booking-card-${booking.id}`}>
                        {/* 1. ประเภทกีฬา & รหัสใบจอง */}
                        <div className="flat-col">
                          <span className="flat-sport-tag">{booking.sport_name}</span>
                          <span className="flat-id-tag">#{booking.id}</span>
                        </div>

                        {/* 2. รายละเอียดผู้จอง */}
                        <div className="flat-col">
                          <strong className="flat-user-name">{booking.username}</strong>
                          <a href={`tel:${booking.contact_phone}`} className="flat-phone-anchor" title="โทรด่วน">
                            <Smartphone size={12} style={{ color: '#94a3b8' }} /> {booking.contact_phone}
                          </a>
                        </div>

                        {/* 3. รายละเอียดสนาม & วันเวลา */}
                        <div className="flat-col">
                          <span className="flat-court-title">{booking.court_name}</span>
                          <div className="flat-schedule-block">
                            <span>{formatThaiDate(booking.booking_date)}</span>
                            <span>{booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)} น.</span>
                          </div>
                        </div>

                        {/* 4. ราคา & ดูสลิป */}
                        <div className="flat-col">
                          <span className="flat-price-value">{parseFloat(booking.total_price).toLocaleString()} บาท</span>
                          {booking.slip_image_path ? (
                            <button 
                              onClick={() => setSlipModalBooking(booking)} 
                              className="flat-slip-link"
                              type="button"
                              title="คลิกพรีวิวรูปสลิป"
                            >
                              <Eye size={12} style={{ color: 'var(--color-primary)' }} />
                              <span>ดูหลักฐานสลิป</span>
                            </button>
                          ) : (
                            <span className="flat-no-slip-label">ไม่มีรูปสลิป</span>
                          )}
                        </div>

                        {/* 5. สถานะแบบป้ายคำพรีเมียม (Pill status badges) */}
                        <div className="flat-col">
                          <span className={`status-pill ${booking.status}`}>
                            <span className="status-dot-inner"></span>
                            <span>
                              {booking.status === 'pending_payment' && 'ค้างชำระ'}
                              {booking.status === 'pending_approval' && 'รอตรวจสลิป'}
                              {booking.status === 'approved' && 'ยืนยันแล้ว'}
                              {booking.status === 'rejected' && 'ปฏิเสธแล้ว'}
                              {booking.status === 'cancelled' && 'ยกเลิกแล้ว'}
                            </span>
                          </span>
                        </div>

                        {/* 6. ปุ่มควบคุมแก้ไขดีไซน์กระชับ */}
                        <div className="flat-actions-cell">
                          <button 
                            onClick={() => triggerEditStatusPrompt(booking.id, booking.status)} 
                            className="btn-edit-minimal"
                            type="button"
                            title="แก้ไขสถานะใบเสนอจอง"
                          >
                            แก้ไข
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ==============================================
              TAB: COURTS (จัดการสนาม)
              ============================================== */}
          {activeTab === 'courts' && (
            <div className="admin-courts-container">
              {/* แถบกรองประเภทกีฬาของสนาม */}
              <div className="admin-inline-metrics" style={{ marginBottom: '24px' }}>
                <button 
                  type="button" 
                  onClick={() => setCourtSportFilter('all')} 
                  className={`metric-dot-link ${courtSportFilter === 'all' ? 'active' : ''}`}
                >
                  <span className="status-dot gray"></span>
                  <span>ทั้งหมด ({courts.length})</span>
                </button>
                {sports.map(sport => {
                  const count = courts.filter(c => c.sport_id === sport.id).length;
                  return (
                    <button 
                      key={sport.id}
                      type="button" 
                      onClick={() => setCourtSportFilter(sport.id.toString())} 
                      className={`metric-dot-link ${courtSportFilter === sport.id.toString() ? 'active' : ''}`}
                    >
                      <span className={`status-dot ${getSportColorClass(sport.name)}`}></span>
                      <span>{sport.name} ({count})</span>
                    </button>
                  );
                })}
              </div>

              <div className="admin-courts-grid">
                {filteredCourts.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 20px', color: '#94a3b8', backgroundColor: 'var(--bg-white)', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <Info size={36} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                    <p style={{ fontWeight: '500', fontSize: '14px' }}>ไม่มีข้อมูลสนามในประเภทกีฬานี้</p>
                  </div>
                ) : (
                  filteredCourts.map((court) => {
                  const sport = sports.find(s => s.id === court.sport_id);
                  return (
                    <div key={court.id} className={`court-card status-${court.status}`}>
                      {/* รูปภาพสนามและป้ายสถานะลอย */}
                      <div className="court-card-image-wrapper">
                        {court.image_url ? (
                          <img 
                            src={court.image_url} 
                            alt={court.name} 
                            className="court-card-image"
                          />
                        ) : (
                          <div className="court-card-image-placeholder">
                            <span className="placeholder-emoji">{getSportEmoji(sport?.name)}</span>
                          </div>
                        )}
                        <span className={`court-card-status-badge ${court.status === 'active' ? 'active' : 'maintenance'}`}>
                          {court.status === 'active' ? '🟢 เปิดใช้งาน' : '🔧 ปิดปรับปรุง'}
                        </span>
                      </div>

                      {/* รายละเอียดสนาม */}
                      <div className="court-card-details">
                        <div className="court-card-meta-row">
                          <span className="court-card-sport-pill">
                            {sport?.name || `กีฬา ID: ${court.sport_id}`}
                          </span>
                          <span className="court-card-id">#{court.id}</span>
                        </div>
                        
                        <h3 className="court-card-name">{court.name}</h3>
                        {court.description ? (
                          <p className="court-card-desc">{court.description}</p>
                        ) : (
                          <p className="court-card-desc-placeholder">ไม่มีคำอธิบายข้อมูลสนาม</p>
                        )}
                        
                        <div className="court-card-price-row">
                          <span className="price-label">ค่าบริการรายชั่วโมง</span>
                          <span className="price-value">
                            {parseFloat(court.price_per_hour).toLocaleString()} บาท
                            <span className="price-unit">/ชม.</span>
                          </span>
                        </div>
                      </div>

                      {/* การจัดการปุ่มควบคุม */}
                      <div className="court-card-actions">
                        <button 
                          onClick={() => openEditCourtModal(court)} 
                          className="btn-card-edit"
                          type="button"
                          title="แก้ไขสนาม"
                        >
                          <Edit size={13} />
                          <span>แก้ไข</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteCourt(court.id)} 
                          className="btn-card-delete"
                          type="button"
                          title="ลบสนาม"
                        >
                          <Trash2 size={13} />
                          <span>ลบสนาม</span>
                        </button>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ==============================================
          MODAL: VIEW BANK SLIP & VERIFY (ดูสลิป)
          ============================================== */}
      {slipModalBooking && (
        <div className="admin-modal-overlay" onClick={() => setSlipModalBooking(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>หลักฐานการโอนเงิน (ใบเสนอจอง #{slipModalBooking.id})</h3>
              <button className="admin-modal-close-btn" onClick={() => setSlipModalBooking(null)} type="button">
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="slip-preview-container">
                <img 
                  src={getSlipUrl(slipModalBooking.slip_image_path)} 
                  alt="Bank Slip Preview" 
                  className="slip-preview-image"
                />
                <div className="slip-metadata">
                  <p><strong>ชื่อผู้จอง:</strong> {slipModalBooking.username} ({slipModalBooking.email})</p>
                  <p><strong>เบอร์ติดต่อ:</strong> {slipModalBooking.contact_phone}</p>
                  <p><strong>ยอดที่ต้องชำระ:</strong> <span className="text-emerald" style={{ fontWeight: '600' }}>{parseFloat(slipModalBooking.total_price).toLocaleString()} บาท</span></p>
                  <p><strong>เวลาโอนเงินตามแอป:</strong> {formatThaiDateTime(slipModalBooking.transfer_time)}</p>
                  <p><strong>เวลาอัปโหลดรูปภาพ:</strong> {formatThaiDateTime(slipModalBooking.uploaded_at)}</p>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              {slipModalBooking.status === 'pending_approval' && (
                <>
                  <button 
                    onClick={() => handleVerifyBooking(slipModalBooking.id, 'approved')} 
                    className="btn btn-primary"
                    style={{ backgroundColor: '#15803d', borderColor: '#15803d' }}
                    type="button"
                  >
                    <Check size={16} /> อนุมัติสลิปนี้
                  </button>
                  <button 
                    onClick={() => triggerRejectPrompt(slipModalBooking.id)} 
                    className="btn btn-outline-light"
                    style={{ color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fee2e2' }}
                    type="button"
                  >
                    <X size={16} /> ปฏิเสธการชำระเงิน
                  </button>
                </>
              )}
              <button onClick={() => setSlipModalBooking(null)} className="btn btn-outline-light" type="button">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: ADD / EDIT COURT (เพิ่มและแก้ไขสนาม)
          ============================================== */}
      {isCourtModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsCourtModalOpen(false)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveCourt}>
              <div className="admin-modal-header">
                <h3>{courtModalMode === 'add' ? 'เพิ่มสนามกีฬาใหม่' : 'แก้ไขข้อมูลสนามกีฬา'}</h3>
                <button 
                  type="button" 
                  className="admin-modal-close-btn" 
                  onClick={() => setIsCourtModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="admin-modal-body">
                {/* 1. เลือกประเภทกีฬา */}
                <div className="admin-form-group">
                  <label htmlFor="court-sport-select">ประเภทกีฬา *</label>
                  <select 
                    id="court-sport-select"
                    className="admin-form-select"
                    value={formSportId}
                    onChange={(e) => setFormSportId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- เลือกประเภทกีฬา --</option>
                    {sports.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. ชื่อสนาม */}
                <div className="admin-form-group">
                  <label htmlFor="court-name-input">ชื่อสนาม / คอร์ท *</label>
                  <input 
                    id="court-name-input"
                    type="text" 
                    className="admin-form-input" 
                    placeholder="เช่น สนามฟุตบอล A, คอร์ทแบด 1"
                    value={formCourtName}
                    onChange={(e) => setFormCourtName(e.target.value)}
                    required
                  />
                </div>

                {/* คำอธิบายสนาม */}
                <div className="admin-form-group">
                  <label htmlFor="court-desc-input">คำอธิบายสนาม (ไม่บังคับ)</label>
                  <textarea 
                    id="court-desc-input"
                    className="admin-form-input" 
                    placeholder="เช่น สนามหญ้าเทียมเกรดพรีเมียมนำเข้า, ในร่มมีพัดลมระบายอากาศ, มีน้ำดื่มให้บริการฟรี..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows="3"
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                {/* 3. ราคาต่อชั่วโมง */}
                <div className="admin-form-group">
                  <label htmlFor="court-price-input">อัตราค่าบริการต่อชั่วโมง (บาท) *</label>
                  <input 
                    id="court-price-input"
                    type="number" 
                    className="admin-form-input" 
                    placeholder="เช่น 150, 400"
                    value={formPricePerHour}
                    onChange={(e) => setFormPricePerHour(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                {/* 4. สถานะสนาม (เฉพาะโหมดแก้ไข) */}
                {courtModalMode === 'edit' && (
                  <div className="admin-form-group">
                    <label htmlFor="court-status-select">สถานะสนาม *</label>
                    <select 
                      id="court-status-select"
                      className="admin-form-select"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      required
                    >
                      <option value="active">เปิดใช้งาน (Active)</option>
                      <option value="maintenance">ปิดปรับปรุงชั่วคราว (Maintenance)</option>
                    </select>
                  </div>
                )}

                {/* 5. URL รูปภาพ */}
                <div className="admin-form-group">
                  <label htmlFor="court-image-input">URL รูปภาพสนาม (ไม่บังคับ)</label>
                  <input 
                    id="court-image-input"
                    type="url" 
                    className="admin-form-input" 
                    placeholder="https://example.com/court-image.jpg"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#15803d', borderColor: '#15803d' }}>
                  บันทึกข้อมูล
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsCourtModalOpen(false)} 
                  className="btn btn-outline-light"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

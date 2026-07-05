import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trophy, ShieldCheck, Clock, ArrowRight, Activity, Sparkles, Play, Grid } from 'lucide-react';
import api from '../api';

export default function Home() {
  const navigate = useNavigate();
  
  // State เก็บข้อมูลกีฬาและสนาม
  const [sports, setSports] = useState([]);
  const [courts, setCourts] = useState([]);
  const [selectedSport, setSelectedSport] = useState('all'); // เก็บไอดีกีฬาที่เลือก (all = แสดงทั้งหมด)
  const [showAllCourts, setShowAllCourts] = useState(false); // เก็บสถานะกดแสดงสนามทั้งหมด
  
  // State จัดการหน้าจอดาวน์โหลดข้อมูล (Loading)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ฟังก์ชันสไลด์เลื่อนหน้าจอลงไปยังแท็บสนามกีฬาที่เปิดให้บริการ (Catalog) โดยไม่ให้โดน Navbar บังหัวข้อ
  const scrollToCatalog = () => {
    const element = document.getElementById('catalog-section');
    if (element) {
      // ดึงระดับตำแหน่งพิกัดแท้จริงของหัวข้อแคตตาล็อกสนามกีฬา
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      // ลบออกด้วยความสูงของ Navbar (~106px) และเว้นระยะเผื่อความสวยงาม (-120px) 
      // เพื่อให้หัวข้อข้อความ "สนามกีฬาที่เปิดให้บริการ..." และปุ่มกีฬาและการ์ด อยู่ครบถ้วนโดยไม่โดน Navbar บดบัง
      const offsetPosition = elementPosition - 120;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // ดึงข้อมูลประเภทกีฬาและสนามจาก API เมื่อ Component โหลด
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // ยิง API สองตัวพร้อมกันเพื่อประหยัดเวลา
        const [sportsRes, courtsRes] = await Promise.all([
          api.get('/sports'),
          api.get('/courts')
        ]);
        
        setSports(sportsRes.data);
        setCourts(courtsRes.data);
      } catch (err) {
        console.error('Error fetching home data:', err);
        setError('ไม่สามารถเชื่อมต่อข้อมูลเซิร์ฟเวอร์หลังบ้านได้ในขณะนี้');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // ฟังก์ชันสลับการกรองกีฬา
  const handleSportFilter = (sportId) => {
    setSelectedSport(sportId);
    setShowAllCourts(false); // รีเซ็ตการซ่อน/แสดงเมื่อเปลี่ยนประเภทกีฬา
  };

  // กรองรายการสนามตามประเภทกีฬาที่เลือก
  const filteredCourts = selectedSport === 'all' 
    ? courts 
    : courts.filter(court => court.sport_id === parseInt(selectedSport));

  // คัดเลือกรายการสนามที่จะแสดงจริง (หากยังไม่กดดูทั้งหมดภายใต้ 'ทั้งหมด' จะแสดงแค่ 4 รายการแรกก่อน)
  const displayedCourts = (selectedSport === 'all' && !showAllCourts)
    ? filteredCourts.slice(0, 4)
    : filteredCourts;

  // ฟังก์ชันช่วยเหลือสำหรับแสดงสัญลักษณ์และสีตามประเภทกีฬา
  const getSportDetail = (sportId) => {
    switch (parseInt(sportId)) {
      case 1: // ฟุตบอล
        return { label: 'ฟุตบอล', color: 'sport-football', icon: '⚽' };
      case 2: // บาสเกตบอล
        return { label: 'บาสเกตบอล', color: 'sport-basketball', icon: '🏀' };
      case 3: // แบดมินตัน
        return { label: 'แบดมินตัน', color: 'sport-badminton', icon: '🏸' };
      case 4: // วอลเลย์บอล
        return { label: 'วอลเลย์บอล', color: 'sport-volleyball', icon: '🏐' };
      default:
        return { label: 'กีฬา', color: 'sport-generic', icon: '🏆' };
    }
  };


  return (
    <div className="home-container">
      {/* 1. Hero Banner Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content-wrapper container">
          
          {/* ข้อมูลแฮดดิ้งซ้าย */}
          <div className="hero-content-left">
            <div className="badge-wrapper">
              <Sparkles size={14} className="text-emerald" />
              <span>ระบบบริการจองสนามกีฬาระดับพรีเมียม</span>
            </div>
            <h1>
              ยกระดับสุขภาพ<br />
              และ<span>การเล่นกีฬา</span>ของคุณ
            </h1>
            <p>
              เช็คตารางสนามว่าง ค้นหาเวลาที่สะดวก และจองสนามได้ง่ายๆ ตลอด 24 ชั่วโมง พร้อมระบบแสกนสลิปชำระเงินอัจฉริยะ ปลอดภัย รวดเร็ว
            </p>
            <div className="hero-actions">
              <button onClick={scrollToCatalog} className="btn btn-primary btn-hero">
                <Clock size={18} style={{ marginRight: '6px' }} />
                <span>จองสนามออนไลน์เลย</span>
                <ArrowRight size={18} style={{ marginLeft: '4px' }} />
              </button>
              
              <button 
                onClick={() => {
                  Swal.fire({
                    title: 'วิธีการใช้งานระบบจอง',
                    html: `
                      <div style="text-align: left; font-size: 14px; line-height: 1.6;">
                        <ol>
                          <li><strong>เลือกประเภทกีฬา:</strong> กรองและเลือกสนามที่ชื่นชอบจากรายการ</li>
                          <li><strong>เช็คสล็อตเวลา:</strong> จิ้มเลือกชั่วโมงที่ต้องการ (สูงสุด 3 ชม. ติดต่อกัน)</li>
                          <li><strong>สแกน QR Code:</strong> โอนชำระเงินตามราคารวมโอนจริง</li>
                          <li><strong>อัปโหลดสลิป:</strong> ส่งสลิปให้ระบบตรวจเช็คอัตโนมัติ เป็นอันเสร็จสิ้น!</li>
                        </ol>
                      </div>
                    `,
                    icon: 'info',
                    confirmButtonColor: '#10b981'
                  });
                }} 
                className="btn-hero-secondary"
              >
                <div className="play-icon-circle">
                  <Play size={12} fill="currentColor" />
                </div>
                <span>ดูวิธีการใช้งาน</span>
              </button>
            </div>
          </div>

          {/* กล่องกระจกบอกจุดขายขวา (Hero Benefits Box) */}
          <div className="hero-benefits-box">
            <div className="benefit-item">
              <div className="benefit-icon-circle accent-badge">
                <span>24/7</span>
              </div>
              <div className="benefit-text">
                <strong>24/7</strong>
                <span>จองได้ตลอด 24 ชั่วโมง</span>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-circle">
                <ShieldCheck size={18} />
              </div>
              <div className="benefit-text">
                <strong>ปลอดภัย</strong>
                <span>ระบบชำระเงินมาตรฐาน</span>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-circle">
                <Trophy size={18} />
              </div>
              <div className="benefit-text">
                <strong>รวดเร็ว</strong>
                <span>ยืนยันการจองทันที</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Features Highlights Section (แถบยาวสีขาวที่คาบเกี่ยวทับบน Banner) */}
      <section className="features-bar-container container">
        <div className="features-bar">
          <div className="feature-column">
            <div className="feature-circle-icon">
              <Clock size={22} />
            </div>
            <div className="feature-content-text">
              <h3>จองง่าย 24 ชั่วโมง</h3>
              <p>ตรวจเช็คเวลาว่างแบบเรียลไทม์ จองล่วงหน้าได้ในไม่กี่วินาที</p>
            </div>
          </div>

          <div className="features-divider"></div>

          <div className="feature-column">
            <div className="feature-circle-icon">
              <ShieldCheck size={22} />
            </div>
            <div className="feature-content-text">
              <h3>ระบบแสกนสลิปโอนเงิน</h3>
              <p>ชำระเงินง่ายด้วย QR Code พร้อมระบบแสกนสลิปอัตโนมัติตรวจสอบยอด</p>
            </div>
          </div>

          <div className="features-divider"></div>

          <div className="feature-column">
            <div className="feature-circle-icon">
              <Trophy size={22} />
            </div>
            <div className="feature-content-text">
              <h3>สนามมาตรฐานสูง</h3>
              <p>ดูแลและบำรุงรักษาสนามอย่างสม่ำเสมอ เพื่อประสบการณ์ที่ดีที่สุดของคุณ</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sports & Courts Catalog Section */}
      <section id="catalog-section" className="catalog-section container">
        
        {/* หัวข้อแสดงประเภทกีฬาและคีย์การเลือก */}
        <div className="catalog-header-wrapper">
          <div className="section-header-left">
            <span className="section-subtitle">สนามกีฬาที่เปิดให้บริการ</span>
            <h2>เลือกประเภทกีฬาเพื่อค้นหาสนามที่ใช่สำหรับคุณ</h2>
          </div>

          {/* ปลุกตัวเลือกฟิลเตอร์แคปซูลยาทางด้านขวา (Pill Buttons) */}
          <div className="sport-filter-pills-row">
            <button
              onClick={() => handleSportFilter('all')}
              className={`filter-pill-btn ${selectedSport === 'all' ? 'active' : ''}`}
            >
              <Grid size={15} />
              <span>ทั้งหมด</span>
            </button>

            {sports.map((sport) => {
              const detail = getSportDetail(sport.id);
              return (
                <button
                  key={sport.id}
                  onClick={() => handleSportFilter(sport.id)}
                  className={`filter-pill-btn ${selectedSport === sport.id ? 'active' : ''}`}
                >
                  <span className="pill-emoji-icon">{detail.icon}</span>
                  <span>{sport.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="loading-wrapper" style={{ minHeight: '350px' }}>
            <Activity className="loading-spinner" size={40} />
            <p>กำลังดึงข้อมูลคอร์ทสนามสนามกีฬา...</p>
          </div>
        ) : error ? (
          <div className="error-wrapper" style={{ minHeight: '350px' }}>
            <p className="error-text">{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-outline-light" style={{ borderColor: '#cbd5e1', color: '#0f172a' }}>
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <>
            {/* แสดงตารางสนามกีฬา (Courts Grid) */}
            {displayedCourts.length === 0 ? (
              <div className="empty-courts-wrapper">
                <p>ขออภัย ขณะนี้ยังไม่มีสนามที่เปิดให้บริการในประเภทกีฬานี้</p>
              </div>
            ) : (
              <div className="courts-grid-premium">
                {displayedCourts.map((court) => {
                  const sportDetail = getSportDetail(court.sport_id);
                  const isMaintenance = court.status !== 'active';
                  const subtitle = court.description || sportDetail.label;

                  return (
                    <div 
                      key={court.id} 
                      className={`court-premium-card ${isMaintenance ? 'maintenance-mode' : ''}`}
                      onClick={() => {
                        if (!isMaintenance) {
                          navigate(`/booking?court_id=${court.id}`);
                        } else {
                          Swal.fire({
                            icon: 'warning',
                            title: 'สนามปิดปรับปรุงชั่วคราว',
                            text: 'สนามนี้อยู่ระหว่างบำรุงรักษา ไม่พร้อมให้ทำรายการจองได้ในขณะนี้',
                            confirmButtonColor: '#fbbf24'
                          });
                        }
                      }}
                    >
                      {/* ส่วนรูปภาพสนาม */}
                      <div className="court-image-wrapper">
                        {court.image_url ? (
                          <img src={court.image_url} alt={court.name} className="court-photo" />
                        ) : (
                          <div className="court-photo-placeholder">
                            <span>ไม่มีรูปภาพสนาม</span>
                          </div>
                        )}
                        <div className="image-overlay-layer"></div>
                        
                        {/* ป้ายบอกสถานะความว่าง บนซ้าย */}
                        {isMaintenance ? (
                          <span className="court-badge-status status-maintenance-tag">ปรับปรุง</span>
                        ) : (
                          <span className="court-badge-status status-available-tag">ว่าง</span>
                        )}



                        {/* วงกลมสัญลักษณ์กีฬาซ้อนทับภาพ ล่างซ้าย */}
                        <div className="court-sport-icon-overlapping">
                          {sportDetail.icon}
                        </div>
                      </div>
                      
                      {/* ข้อมูลเนื้อหาด้านล่าง */}
                      <div className="court-card-info-content">
                        <h3>{court.name}</h3>
                        <p className="court-type-subtitle">{subtitle}</p>
                        
                        <div className="court-price-rating-row">
                          {/* ราคาสนาม */}
                          <div className="price-tag-value">
                            <span className="currency-symbol">฿</span>
                            <strong>{parseFloat(court.price_per_hour).toLocaleString()}</strong>
                            <span className="price-hour-unit"> / ชั่วโมง</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ปุ่มนำทางดูสนามกีฬาทั้งหมดด้านล่าง (แสดงเฉพาะเมื่อสลับเป็น 'ทั้งหมด' และมีจำนวนสนามมากกว่า 4) */}
            {selectedSport === 'all' && filteredCourts.length > 4 && (
              <div className="catalog-footer">
                <button 
                  onClick={() => {
                    if (showAllCourts) {
                      setShowAllCourts(false);
                      scrollToCatalog();
                    } else {
                      setShowAllCourts(true);
                      setTimeout(() => {
                        const gridElement = document.querySelector('.courts-grid-premium');
                        if (gridElement) {
                          gridElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }
                      }, 100);
                    }
                  }} 
                  className="btn btn-outline-light btn-view-all-courts"
                >
                  <Grid size={15} />
                  <span>{showAllCourts ? 'แสดงน้อยลง' : 'ดูสนามทั้งหมด'}</span>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

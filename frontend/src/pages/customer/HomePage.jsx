import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  Clock3,
  Grid2X2,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';
import heroImage from '../../assets/sports-hero.png';
import courtPanorama from '../../assets/court-panorama.png';
import courtService from '../../services/courtService';
import BookingModal from '../../components/booking/BookingModal';



const benefits = [
  { icon: CalendarCheck, title: 'จองง่าย', detail: 'จองได้ใน 24 ชม.' },
  { icon: Clock3, title: 'สะดวก', detail: 'เลือกเวลาได้ทันที' },
  { icon: ShieldCheck, title: 'ปลอดภัย', detail: 'ชำระเงินอย่างปลอดภัย' },
  { icon: QrCode, title: 'ยกเลิกได้เอง', detail: 'เมื่อยังไม่ชำระเงิน' },
];

const sportIcons = {
  ฟุตบอล: '⚽',
  บาสเกตบอล: '🏀',
  แบดมินตัน: '🏸',
  วอลเลย์บอล: '🏐',
};

const fallbackImagePositions = {
  1: '0% center',
  2: '33.333% center',
  3: '66.666% center',
  4: '100% center',
};

const serviceInfo = [
  { icon: Clock3, title: 'เวลาทำการ', detail: '10:00 - 22:00 น.' },
  { icon: TimerReset, title: 'จองได้สูงสุด', detail: '3 ชั่วโมง/ครั้ง' },
  { icon: CalendarCheck, title: 'ล็อกสนามรอโอนเงิน', detail: 'ภายใน 15 นาที' },
  { icon: QrCode, title: 'ชำระเงินผ่าน', detail: 'พร้อมเพย์ (PromptPay QR)' },
  { icon: BellRing, title: 'ยกเลิกได้เอง', detail: 'เมื่อยังไม่ชำระเงิน' },
];

const HomePage = () => {
  const [selectedSport, setSelectedSport] = useState('ทั้งหมด');
  const [sports, setSports] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingCourt, setBookingCourt] = useState(null);



  useEffect(() => {
    const loadCourtData = async () => {
      try {
        setLoading(true);
        setError('');

        const [sportData, courtData] = await Promise.all([
          courtService.getSports(),
          courtService.getCourts(),
        ]);

        const sportNames = new Map(sportData.map((sport) => [sport.id, sport.name]));

        setSports([
          { name: 'ทั้งหมด', icon: Grid2X2 },
          ...sportData.map((sport) => ({
            id: sport.id,
            name: sport.name,
            icon: sportIcons[sport.name] || Grid2X2,
          })),
        ]);

        setCourts(courtData.map((court) => ({
          ...court,
          sport: sportNames.get(court.sport_id) || 'ไม่ระบุประเภท',
          price: Number(court.price_per_hour),
          closed: court.status === 'maintenance',
          position: fallbackImagePositions[court.sport_id] || 'center',
        })));
      } catch (loadError) {
        console.error('Unable to load court data:', loadError);
        setError('ไม่สามารถโหลดข้อมูลสนามได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    loadCourtData();

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('scroll') === 'courts') {
      setTimeout(() => {
        document.getElementById('courts-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    }
  }, []);


  const visibleCourts = selectedSport === 'ทั้งหมด'
    ? sports
        .filter((sport) => sport.name !== 'ทั้งหมด')
        .map((sport) => courts.find((court) => court.sport_id === sport.id))
        .filter(Boolean)
    : courts
        .filter((court) => court.sport === selectedSport)
        .slice(0, 4);

  return (
    <div className="home-page pb-1 pt-2 text-[#111]">
      <section className="home-hero grid min-h-[326px] grid-cols-[35%_65%] items-center max-lg:grid-cols-1">
        <div className="home-hero-copy relative z-10 px-4 pb-12 pt-3 max-lg:pb-8 max-lg:text-center">
          <p className="mb-3 text-[16px] font-semibold uppercase text-[#08752e]">WELCOME TO</p>
          <h1 className="text-[43px] font-bold leading-none tracking-[-1.5px] max-sm:text-[36px]">SPORT COMPLEX</h1>
          <h2 className="mt-4 text-[19px] font-semibold leading-[1.55]">จองสนามกีฬาออนไลน์<br />ง่าย สะดวก รวดเร็ว</h2>
          <p className="mt-2 text-[15px] leading-6">เปิดให้บริการทุกวัน 10:00 - 22:00 น.<br />จองสนามล่วงหน้าได้ทันที</p>
          <Link to="/courts" className="mt-5 inline-flex h-[48px] items-center gap-4 rounded-[10px] bg-[#08752e] px-8 text-[16px] font-semibold text-white shadow-[0_6px_15px_rgba(8,117,46,0.2)] transition hover:-translate-y-0.5 hover:bg-[#056326]">
            จองสนามทันที <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="home-hero-image relative h-[286px] self-start overflow-visible max-lg:mx-2 max-lg:h-[310px] max-sm:h-[245px]">
          <img src={heroImage} alt="สนามกีฬากลางแจ้ง SPORT COMPLEX" className="h-full w-full rounded-[98px_20px_20px_20px] object-cover max-sm:rounded-[55px_16px_16px_16px]" />
          <div className="absolute -bottom-16 left-0 right-2 grid min-h-[100px] grid-cols-4 items-center rounded-[20px] bg-white px-7 shadow-[0_7px_25px_rgba(0,0,0,0.11)] max-lg:relative max-lg:-bottom-3 max-lg:right-0 max-lg:grid-cols-2 max-lg:gap-4 max-lg:px-5 max-lg:py-5 max-sm:grid-cols-1">
            {benefits.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex items-center gap-4 border-r border-[#e0e8e2] px-4 last:border-0 max-lg:border-0">
                <Icon className="h-9 w-9 shrink-0 text-[#08752e]" />
                <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-[13px]">{detail}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="courts-section" className="sport-filter mt-1 border-t border-[#e9e9e9] px-1 pt-3 max-lg:mt-32 max-sm:mt-80">
        <h2 className="mb-2.5 text-[19px] font-semibold">เลือกประเภทกีฬา</h2>

        <div className="grid grid-cols-5 gap-5 max-lg:grid-cols-3 max-sm:grid-cols-2 max-sm:gap-3">
          {sports.map(({ name, icon }) => {
            const Icon = typeof icon === 'string' ? null : icon;
            const active = selectedSport === name;
            return (
              <button key={name} onClick={() => setSelectedSport(name)} className={`flex h-[42px] items-center justify-center gap-3 rounded-full text-[14px] font-medium shadow-[0_3px_12px_rgba(0,0,0,0.07)] transition ${active ? 'bg-[#08752e] text-white' : 'bg-white hover:text-[#08752e]'}`}>
                {Icon ? <Icon className="h-6 w-6" /> : <span className="text-[22px]">{icon}</span>}{name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="featured-courts px-1 pt-3.5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[21px] font-semibold">สนามแนะนำ</h2>
          <Link to="/courts" className="flex items-center gap-2 font-medium text-[#08752e]">ดูทั้งหมด <ArrowRight className="h-5 w-5" /></Link>
        </div>
        <div className="grid auto-rows-fr grid-cols-4 items-stretch gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {loading && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[14px] bg-white shadow-[0_3px_14px_rgba(0,0,0,0.08)]">
              <div className="aspect-video animate-pulse bg-[#e7eee9]" />
              <div className="space-y-3 p-3">
                <div className="h-5 w-4/5 animate-pulse rounded bg-[#e7eee9]" />
                <div className="h-4 w-2/5 animate-pulse rounded bg-[#edf2ee]" />
                <div className="h-5 w-3/5 animate-pulse rounded bg-[#e7eee9]" />
                <div className="h-10 animate-pulse rounded bg-[#dce9e0]" />
              </div>
            </div>
          ))}

          {!loading && error && (
            <div className="col-span-full rounded-[14px] border border-red-200 bg-red-50 px-5 py-8 text-center text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && visibleCourts.length === 0 && (
            <div className="col-span-full rounded-[14px] border border-[#dce7df] bg-white px-5 py-8 text-center text-gray-500">
              ไม่พบสนามในประเภทกีฬาที่เลือก
            </div>
          )}

          {!loading && !error && visibleCourts.map((court) => (
            <article key={court.id} className="court-card flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_3px_14px_rgba(0,0,0,0.1)] transition hover:-translate-y-1 hover:shadow-lg">
              {court.image_url ? (
                <img src={court.image_url} alt={court.name} className="aspect-video w-full object-cover" />
              ) : (
                <div className="aspect-video bg-cover bg-no-repeat" style={{ backgroundImage: `url(${courtPanorama})`, backgroundPosition: court.position, backgroundSize: '400% 100%' }} />
              )}
              <div className="court-card-body flex flex-1 flex-col p-3">
                <h3 className="min-h-[52px] text-[17px] font-semibold leading-[26px]">{court.name}</h3>
                <p className="mt-2 text-[14px]">{court.sport}</p>
                <p className="mt-2 text-[17px] font-semibold">{court.price} บาท / ชั่วโมง</p>
                <div className="mt-2 min-h-[20px]">
                  {court.closed && <p className="flex items-center gap-1 text-[13px] font-semibold text-red-600"><RefreshCcw className="h-4 w-4" /> ปิดปรับปรุงชั่วคราว</p>}
                </div>
                <button
                  type="button"
                  onClick={() => !court.closed && setBookingCourt(court)}
                  disabled={court.closed}
                  className={`mt-auto flex h-[41px] w-full shrink-0 items-center justify-center rounded-[7px] text-[14px] font-medium cursor-pointer transition ${
                    court.closed
                      ? 'pointer-events-none bg-[#e4e4e4] text-[#666]'
                      : 'bg-[#08752e] text-white hover:bg-[#056326]'
                  }`}
                >
                  {court.closed ? 'ปิดปรับปรุงชั่วคราว' : 'เช็ครอบเวลาว่าง / จองสนาม'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-5 rounded-[16px] border border-[#e3eee6] bg-[#f5faf7] px-5 py-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {serviceInfo.map(({ icon: Icon, title, detail }) => (
          <div key={title} className="flex items-center justify-center gap-4 border-r border-[#dce7df] px-4 last:border-0 max-lg:justify-start max-lg:border-0 max-lg:py-2">
            <Icon className="h-9 w-9 shrink-0 text-[#08752e]" />
            <div><h3 className="text-[14px] font-semibold">{title}</h3><p className="mt-1 text-[13px]">{detail}</p></div>
          </div>
        ))}
      </section>

      {bookingCourt && (
        <BookingModal
          court={bookingCourt}
          fallbackImage={courtPanorama}
          onClose={() => setBookingCourt(null)}
        />
      )}
    </div>
  );
};

export default HomePage;


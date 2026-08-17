import { Globe2, MessageCircle, Phone, PhoneCall } from 'lucide-react';
import sportBg from '../../assets/bg.png';

const contacts = [
  {
    label: 'Facebook',
    value: 'SPORT COMPLEX',
    detail: 'ติดตามข่าวสาร โปรโมชั่น และกิจกรรมของเรา',
    icon: Globe2,
    color: '#1877f2',
    soft: '#eaf3ff',
  },
  {
    label: 'LINE Official',
    value: '@SPORTCOMPLEX',
    detail: 'สอบถามรอบว่างและข้อมูลการใช้บริการ',
    icon: MessageCircle,
    color: '#06a947',
    soft: '#e9f9ef',
  },
  {
    label: 'เบอร์โทรศัพท์',
    value: '090-221-4698',
    detail: 'โทรติดต่อเจ้าหน้าที่ SPORT COMPLEX',
    icon: Phone,
    color: '#07883d',
    soft: '#e8f7ee',
  },
];

const ContactPage = () => (
  <section
    className="relative my-8 min-h-[590px] overflow-hidden rounded-[28px] border border-[#dfe9e2] bg-white px-6 py-10 shadow-[0_16px_45px_rgba(17,66,39,.08)] sm:px-10"
    style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.38),rgba(255,255,255,.38)),url(${sportBg})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
  >
    <div className="relative mx-auto max-w-[980px]">
      <header className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-[20px] bg-gradient-to-br from-[#0aa04a] to-[#05672f] text-white shadow-[0_10px_24px_rgba(7,136,61,.24)]"><PhoneCall className="h-8 w-8" /></span>
        <p className="mt-5 text-xs font-bold tracking-[.22em] text-[#07883d]">SPORT COMPLEX</p>
        <h1 className="mt-2 text-3xl font-black text-[#102039] sm:text-4xl">ติดต่อเรา</h1>
        <p className="mx-auto mt-3 max-w-[610px] text-sm leading-7 text-[#667286] sm:text-base">หากต้องการสอบถามข้อมูลสนาม รอบเวลา หรือรายละเอียดการให้บริการ สามารถติดต่อเราได้ผ่านช่องทางด้านล่าง</p>
      </header>

      <div className="mt-9 grid gap-5 md:grid-cols-3">
        {contacts.map(({ label, value, detail, icon: Icon, color, soft }) => (
          <article key={label} className="flex min-h-[220px] flex-col items-center rounded-[22px] border border-[#dce8e0] bg-white/90 p-6 text-center shadow-[0_8px_24px_rgba(20,53,34,.07)]">
            <span className="grid h-14 w-14 place-items-center rounded-[18px]" style={{ color, background: soft }}><Icon className="h-7 w-7" /></span>
            <p className="mt-5 text-sm font-medium text-[#718076]">{label}</p>
            <strong className="mt-1 text-xl text-[#102039]">{value}</strong>
            <p className="mt-3 text-xs leading-5 text-[#778397]">{detail}</p>
            <span className="mt-auto pt-4 text-sm font-semibold" style={{ color }}>ข้อมูลการติดต่อ</span>
          </article>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 rounded-[16px] border border-[#cae5d4] bg-[#eff9f2]/90 px-5 py-4 text-center text-sm text-[#28603f]"><Phone className="h-5 w-5 shrink-0 text-[#07883d]" />เปิดให้บริการทุกวัน เวลา 10:00–22:00 น.</div>
    </div>
  </section>
);

export default ContactPage;

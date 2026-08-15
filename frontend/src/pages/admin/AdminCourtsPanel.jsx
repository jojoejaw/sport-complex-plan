import { useEffect, useMemo, useState } from 'react';
import { CirclePlus, Grid2X2, ImageOff, Pencil, Search, Trash2, Wrench, X } from 'lucide-react';
import courtService from '../../services/courtService';
import ConfirmModal from '../../components/common/ConfirmModal';

const emptyForm = { name: '', sport_id: '', description: '', price_per_hour: '', image_url: '' };

const AdminCourtsPanel = ({ courts, setCourts, loading }) => {
  const [sports, setSports] = useState([]);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState(emptyForm);
  const [editingCourt, setEditingCourt] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingCourtId, setUpdatingCourtId] = useState(null);
  const [deletingCourt, setDeletingCourt] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    courtService.getSports()
      .then((data) => setSports(Array.isArray(data) ? data : []))
      .catch(() => setMessage({ type: 'error', text: 'ไม่สามารถโหลดประเภทกีฬาได้' }));
  }, []);

  const sportNames = useMemo(() => new Map(sports.map((sport) => [String(sport.id), sport.name])), [sports]);
  const filteredCourts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('th-TH');
    return courts.filter((court) => {
      const matchesSearch = !keyword || String(court.name || '').toLocaleLowerCase('th-TH').includes(keyword);
      const matchesSport = sportFilter === 'all' || String(court.sport_id) === sportFilter;
      const matchesStatus = statusFilter === 'all' || court.status === statusFilter;
      return matchesSearch && matchesSport && matchesStatus;
    });
  }, [courts, search, sportFilter, statusFilter]);

  const openCreate = () => {
    setEditingCourt(null);
    setForm(emptyForm);
    setMessage({ type: '', text: '' });
    setFormOpen(true);
  };

  const openEdit = (court) => {
    setEditingCourt(court);
    setForm({
      name: court.name || '', sport_id: String(court.sport_id || ''),
      description: court.description || '', price_per_hour: String(court.price_per_hour ?? ''),
      image_url: court.image_url || '',
    });
    setMessage({ type: '', text: '' });
    setFormOpen(true);
  };

  const refreshCourts = async () => {
    const data = await courtService.getCourts();
    setCourts(Array.isArray(data) ? data : []);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    const price = Number(form.price_per_hour);
    if (!form.name.trim() || !form.sport_id || !Number.isFinite(price) || price <= 0) {
      setMessage({ type: 'error', text: 'กรุณากรอกชื่อ ประเภทกีฬา และราคาให้ถูกต้อง' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = { ...form, sport_id: Number(form.sport_id), price_per_hour: price };
      if (editingCourt) await courtService.updateCourt(editingCourt.id, payload);
      else await courtService.createCourt(payload);
      await refreshCourts();
      setFormOpen(false);
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลสนามได้' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (court) => {
    if (updatingCourtId !== null) return;
    const nextStatus = court.status === 'maintenance' ? 'active' : 'maintenance';
    setUpdatingCourtId(court.id);
    setMessage({ type: '', text: '' });
    try {
      await courtService.updateCourt(court.id, { status: nextStatus });
      setCourts((current) => current.map((item) => item.id === court.id ? { ...item, status: nextStatus } : item));
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะสนามได้' });
    } finally {
      setUpdatingCourtId(null);
    }
  };

  const deleteCourt = async () => {
    if (!deletingCourt || deleting) return;
    setDeleting(true);
    setMessage({ type: '', text: '' });
    try {
      await courtService.deleteCourt(deletingCourt.id);
      setCourts((current) => current.filter((court) => court.id !== deletingCourt.id));
      setDeletingCourt(null);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'ไม่สามารถลบสนามได้' });
      setDeletingCourt(null);
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = courts.filter((court) => court.status !== 'maintenance').length;
  const maintenanceCount = courts.filter((court) => court.status === 'maintenance').length;

  return <div>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-[18px] border border-[#e2e9e5] bg-white px-5 py-4 shadow-sm">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#079143]">ADMIN / COURTS</p><h1 className="mt-1 text-2xl font-bold text-[#101a33]">จัดการสนาม</h1><p className="mt-1 text-sm text-[#657085]">จัดการข้อมูล ราคา และสถานะการให้บริการของสนามทั้งหมด</p></div>
      <button type="button" onClick={openCreate} className="flex h-11 items-center gap-2 rounded-xl bg-[#07883d] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,136,61,.2)] transition hover:bg-[#066f33]"><CirclePlus className="h-5 w-5" />เพิ่มสนามใหม่</button>
    </div>

    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      {[['สนามทั้งหมด', courts.length, Grid2X2, '#1478d4', '#eaf4ff'], ['เปิดให้บริการ', activeCount, Grid2X2, '#07883d', '#e8f8ee'], ['ปิดปรับปรุง', maintenanceCount, Wrench, '#e84855', '#ffedef']].map(([label, value, Icon, color, background]) => <div key={label} className="flex items-center gap-3 rounded-[16px] border border-[#e3e8ed] bg-white p-4 shadow-sm"><span className="grid h-12 w-12 place-items-center rounded-xl" style={{ color, background }}><Icon /></span><div><p className="text-xs text-[#697386]">{label}</p><strong className="text-2xl">{value}</strong></div></div>)}
    </div>

    {message.type === 'error' && message.text && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message.text}</div>}

    <section className="rounded-[20px] border border-[#dfe8e2] bg-gradient-to-b from-white to-[#f7fbf8] p-4 shadow-[0_8px_24px_rgba(31,67,45,0.07)]">
      <div className="mb-4 flex flex-wrap gap-3 rounded-[15px] border border-[#e2e9e5] bg-white p-2 shadow-[0_3px_10px_rgba(31,67,45,0.05)]">
        <label className="group relative min-w-[240px] flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718077] transition-colors group-focus-within:text-[#07883d]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อสนาม" className="h-10 w-full rounded-[10px] border border-transparent bg-[#f5f8f6] pl-10 pr-3 text-sm outline-none transition focus:border-[#95caaa] focus:bg-white focus:ring-2 focus:ring-[#0b9142]/10" /></label>
        <select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)} className="h-10 min-w-[170px] rounded-[10px] border border-[#dce5df] bg-white px-3 text-sm font-medium text-[#28364a] outline-none transition focus:border-[#079143] focus:ring-2 focus:ring-[#0b9142]/10"><option value="all">กีฬาทุกประเภท</option>{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 min-w-[160px] rounded-[10px] border border-[#dce5df] bg-white px-3 text-sm font-medium text-[#28364a] outline-none transition focus:border-[#079143] focus:ring-2 focus:ring-[#0b9142]/10"><option value="all">ทุกสถานะ</option><option value="active">เปิดให้บริการ</option><option value="maintenance">ปิดปรับปรุง</option></select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredCourts.map((court) => <article key={court.id} className="overflow-hidden rounded-[18px] border border-[#dce5df] bg-white shadow-[0_5px_16px_rgba(24,55,36,0.07)] transition-[border-color,box-shadow] duration-200 hover:border-[#a9ceb6] hover:shadow-[0_9px_22px_rgba(24,76,43,0.12)]">
          <div className="relative h-[120px] overflow-hidden bg-[#edf2ef]">
            {court.image_url ? <img src={court.image_url} alt={court.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[#8b978f]"><ImageOff className="h-9 w-9" /></div>}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071b18]/70 via-transparent to-black/10" />
            <span className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-sm ${court.status === 'maintenance' ? 'border-red-100 bg-[#fff2f2] text-[#d92f3e]' : 'border-green-100 bg-[#edfff3] text-[#087b3b]'}`}><i className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${court.status === 'maintenance' ? 'bg-[#e83f4d]' : 'bg-[#0aa34b]'}`} />{court.status === 'maintenance' ? 'ปิดปรับปรุง' : 'เปิดให้บริการ'}</span>
            <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-3 text-white"><span className="rounded-md bg-black/25 px-2 py-1 text-[10px] font-semibold backdrop-blur-sm">{sportNames.get(String(court.sport_id)) || `กีฬา ID ${court.sport_id}`}</span><strong className="text-[17px] leading-none drop-shadow">฿{Number(court.price_per_hour || 0).toLocaleString('th-TH')} <small className="text-[10px] font-medium">/ ชั่วโมง</small></strong></div>
          </div>
          <div className="relative p-3.5"><span className={`absolute left-0 top-4 h-9 w-1 rounded-r-full ${court.status === 'maintenance' ? 'bg-[#e94250]' : 'bg-[#099747]'}`} /><div className="min-w-0 pl-1.5"><h3 className="truncate text-[16px] font-bold leading-5 text-[#111b32]">{court.name}</h3><p className="mt-1 line-clamp-1 min-h-5 text-[11px] leading-5 text-[#758079]">{court.description || 'สนามพร้อมให้บริการ กรุณาเพิ่มรายละเอียดเพิ่มเติม'}</p></div><div className="mt-3 grid grid-cols-[.8fr_.55fr_1.15fr] gap-2 border-t border-dashed border-[#dfe7e2] pt-3"><button type="button" onClick={() => openEdit(court)} className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-[#c8d7ce] bg-white text-xs font-semibold text-[#17442b] transition-colors hover:border-[#07883d] hover:bg-[#eff8f2]"><Pencil className="h-3.5 w-3.5" />แก้ไข</button><button type="button" onClick={() => setDeletingCourt(court)} className="flex h-9 items-center justify-center gap-1 rounded-[10px] border border-red-200 bg-white text-xs font-semibold text-red-600 transition-colors hover:bg-red-50" aria-label={`ลบ ${court.name}`}><Trash2 className="h-3.5 w-3.5" />ลบ</button><button type="button" disabled={updatingCourtId !== null} onClick={() => toggleStatus(court)} className={`h-9 rounded-[10px] text-xs font-semibold text-white shadow-sm transition-colors disabled:cursor-wait ${court.status === 'maintenance' ? 'bg-gradient-to-r from-[#087a3a] to-[#0aa34b] hover:from-[#066b32] hover:to-[#078b40]' : 'bg-gradient-to-r from-[#df3544] to-[#ef4a57] hover:from-[#c82d3a] hover:to-[#db3b48]'}`}>{court.status === 'maintenance' ? 'เปิดให้บริการ' : 'ปิดปรับปรุงชั่วคราว'}</button></div></div>
        </article>)}
      </div>
      {!loading && filteredCourts.length === 0 && <div className="grid min-h-[260px] place-items-center text-center text-[#778194]"><div><Grid2X2 className="mx-auto mb-3 h-12 w-12 opacity-40" /><p className="font-semibold">ไม่พบสนามที่ตรงกับเงื่อนไข</p></div></div>}
    </section>

    <ConfirmModal
      isOpen={Boolean(deletingCourt)}
      title="ยืนยันการลบสนาม"
      message={deletingCourt ? `ต้องการลบ ${deletingCourt.name} ใช่หรือไม่? การดำเนินการนี้ย้อนกลับไม่ได้` : ''}
      confirmText={deleting ? 'กำลังลบ...' : 'ลบสนาม'}
      confirmDisabled={deleting}
      onConfirm={deleteCourt}
      onCancel={() => !deleting && setDeletingCourt(null)}
    >
      <p className="text-sm text-[#596376]">หากสนามมีประวัติการจอง ระบบจะไม่อนุญาตให้ลบและควรเปลี่ยนเป็นปิดปรับปรุงแทน</p>
    </ConfirmModal>

    {formOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#071421]/45 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setFormOpen(false); }}>
      <form onSubmit={submitForm} className="w-full max-w-[600px] rounded-[22px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between"><div><h2 className="text-xl font-bold">{editingCourt ? 'แก้ไขข้อมูลสนาม' : 'เพิ่มสนามใหม่'}</h2><p className="mt-1 text-sm text-[#697386]">กรอกข้อมูลที่จำเป็นให้ครบถ้วน</p></div><button type="button" disabled={saving} onClick={() => setFormOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-[#f2f5f7]"><X /></button></div>
        {message.type === 'error' && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message.text}</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">ชื่อสนาม *<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d8e0e5] px-3 font-normal outline-none focus:border-[#07883d]" /></label><label className="text-sm font-semibold">ประเภทกีฬา *<select value={form.sport_id} onChange={(event) => setForm({ ...form, sport_id: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d8e0e5] bg-white px-3 font-normal outline-none"><option value="">เลือกประเภทกีฬา</option>{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label><label className="text-sm font-semibold">ราคา / ชั่วโมง *<input type="number" min="1" step="0.01" value={form.price_per_hour} onChange={(event) => setForm({ ...form, price_per_hour: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d8e0e5] px-3 font-normal outline-none focus:border-[#07883d]" /></label><label className="text-sm font-semibold">URL รูปสนาม<input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d8e0e5] px-3 font-normal outline-none focus:border-[#07883d]" /></label><label className="text-sm font-semibold sm:col-span-2">รายละเอียด<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 w-full resize-none rounded-xl border border-[#d8e0e5] p-3 font-normal outline-none focus:border-[#07883d]" /></label></div>
        <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={saving} onClick={() => setFormOpen(false)} className="h-11 rounded-xl border border-[#ccd7d1] font-semibold">ยกเลิก</button><button type="submit" disabled={saving} className="h-11 rounded-xl bg-[#07883d] font-semibold text-white disabled:opacity-60">{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button></div>
      </form>
    </div>}
  </div>;
};

export default AdminCourtsPanel;

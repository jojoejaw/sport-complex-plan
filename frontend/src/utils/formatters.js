// ฟังก์ชันจัดการฟอร์แมตข้อมูล (Formatters Utility)

// ฟอร์แมตจำนวนเงินเป็น บาท (THB)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 ฿';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// ฟอร์แมตวันที่เป็นรูปแบบภาษาไทย (เช่น 8 สิงหาคม 2026)
export const formatDateTH = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// ฟอร์แมตเวลา (เช่น 10:00 - 11:00 น.)
export const formatTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return '-';
  const start = startTime.substring(0, 5);
  const end = endTime.substring(0, 5);
  return `${start} - ${end} น.`;
};

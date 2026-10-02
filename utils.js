/* ============================================================
 * core/utils.js — วันที่ไทย, escape, id, validation helpers
 * ============================================================ */
const U = (() => {
  const TH_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const TH_DAYS_SHORT = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  const TH_DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  let dayOffset = 0; // ใช้สำหรับ "จำลองวัน" ในโหมดทดลอง

  const pad = n => String(n).padStart(2, '0');
  const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const now = () => { const d = new Date(); if (dayOffset) d.setDate(d.getDate() + dayOffset); return d; };

  return {
    TH_MONTHS_SHORT, TH_MONTHS, TH_DAYS_SHORT, TH_DAYS,
    setDayOffset(n) { dayOffset = Number(n) || 0; },
    getDayOffset() { return dayOffset; },
    now,
    nowISO() { return now().toISOString(); },
    uid(p = 'id') { return p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },
    esc(s) {
      return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    dateKey, parseKey,
    todayKey() { return dateKey(now()); },
    addDays(k, n) { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); },
    /** a - b เป็นจำนวนวัน */
    diffDays(a, b) { return Math.round((parseKey(a) - parseKey(b)) / 86400000); },
    isValidKey(k) {
      if (typeof k !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(k)) return false;
      return dateKey(parseKey(k)) === k;
    },
    fmtDate(k, { year = true, weekday = false } = {}) {
      if (!k) return '-';
      const d = parseKey(k.slice(0, 10));
      const base = `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}${year ? ' ' + (d.getFullYear() + 543) : ''}`;
      return weekday ? `${TH_DAYS[d.getDay()]} ${base}` : base;
    },
    fmtTime(iso) { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())} น.`; },
    fmtDateTime(iso) { const d = new Date(iso); return `${U.fmtDate(dateKey(d))} · ${U.fmtTime(iso)}`; },
    isoToKey(iso) { return dateKey(new Date(iso)); },
    startOfWeek(k) { const d = parseKey(k); d.setDate(d.getDate() - d.getDay()); return dateKey(d); },
    /** normalize ข้อความไทย/อังกฤษสำหรับค้นหา */
    norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, '').normalize('NFC'); },
    clamp(n, a, b) { return Math.max(a, Math.min(b, n)); },
    debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
  };
})();

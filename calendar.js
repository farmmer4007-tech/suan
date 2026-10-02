/* ============================================================
 * ui/views/calendar.js — Calendar: วันนี้ / สัปดาห์ / เดือน
 * ============================================================ */
function tasksOn(dk) { return dk === U.todayKey() ? Garden.todayTasks() : Garden.tasksForDate(dk); }
function countBadge(list) {
  if (!list.length) return '<span></span>';
  const left = list.filter(t => !t.completed).length;
  return `<span class="c-count num ${left === 0 ? 'all-done' : ''}" aria-hidden="true">${left === 0 ? '✓' : left}</span>`;
}
function dayAria(dk, list) {
  const left = list.filter(t => !t.completed).length;
  return `${U.fmtDate(dk, { weekday: true })}${list.length ? `, ${list.length} งาน${left ? ` เหลือ ${left}` : ' เสร็จครบ'}` : ', ไม่มีงาน'}`;
}

Views.calendar = {
  title: () => 'ปฏิทิน',
  render() {
    const v = App.ui.calView, today = U.todayKey();
    const sel = App.ui.calSel || today;
    const viewChips = `<div class="chips" role="group" aria-label="มุมมองปฏิทิน">${[['today', 'วันนี้'], ['week', 'สัปดาห์'], ['month', 'เดือน']].map(([k, l]) => `<button class="chip" aria-pressed="${v === k}" data-act="cal-view" data-v="${k}">${l}</button>`).join('')}</div>`;
    let body = '';
    if (!Garden.plants().length && !Garden.db.tasks.length) {
      body = C.EmptyState({ icon: '📅', title: 'ยังไม่มีงานในปฏิทิน', text: 'เพิ่มต้นไม้แล้วระบบจะสร้างงานดูแลให้อัตโนมัติ', action: 'add-plant', actionLabel: '+ เพิ่มต้นไม้' });
    } else if (v === 'today') {
      const list = Garden.todayTasks();
      body = `<section class="section"><div class="day-label">📅 วันนี้ · ${U.fmtDate(today, { weekday: true })}</div>${list.length ? C.Checklist(list) : C.EmptyState({ icon: '🌿', title: 'วันนี้ไม่มีงาน' })}</section>`;
    } else if (v === 'week') {
      const start = U.startOfWeek(sel);
      const days = Array.from({ length: 7 }, (_, i) => U.addDays(start, i));
      const lists = days.map(d => tasksOn(d));
      const end = days[6];
      body = `<div class="cal-head"><button class="icon-btn" data-act="cal-shift" data-n="-7" aria-label="สัปดาห์ก่อน">${ICON.back}</button>
        <h2 class="num">${U.fmtDate(start, { year: false })} – ${U.fmtDate(end)}</h2>
        <button class="icon-btn" data-act="cal-shift" data-n="7" aria-label="สัปดาห์ถัดไป" style="transform:scaleX(-1)">${ICON.back}</button></div>
        <div class="week-strip">${days.map((d, i) => `<button class="cal-day ${d === today ? 'today' : ''}" aria-pressed="${d === sel}" data-act="cal-pick" data-d="${d}" aria-label="${dayAria(d, lists[i])}"><span class="tiny" style="color:inherit">${U.TH_DAYS_SHORT[i]}</span><b>${U.parseKey(d).getDate()}</b>${countBadge(lists[i])}</button>`).join('')}</div>
        ${days.map((d, i) => lists[i].length ? `<div class="day-group"><div class="day-label">${d === today ? 'วันนี้ · ' : ''}${U.fmtDate(d, { weekday: true, year: false })}</div>${C.Checklist(lists[i])}</div>` : '').join('') || C.EmptyState({ icon: '🌿', title: 'สัปดาห์นี้ไม่มีงาน' })}`;
    } else {
      const ym = App.ui.calMonth || today.slice(0, 7);
      const [y, m] = ym.split('-').map(Number);
      const first = new Date(y, m - 1, 1);
      const gridStart = U.addDays(U.dateKey(first), -first.getDay());
      const cells = Array.from({ length: 42 }, (_, i) => U.addDays(gridStart, i));
      const trimmed = cells.slice(35).every(d => !d.startsWith(ym)) ? cells.slice(0, 35) : cells;
      const selList = tasksOn(sel);
      body = `<div class="cal-head"><button class="icon-btn" data-act="cal-month" data-n="-1" aria-label="เดือนก่อน">${ICON.back}</button>
        <h2>${U.TH_MONTHS[m - 1]} ${y + 543}</h2>
        <button class="icon-btn" data-act="cal-month" data-n="1" aria-label="เดือนถัดไป" style="transform:scaleX(-1)">${ICON.back}</button></div>
        <div class="cal-grid" role="grid" aria-label="ปฏิทินงาน">${U.TH_DAYS_SHORT.map(d => `<div class="cal-dow" role="columnheader">${d}</div>`).join('')}
        ${trimmed.map(d => { const l = tasksOn(d); return `<button class="cal-day ${d.startsWith(ym) ? '' : 'other'} ${d === today ? 'today' : ''}" aria-pressed="${d === sel}" data-act="cal-pick" data-d="${d}" aria-label="${dayAria(d, l)}"><span>${U.parseKey(d).getDate()}</span>${countBadge(l)}</button>`; }).join('')}</div>
        <p class="tiny">ตัวเลข = จำนวนงานที่ยังไม่เสร็จ · ✓ = เสร็จครบ</p>
        <section class="section"><div class="day-label">${sel === today ? '📅 วันนี้ · ' : ''}${U.fmtDate(sel, { weekday: true })}</div>
          ${selList.length ? C.Checklist(selList) : C.EmptyState({ icon: '🌿', title: 'ไม่มีงานวันนี้' })}</section>`;
    }
    return `<div class="page"><div class="page-head"><h1>📅 ปฏิทินดูแลสวน</h1></div>${viewChips}${body}
      <button class="btn ghost" data-act="add-task-sheet">+ เพิ่มงานเอง</button></div>`;
  },
};

Object.assign(Actions, {
  'cal-view'(el) { App.ui.calView = el.dataset.v; App.render(); },
  'cal-pick'(el) { App.ui.calSel = el.dataset.d; App.ui.calMonth = el.dataset.d.slice(0, 7); App.render(); },
  'cal-shift'(el) { App.ui.calSel = U.addDays(App.ui.calSel || U.todayKey(), Number(el.dataset.n)); App.ui.calMonth = App.ui.calSel.slice(0, 7); App.render(); },
  'cal-month'(el) {
    const [y, m] = (App.ui.calMonth || U.todayKey().slice(0, 7)).split('-').map(Number);
    const d = new Date(y, m - 1 + Number(el.dataset.n), 1);
    App.ui.calMonth = U.dateKey(d).slice(0, 7);
    App.ui.calSel = U.dateKey(d).slice(0, 7) === U.todayKey().slice(0, 7) ? U.todayKey() : U.dateKey(d);
    App.render();
  },
  'add-task-sheet'() {
    const draw = (E = {}) => `${Overlay.head('📝 เพิ่มงานเอง')}<form class="form" data-form="add-task" novalidate>
      ${C.Field({ id: 'atTitle', label: 'งานอะไร', err: E.title, html: '<input class="input" id="atTitle" maxlength="60" placeholder="เช่น ซื้อกระถางเพิ่ม" autofocus>' })}
      ${C.Field({ id: 'atDate', label: 'วันที่', err: E.dueDate, html: `<input class="input" type="date" id="atDate" value="${App.ui.calSel || U.todayKey()}">` })}
      ${C.Field({ id: 'atPlant', label: 'ของต้นไหน (ไม่บังคับ)', html: `<select class="input" id="atPlant"><option value="">ทั้งสวน</option>${Garden.plants().map(p => `<option value="${p.id}">${esc(Garden.plantName(p))}</option>`).join('')}</select>` })}
      <button class="btn primary" type="submit">เพิ่มงาน</button></form>`;
    Overlay.open(draw(), { label: 'เพิ่มงาน' });
    Actions['add-task'] = async () => {
      const v = id => document.getElementById(id).value;
      try { await Garden.addCustomTask({ title: v('atTitle'), dueDate: v('atDate'), userPlantId: v('atPlant') || null }); Overlay.close(); Toast.show('เพิ่มงานแล้ว'); App.render(); }
      catch (err) { if (err.fields) Overlay.update(draw(err.fields)); }
    };
  },
});

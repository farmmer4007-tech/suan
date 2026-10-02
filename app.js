/* ============================================================
 * ui/app.js — Router, state, event delegation, boot
 * ============================================================ */
const App = {
  tab: 'today',
  stack: [],          // [{ view, params }]
  ui: {
    plantFilter: 'all', plantSort: 'care', calView: 'month', calMonth: null, calSel: null,
    detailTab: 'overview', form: null, taskDraft: {}, doc: null, ob: null, showDone: false, search: '',
  },
  root: null,
  bootError: null,

  current() { return this.stack.length ? this.stack[this.stack.length - 1] : { view: this.tab, params: {} }; },
  go(view, params = {}) { Overlay.closeAll(); this.stack.push({ view, params }); this.render({ scrollTop: true }); },
  replace(view, params = {}) { this.stack[this.stack.length - 1] = { view, params }; this.render({ scrollTop: true }); },
  back() { Overlay.closeAll(); this.stack.pop(); this.render({ scrollTop: true }); },
  setTab(tab) { Overlay.closeAll(); this.tab = tab; this.stack = []; this.render({ scrollTop: true }); },

  render({ scrollTop = false } = {}) {
    const root = this.root;
    if (this.bootError) { root.innerHTML = `<div class="wrap" style="padding-top:40px">${C.ErrorState({ action: 'reload' })}</div>`; return; }
    if (!Garden.db.user) { root.innerHTML = Views.onboarding(); this.afterRender(scrollTop); return; }
    const cur = this.current();
    const V = Views[cur.view];
    let body, title, isRoot = !this.stack.length;
    try {
      if (!V) throw new Error('no view');
      title = V.title ? V.title(cur.params) : '';
      body = V.render(cur.params);
    } catch (e) {
      console.error(e);
      body = C.ErrorState({ action: 'go-home' }); title = 'ขออภัย';
    }
    const banner = Garden.repo.persistent ? '' : `<div class="banner" role="status">เบราว์เซอร์นี้บันทึกข้อมูลไม่ได้ ข้อมูลจะหายเมื่อปิดหน้า ลองเปิดในหน้าต่างปกติ (ไม่ใช่โหมดส่วนตัว)</div>`;
    const scrollY = window.scrollY;
    root.innerHTML = `<div class="app">${C.BottomNavigation(this.tab)}<div class="main">${banner}${C.AppHeader({ title, back: !isRoot })}
      <main class="wrap" id="main" tabindex="-1">${body}</main></div></div>`;
    this.afterRender(scrollTop);
    if (!scrollTop) window.scrollTo(0, scrollY);
    if (V && V.after) V.after(cur.params, root);
  },
  afterRender(scrollTop) {
    hydratePhotos(this.root);
    if (scrollTop) { window.scrollTo(0, 0); const m = document.getElementById('main') || this.root.querySelector('h1'); if (m && this.stack.length) m.focus({ preventScroll: true }); }
    const h = document.getElementById('appHeader'); if (h) h.classList.toggle('scrolled', window.scrollY > 4);
  },
  refresh() { if (!Overlay.isOpen) this.render(); else this.render(); },
};

/* ---------- Actions (event delegation) ---------- */
const Actions = {
  'tab': el => App.setTab(el.dataset.tab),
  'back': () => App.back(),
  'go-home': () => App.setTab('today'),
  'reload': () => location.reload(),
  'retry': () => App.render(),
  'close-overlay': () => Overlay.close(),
  'open-plant': el => { App.ui.detailTab = 'overview'; App.go('plant', { id: el.dataset.id }); },
  'open-task': el => { App.ui.taskDraft = {}; App.go('task', { id: el.dataset.id }); },
  'open-species': el => App.go('species', { id: el.dataset.id }),
  'open-article': el => { Overlay.closeAll(); App.go('article', { id: el.dataset.id }); },
  'open-search': () => { App.ui.search = ''; App.go('search'); },
  'open-notifs': () => openNotifications(),
  'add-plant': el => { App.ui.form = null; App.go('plantForm', { speciesId: el.dataset.species || '' }); },
  'see-all-tasks': () => { App.ui.calView = 'today'; App.setTab('calendar'); },
  'see-all-plants': () => App.setTab('plants'),
  'toggle-done': () => { App.ui.showDone = !App.ui.showDone; App.render(); },

  async 'task-check'(el) {
    const id = el.dataset.id;
    const t = Garden.findTask(id);
    if (!t) return;
    if (t.completed) { await Garden.uncompleteTask(id); Toast.show('ยกเลิกสถานะเสร็จแล้ว'); App.render(); return; }
    // งานที่ต้องการผลลัพธ์ → เปิดรายละเอียด/sheet
    if (t.type === 'SOIL_CHECK') return openWaterSheet(t.userPlantId, t.id);
    if (t.type === 'PHOTO' || t.type === 'PLANTING' || t.type === 'FERTILIZER') { App.ui.taskDraft = {}; return App.go('task', { id }); }
    el.classList.add('pop');
    const li = el.closest('.task'); if (li) li.classList.add('done');
    await finishTask(id, {});
  },
};

async function finishTask(id, result) {
  const before = Garden.todayTasks().filter(t => !t.completed).length;
  const res = await Garden.completeTask(id, result);
  const after = Garden.todayTasks().filter(t => !t.completed).length;
  setTimeout(() => {
    if (App.current().view === 'task') App.back(); else App.render();
    if (res.planted) {
      const fd = Garden.firstDayProgress();
      celebrate(fd.hasPrep && !fd.active ? 'เก่งมาก! คุณปลูกต้นแรกแล้ว' : `ปลูก${Garden.plantName(Garden.plant(res.task.userPlantId))}แล้ว!`, 'จากนี้ระบบจะบอกงานดูแลให้ทุกวัน เริ่มจากตรวจดินพรุ่งนี้เช้า');
    } else if (before > 0 && after === 0) {
      celebrate('วันนี้ดูแลสวนครบแล้ว!', 'พรุ่งนี้กลับมาดูงานใหม่ได้เลย สวนของคุณกำลังเติบโต 🌱');
    } else {
      Toast.show(`✅ เสร็จแล้ว: ${res.task.title}${after ? ` · เหลืออีก ${after} งาน` : ''}`, { action: () => Garden.uncompleteTask(id).then(() => App.render()), actionLabel: 'เลิกทำ' });
    }
    res.newBadges.forEach((b, i) => setTimeout(() => Toast.show(`${b.emoji} ได้รับเหรียญ "${b.label}"`), 900 + i * 600));
  }, 260);
}

function celebrate(title, text) {
  confetti();
  Overlay.open(`<div class="celebrate"><div class="big" aria-hidden="true">🎉</div><h2>${esc(title)}</h2><p class="muted">${esc(text)}</p>
    <button class="btn primary block" data-act="close-overlay" autofocus>เยี่ยมเลย</button></div>`, { center: true, label: title });
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = Actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset && el.dataset.bind) {
    const [obj, key] = el.dataset.bind.split('.');
    const target = App.ui[obj]; if (target) target[key] = el.type === 'checkbox' ? el.checked : el.value;
  }
  if (el.dataset && el.dataset.live && Actions[el.dataset.live]) Actions[el.dataset.live](el, e);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset && el.dataset.upload !== undefined && el.files && el.files[0]) handleUpload(el);
  else if (el.dataset && el.dataset.change && Actions[el.dataset.change]) Actions[el.dataset.change](el, e);
});
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.dataset.form && Actions[f.dataset.form]) { e.preventDefault(); Actions[f.dataset.form](f, e); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && Overlay.isOpen) Overlay.close(); });
window.addEventListener('scroll', () => { const h = document.getElementById('appHeader'); if (h) h.classList.toggle('scrolled', window.scrollY > 4); }, { passive: true });

async function handleUpload(input) {
  const plantId = input.dataset.upload, taskId = input.dataset.task;
  const file = input.files[0];
  const noteEl = document.getElementById('photoNote');
  const note = noteEl ? noteEl.value : '';
  try {
    Toast.show('กำลังบันทึกรูป...', { ms: 1200 });
    await Garden.addPhoto(plantId, file, note);
    if (taskId) { await finishTask(taskId, { photo: true }); return; }
    Toast.show('📷 บันทึกรูปแล้ว');
    Overlay.closeAll();
    App.render();
  } catch (err) {
    Toast.show(err.message === 'not-image' ? 'ไฟล์นี้ไม่ใช่รูปภาพ ลองเลือกรูปใหม่อีกครั้ง' : 'ขออภัย บันทึกรูปไม่สำเร็จ ลองอีกครั้งนะครับ', { ms: 4000 });
  }
  input.value = '';
}

/* ---------- Boot ---------- */
async function boot() {
  App.root = document.getElementById('app');
  App.root.innerHTML = C.LoadingState();
  try {
    let adapter;
    try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); adapter = new LocalStorageAdapter(STORAGE_KEY); }
    catch (e) { adapter = new MemoryAdapter(); }
    const repo = await new Repository(adapter).init();
    Garden.init(repo);
    U.setDayOffset(repo.db.meta.dayOffset || 0);
    ServiceRegistry.notifications = new NotificationService([new InAppNotificationChannel(repo)]);
    App.ui.calMonth = U.todayKey().slice(0, 7);
    App.ui.calSel = U.todayKey();
    await Garden.runDailyNotifications();
    App.bootError = null;
  } catch (e) {
    console.error(e);
    App.bootError = e;
  }
  App.render();
  // เมื่อเปิดแอปค้างข้ามวัน ให้รีเฟรชงานของวันใหม่
  let lastDay = U.todayKey();
  setInterval(async () => {
    if (U.todayKey() !== lastDay && Garden.db.user) { lastDay = U.todayKey(); await Garden.runDailyNotifications(); App.render(); }
  }, 60000);
}

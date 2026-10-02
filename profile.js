/* ============================================================
 * ui/views/profile.js — สวนของฉัน (Profile / Settings / Gardens / Badges / Data)
 * ============================================================ */
Views.profile = {
  title: () => 'สวนของฉัน',
  render() {
    const u = Garden.db.user;
    const exp = EXPERIENCE.find(x => x.v === u.experienceLevel) || EXPERIENCE[0];
    const doneCount = Object.values(Garden.db.taskState).filter(s => s.completed).length + Garden.db.tasks.filter(t => t.completed).length;
    const growth = Garden.gardenGrowth();
    return `<div class="page">
      <section class="hero"><div class="hero-row"><span class="brand-mark" style="width:56px;height:56px;font-size:1.8rem;border-radius:18px" aria-hidden="true">${exp.emoji}</span>
        <div style="min-width:0;flex:1"><h1>คุณ${esc(u.name)}</h1><p class="muted">${exp.label} · 📍 ${esc(u.province)}</p></div>
        <button class="btn sm ghost" data-act="edit-profile">แก้ไข</button></div>
        <div class="prog-row small"><span>สวนของคุณเติบโต</span><b class="num">${growth}%</b></div>${C.ProgressBar(growth, { label: 'สวนของคุณเติบโต' })}
        <div class="facts"><div class="fact"><div class="k">ดูแลมาแล้ว</div><div class="v num">${Garden.careDays()} วัน</div></div>
          <div class="fact"><div class="k">งานที่ทำเสร็จ</div><div class="v num">${doneCount}</div></div>
          <div class="fact"><div class="k">ต้นไม้</div><div class="v num">${Garden.plants().length} ต้น</div></div></div></section>

      <section class="section"><h2>🏅 เหรียญของฉัน</h2><div class="badges">${BADGES.map(b => { const at = Garden.db.badges[b.key]; return `<div class="bdg ${at ? '' : 'locked'}"><span class="b-e" aria-hidden="true">${b.emoji}</span><b>${b.label}</b><span class="tiny">${at ? 'ได้รับ ' + U.fmtDate(U.isoToKey(at), { year: false }) : b.desc}</span></div>`; }).join('')}</div></section>

      <section class="section"><div class="section-head"><h2>🏡 สวนของฉัน</h2><button class="link-btn" data-act="garden-sheet">+ เพิ่มสวน</button></div>
        <ul class="list-plain">${Garden.gardens().map(g => { const gt = GARDEN_TYPES.find(x => x.v === g.gardenType); const sun = SUN_OPTIONS.find(x => x.v === g.sunlight); const n = Garden.plants().filter(p => p.gardenId === g.id).length;
          return `<li><button class="row-btn" data-act="garden-sheet" data-id="${g.id}"><span class="r-ico" aria-hidden="true">${gt ? gt.emoji : '🏡'}</span><span class="r-txt"><b>${esc(g.name)}</b><span class="r-sub">${esc(g.location)} · ${gt ? gt.label : ''} · แดด ${sun ? sun.label : '-'} · ${n} ต้น</span></span>${ICON.chev}</button></li>`; }).join('')}</ul></section>

      <section class="section"><h2>⚙️ อื่น ๆ</h2><ul class="list-plain">
        <li><button class="row-btn" data-act="go-fertilizers"><span class="r-ico" aria-hidden="true">🧪</span><span class="r-txt"><b>ปุ๋ยของฉัน</b><span class="r-sub">${Garden.db.fertilizers.length} รายการ · จดอัตราตามฉลาก</span></span>${ICON.chev}</button></li>
        <li><button class="row-btn" data-act="open-notifs"><span class="r-ico" aria-hidden="true">🔔</span><span class="r-txt"><b>การแจ้งเตือน</b><span class="r-sub">แจ้งเตือนในแอป (การแจ้งเตือนบนมือถือจะมาในเวอร์ชันถัดไป)</span></span>${ICON.chev}</button></li>
        <li><button class="row-btn" data-act="tab" data-tab="help"><span class="r-ico" aria-hidden="true">📚</span><span class="r-txt"><b>ความรู้สำหรับมือใหม่</b><span class="r-sub">${KB_ARTICLES.length} บทความ</span></span>${ICON.chev}</button></li>
        <li><button class="row-btn" data-act="backup-sheet"><span class="r-ico" aria-hidden="true">💾</span><span class="r-txt"><b>สำรอง / กู้คืนข้อมูล</b><span class="r-sub">ข้อมูลเก็บในเบราว์เซอร์นี้ (รูปเก็บแยกในเครื่อง)</span></span>${ICON.chev}</button></li>
      </ul></section>

      <details class="dev card flat"><summary>🧪 โหมดทดลอง (สำหรับลองดูแผนการดูแลล่วงหน้า)</summary>
        <div class="form"><p class="small muted">เลื่อนวันของแอปเพื่อดูว่างานในอนาคตจะเป็นอย่างไร ข้อมูลจริงไม่เปลี่ยน กลับเป็นวันจริงได้ทุกเมื่อ</p>
        <p>ตอนนี้: <b>${U.fmtDate(U.todayKey(), { weekday: true })}</b>${U.getDayOffset() ? ` <span class="tag yellow">เลื่อน ${U.getDayOffset() > 0 ? '+' : ''}${U.getDayOffset()} วัน</span>` : ''}</p>
        <div class="btn-row"><button class="btn sm" data-act="dev-day" data-n="1">+1 วัน</button><button class="btn sm" data-act="dev-day" data-n="7">+7 วัน</button><button class="btn sm ghost" data-act="dev-day" data-n="0">กลับวันจริง</button></div>
        <hr class="sep"><button class="btn danger sm" data-act="reset-all">ลบข้อมูลทั้งหมดและเริ่มใหม่</button></div></details>

      <section class="card flat"><h3>🗺️ กำลังพัฒนาต่อ</h3><p class="small muted">เวอร์ชันนี้เน้น "ปลูกให้รอด และรู้ว่าต้องทำอะไรวันนี้" ต่อไปจะเพิ่ม: ข้อมูลพยากรณ์อากาศจริง การแจ้งเตือนบนมือถือ ผู้ช่วย AI วิเคราะห์ใบไม้ และคำแนะนำตามฤดูกาล</p></section>
      <p class="tiny" style="text-align:center">🌸 สวนของฉัน · MVP 1.0 · คำแนะนำเป็นแนวทางทั่วไป ไม่รับประกันผล</p>
    </div>`;
  },
};

Object.assign(Actions, {
  'go-fertilizers'() { App.go('fertilizers'); },
  'edit-profile'() {
    const u = Garden.db.user;
    const draw = (E = {}) => `${Overlay.head('แก้ไขข้อมูลของฉัน')}<form class="form" data-form="save-profile" novalidate>
      ${C.Field({ id: 'prName', label: 'ชื่อ', err: E.name, html: `<input class="input" id="prName" value="${esc(u.name)}" maxlength="30">` })}
      ${C.Field({ id: 'prProv', label: 'จังหวัด', html: `<select class="input" id="prProv">${PROVINCES.map(p => `<option ${p.name === u.province ? 'selected' : ''}>${p.name}</option>`).join('')}</select>` })}
      ${C.Field({ id: 'prExp', label: 'ประสบการณ์', html: `<select class="input" id="prExp">${EXPERIENCE.map(x => `<option value="${x.v}" ${x.v === u.experienceLevel ? 'selected' : ''}>${x.emoji} ${x.label}</option>`).join('')}</select>` })}
      <button class="btn primary" type="submit">บันทึก</button></form>`;
    Overlay.open(draw(), { label: 'แก้ไขข้อมูล' });
    Actions['save-profile'] = async () => {
      const name = document.getElementById('prName').value;
      if (!name.trim()) return Overlay.update(draw({ name: 'กรุณาใส่ชื่อ' }));
      await Garden.updateUser({ name: name.trim(), province: document.getElementById('prProv').value, experienceLevel: document.getElementById('prExp').value });
      Overlay.close(); Toast.show('บันทึกแล้ว'); App.render();
    };
  },
  'garden-sheet'(el) {
    const g = el.dataset.id ? Garden.repo.byId('gardens', el.dataset.id) : null;
    const v = g || { name: '', location: Garden.db.user.province, gardenType: 'pot', sunlight: 'unsure', soilType: '', notes: '' };
    const draw = (E = {}) => `${Overlay.head(g ? 'แก้ไขสวน' : '+ เพิ่มสวน')}<form class="form" data-form="save-garden" novalidate>
      ${C.Field({ id: 'gName', label: 'ชื่อสวน', err: E.name, html: `<input class="input" id="gName" value="${esc(v.name)}" maxlength="30" placeholder="เช่น สวนหน้าบ้าน">` })}
      ${C.Field({ id: 'gProv', label: 'จังหวัด', html: `<select class="input" id="gProv">${PROVINCES.map(p => `<option ${p.name === v.location ? 'selected' : ''}>${p.name}</option>`).join('')}</select>` })}
      ${C.Field({ id: 'gType', label: 'พื้นที่ปลูก', html: `<select class="input" id="gType">${GARDEN_TYPES.map(x => `<option value="${x.v}" ${x.v === v.gardenType ? 'selected' : ''}>${x.emoji} ${x.label}</option>`).join('')}</select>` })}
      ${C.Field({ id: 'gSun', label: 'แสงแดด', html: `<select class="input" id="gSun">${SUN_OPTIONS.map(x => `<option value="${x.v}" ${x.v === v.sunlight ? 'selected' : ''}>${x.label}</option>`).join('')}</select>` })}
      ${C.Field({ id: 'gSoil', label: 'ลักษณะดิน (ไม่บังคับ)', hint: 'เช่น ดินเหนียว, ดินร่วน, ดินผสมถุง', html: `<input class="input" id="gSoil" value="${esc(v.soilType)}" maxlength="40">` })}
      ${C.Field({ id: 'gNotes', label: 'หมายเหตุ (ไม่บังคับ)', html: `<textarea class="input" id="gNotes" maxlength="200">${esc(v.notes)}</textarea>` })}
      <button class="btn primary" type="submit">บันทึก</button>
      ${g && Garden.gardens().length > 1 ? `<button class="btn danger" type="button" data-act="delete-garden" data-id="${g.id}">ลบสวนนี้</button>` : ''}</form>`;
    Overlay.open(draw(), { label: 'สวน' });
    Actions['save-garden'] = async () => {
      const val = id => document.getElementById(id).value;
      const data = { name: val('gName'), location: val('gProv'), gardenType: val('gType'), sunlight: val('gSun'), soilType: val('gSoil'), notes: val('gNotes') };
      try {
        if (g) await Garden.updateGarden(g.id, data); else Garden.addGarden(data);
        Overlay.close(); Toast.show(g ? 'บันทึกแล้ว' : 'เพิ่มสวนแล้ว'); App.render();
      } catch (err) { Object.assign(v, data); Overlay.update(draw({ name: err.message })); }
    };
  },
  async 'delete-garden'(el) {
    const g = Garden.repo.byId('gardens', el.dataset.id);
    Overlay.close();
    const ok = await Overlay.confirm({ title: `ลบ "${g.name}"?`, text: 'ต้นไม้และประวัติทั้งหมดในสวนนี้จะถูกลบด้วย', okLabel: 'ลบสวน', danger: true });
    if (!ok) return;
    try { await Garden.deleteGarden(g.id); Toast.show('ลบสวนแล้ว'); App.render(); } catch (err) { Toast.show(err.message); }
  },
  'backup-sheet'() {
    const json = Garden.repo.exportJSON();
    Overlay.open(`${Overlay.head('💾 สำรอง / กู้คืนข้อมูล')}
      <p class="small muted">คัดลอกข้อความด้านล่างเก็บไว้ (เช่น ส่งเข้าแชทตัวเอง) เพื่อย้ายไปเครื่องอื่น ข้อมูลนี้ไม่รวมรูปภาพ</p>
      <textarea class="input" id="bkOut" readonly style="min-height:110px;font-size:.8rem">${esc(json)}</textarea>
      <button class="btn" data-act="copy-backup">📋 คัดลอกข้อมูลสำรอง</button>
      <hr class="sep"><form class="form" data-form="import-backup">${C.Field({ id: 'bkIn', label: 'กู้คืนจากข้อมูลสำรอง', hint: 'วางข้อความที่เคยคัดลอกไว้ ข้อมูลปัจจุบันจะถูกแทนที่', html: '<textarea class="input" id="bkIn" style="min-height:90px;font-size:.8rem"></textarea>' })}
      <button class="btn ghost" type="submit">กู้คืนข้อมูล</button></form>`, { label: 'สำรองข้อมูล' });
  },
  async 'copy-backup'() {
    const ta = document.getElementById('bkOut');
    try { await navigator.clipboard.writeText(ta.value); Toast.show('คัดลอกแล้ว'); }
    catch (e) { ta.focus(); ta.select(); Toast.show('เลือกข้อความให้แล้ว กดคัดลอกเองได้เลย'); }
  },
  async 'import-backup'() {
    const val = document.getElementById('bkIn').value.trim();
    if (!val) return Toast.show('กรุณาวางข้อมูลสำรองก่อน');
    const ok = await Overlay.confirm({ title: 'กู้คืนข้อมูล?', text: 'ข้อมูลในเครื่องนี้ตอนนี้จะถูกแทนที่ด้วยข้อมูลสำรอง', okLabel: 'กู้คืน' });
    if (!ok) return;
    try { await Garden.repo.importJSON(val); Overlay.closeAll(); App.stack = []; App.tab = 'today'; App.render({ scrollTop: true }); Toast.show('กู้คืนข้อมูลแล้ว'); }
    catch (e) { Toast.show('ข้อมูลสำรองไม่ถูกต้อง ลองคัดลอกใหม่อีกครั้ง', { ms: 4000 }); }
  },
  async 'dev-day'(el) {
    const n = Number(el.dataset.n);
    const off = n === 0 ? 0 : U.getDayOffset() + n;
    U.setDayOffset(off); Garden.db.meta.dayOffset = off; await Garden.save();
    await Garden.runDailyNotifications();
    Toast.show(n === 0 ? 'กลับเป็นวันจริงแล้ว' : `เลื่อนไปเป็น ${U.fmtDate(U.todayKey(), { weekday: true })}`);
    App.ui.calSel = U.todayKey(); App.ui.calMonth = U.todayKey().slice(0, 7);
    App.render();
  },
  async 'reset-all'() {
    const ok = await Overlay.confirm({ title: 'ลบข้อมูลทั้งหมด?', text: 'สวน ต้นไม้ ประวัติ และรูปทั้งหมดในเครื่องนี้จะถูกลบ และกู้คืนไม่ได้', okLabel: 'ลบทั้งหมด', danger: true });
    if (!ok) return;
    await PhotoStore.clear(); await Garden.repo.reset(); U.setDayOffset(0);
    App.ui.ob = null; App.stack = []; App.tab = 'today'; App.render({ scrollTop: true });
  },
});

function openNotifications() {
  const list = Garden.db.notifications;
  Overlay.open(`${Overlay.head('🔔 การแจ้งเตือน')}
    ${list.length ? `<ul class="list-plain">${list.map(n => `<li class="notif ${n.read ? '' : 'unread'}"><div><b>${esc(n.title)}</b><div class="small muted">${esc(n.body || '')}</div><div class="tiny">${U.fmtDateTime(n.createdAt)}</div></div>
      ${n.taskId ? `<button class="btn sm" data-act="open-task" data-id="${esc(n.taskId)}">ดู</button>` : n.plantId ? `<button class="btn sm" data-act="open-plant" data-id="${esc(n.plantId)}">ดู</button>` : '<span></span>'}</li>`).join('')}</ul>`
      : C.EmptyState({ icon: '🔔', title: 'ยังไม่มีการแจ้งเตือน', text: 'เมื่อถึงเวลาดูแลต้นไม้ เราจะแจ้งที่นี่' })}
    <p class="tiny">ตอนนี้แจ้งเตือนภายในแอป เมื่อเปิดแอปแต่ละวัน</p>`, { label: 'การแจ้งเตือน', onClose: () => App.render() });
  Garden.markAllRead();
}

/* ============================================================
 * ui/views/today.js — Dashboard "วันนี้"
 * ลำดับ: งานวันนี้ → ต้นที่ต้องดูแล → ปัญหา → ความคืบหน้า → ต้นไม้ทั้งหมด → ข้อมูลเพิ่มเติม
 * ============================================================ */
Views.today = {
  title: () => 'วันนี้',
  render() {
    const user = Garden.db.user;
    const tasks = Garden.todayTasks();
    const pending = tasks.filter(t => !t.completed);
    const done = tasks.filter(t => t.completed);
    const plants = Garden.plants();
    const fd = Garden.firstDayProgress();
    const today = U.todayKey();
    const pct = tasks.length ? (done.length / tasks.length) * 100 : 0;

    /* 1. HERO — ตอบ "วันนี้ต้องทำอะไร" ภายใน 3 วินาที */
    let heroMain;
    if (!plants.length) heroMain = `<h1>ยังไม่มีต้นไม้ในสวน</h1><p class="muted">เพิ่มต้นแรกแล้วเราจะบอกว่าต้องทำอะไรทุกวัน</p><button class="btn primary" data-act="add-plant">+ เพิ่มต้นไม้</button>`;
    else if (pending.length) heroMain = `<div class="hero-row"><span class="count num" aria-hidden="true">${pending.length}</span><h1>วันนี้สวนของคุณมี ${pending.length} อย่างที่ต้องทำ</h1></div>
      <div class="prog-row small"><span class="muted">ทำเสร็จแล้ว</span><span class="num"><b>${done.length}</b> / ${tasks.length}</span></div>${C.ProgressBar(pct, { label: 'ความคืบหน้าวันนี้', tone: 'pink' })}`;
    else if (tasks.length) heroMain = `<div class="hero-row"><span class="count" aria-hidden="true">🎉</span><h1>วันนี้ดูแลสวนครบแล้ว!</h1></div><p class="muted">เก่งมาก พรุ่งนี้กลับมาดูงานใหม่นะครับ</p>${C.ProgressBar(100, { label: 'ความคืบหน้าวันนี้', tone: 'pink' })}`;
    else heroMain = `<div class="hero-row"><span class="count" aria-hidden="true">🌿</span><h1>วันนี้ไม่มีงานที่ต้องทำ</h1></div><p class="muted">พักผ่อนได้เลย หรือเดินไปดูต้นไม้สักรอบก็ดีครับ</p>`;
    const hero = `<section class="hero" aria-labelledby="heroTitle"><p class="hello" id="heroTitle">👋 สวัสดีครับ คุณ${esc(user.name)} · ${U.fmtDate(today, { weekday: true })}</p>${heroMain}</section>`;

    /* 2. CHECKLIST */
    let checklist = '';
    if (fd.active) {
      const firstList = pending.filter(t => t.firstDay || t.type === 'PLANTING');
      const others = pending.filter(t => !(t.firstDay || t.type === 'PLANTING'));
      checklist = `<section class="section" aria-labelledby="fdTitle"><div class="section-head"><h2 id="fdTitle">🌱 ภารกิจแรกของคุณ</h2><span class="num"><b>${fd.done}</b> / ${fd.total}</span></div>
        ${C.ProgressBar((fd.done / fd.total) * 100, { label: 'ภารกิจแรก' })}
        ${C.Checklist(firstList)}
        ${others.length ? `<h3 style="margin-top:6px">📋 งานอื่นวันนี้</h3>${C.Checklist(others)}` : ''}</section>`;
    } else if (plants.length) {
      checklist = `<section class="section" aria-labelledby="tTitle"><div class="section-head"><h2 id="tTitle">📋 ภารกิจวันนี้</h2><button class="link-btn" data-act="see-all-tasks">ดูทั้งหมด</button></div>
        ${pending.length ? C.Checklist(pending) : C.EmptyState({ icon: '✅', title: 'ไม่มีงานค้าง', text: 'งานของวันนี้เสร็จหมดแล้ว' })}</section>`;
    }
    const doneBlock = done.length ? `<div><button class="link-btn" data-act="toggle-done" aria-expanded="${App.ui.showDone}">${App.ui.showDone ? '▾' : '▸'} เสร็จแล้ว ${done.length} งาน</button>${App.ui.showDone ? C.Checklist(done) : ''}</div>` : '';

    /* 3. ต้นไหนต้องดูแล */
    const needCare = plants.map(p => ({ p, n: pending.filter(t => t.userPlantId === p.id).length })).filter(x => x.n > 0);
    const careBlock = needCare.length ? `<section class="section" aria-labelledby="ncTitle"><h2 id="ncTitle">🪴 ต้นที่ต้องดูแลวันนี้</h2>
      <div class="mini-plants">${needCare.map(({ p, n }) => `<button class="mini-plant" data-act="open-plant" data-id="${p.id}" aria-label="${esc(Garden.plantName(p))} มี ${n} งาน">
        <div class="pthumb">${C.Thumb(p, Garden.speciesById(p.speciesId))}<span class="cnt num">${n}</span></div><span>${esc(Garden.plantName(p))}</span></button>`).join('')}</div></section>` : '';

    /* 4. ปัญหา */
    const problems = [];
    plants.forEach(p => {
      if (p.status === 'problem') problems.push({ p, text: `บันทึกอาการ: ${p.problemNote || 'มีปัญหา'}`, act: 'open-plant' });
      const w = Garden.overwaterWarning(p.id);
      if (w) problems.push({ p, text: w, act: 'open-plant' });
    });
    const probBlock = problems.length ? `<section class="section" aria-labelledby="pbTitle"><h2 id="pbTitle">⚠️ ปัญหาที่ต้องจัดการ</h2>
      <ul class="list-plain">${problems.map(x => `<li><button class="row-btn" data-act="${x.act}" data-id="${x.p.id}"><span class="r-ico" aria-hidden="true">🟠</span><span class="r-txt"><b>${esc(Garden.plantName(x.p))}</b><span class="r-sub">${esc(x.text)}</span></span>${ICON.chev}</button></li>`).join('')}</ul></section>` : '';

    /* 5. ความคืบหน้า */
    const growth = Garden.gardenGrowth();
    const badgeCount = Object.keys(Garden.db.badges).length;
    const progBlock = plants.length ? `<section class="card" aria-labelledby="prTitle"><div class="section-head"><h2 id="prTitle">🌱 ความคืบหน้าสวน</h2><span class="num" style="font-family:var(--font-display);font-size:1.3rem;color:var(--green-ink)">${growth}%</span></div>
      ${C.ProgressBar(growth, { label: 'สวนของคุณเติบโต' })}
      <p>คุณดูแลสวนมาแล้ว <b class="num">${Garden.careDays()}</b> วัน</p>
      <button class="row-btn" data-act="tab" data-tab="profile" style="box-shadow:none;background:var(--surface-2)"><span class="r-ico" aria-hidden="true">🏅</span><span class="r-txt"><b>เหรียญของฉัน ${badgeCount}/${BADGES.length}</b><span class="r-sub">${badgeCount ? BADGES.filter(b => Garden.db.badges[b.key]).map(b => b.emoji).join(' ') : 'ทำภารกิจแรกเพื่อรับเหรียญแรก'}</span></span>${ICON.chev}</button></section>` : '';

    /* 6. ต้นไม้ทั้งหมด */
    const statusCount = { normal: 0, needs_care: 0, problem: 0, flowering: 0, planning: 0 };
    plants.forEach(p => statusCount[Garden.plantStatus(p, tasks)]++);
    const plantsBlock = plants.length ? `<section class="section" aria-labelledby="mpTitle"><div class="section-head"><h2 id="mpTitle">🌸 ต้นไม้ของฉัน <span class="tiny num">${plants.length} ต้น</span></h2><button class="link-btn" data-act="see-all-plants">ดูทั้งหมด</button></div>
      <div class="badge-row">${Object.entries(statusCount).filter(([, n]) => n).map(([k, n]) => `<span class="tag ${PLANT_STATUS[k].tone}">${PLANT_STATUS[k].emoji} ${PLANT_STATUS[k].label} ${n}</span>`).join('')}</div>
      <div class="plant-grid">${plants.slice(0, 3).map(p => C.PlantCard(p, tasks)).join('')}</div>
      <button class="btn ghost" data-act="add-plant">+ เพิ่มต้นไม้</button></section>` : '';

    /* 7. ข้อมูลเพิ่มเติม */
    const tipArticle = KB_ARTICLES.find(a => a.id === 'water-when');
    const moreBlock = `<section class="section" aria-labelledby="moTitle"><h2 id="moTitle">ℹ️ ข้อมูลเพิ่มเติม</h2>
      <div id="weatherSlot">${C.WeatherCard(null, user.province)}</div>
      <button class="row-btn" data-act="open-article" data-id="${tipArticle.id}"><span class="r-ico" aria-hidden="true">💡</span><span class="r-txt"><b>${tipArticle.title}</b><span class="r-sub">${tipArticle.summary}</span></span>${ICON.chev}</button></section>`;

    return `<div class="page">${hero}<div class="grid-2"><div class="section" style="gap:20px">${checklist}${doneBlock}${careBlock}${probBlock}</div>
      <div class="section" style="gap:20px">${progBlock}${plantsBlock}${moreBlock}</div></div></div>`;
  },
  async after() {
    const w = await ServiceRegistry.weather.getCurrentWeather(Garden.db.user.province);
    const slot = document.getElementById('weatherSlot');
    if (slot && w && w.available) slot.innerHTML = C.WeatherCard(w, Garden.db.user.province);
  },
};

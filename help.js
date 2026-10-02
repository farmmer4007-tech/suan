/* ============================================================
 * ui/views/help.js — Plant Doctor (rule-based), Knowledge Base, Article, Search
 * ============================================================ */
Views.help = {
  title: () => 'ช่วยฉัน',
  render() {
    const syms = ServiceRegistry.diagnosis.getSymptoms();
    return `<div class="page">
      <div class="page-head"><h1>🆘 ต้นไม้มีปัญหา?</h1><p class="muted">เลือกอาการที่เห็น เราจะถามทีละข้อ แล้วบอกสิ่งที่ควรตรวจและควรทำ</p></div>
      <div class="sym-grid">${syms.map(s => `<button class="sym" data-act="doctor-start" data-sym="${s.key}"><span class="s-e" aria-hidden="true">${s.emoji}</span>${s.label}</button>`).join('')}</div>
      <section class="section"><h2>📚 ความรู้สำหรับมือใหม่</h2>
        ${KB_CATEGORIES.map(c => `<div class="section" style="gap:8px"><h3>${c.emoji} ${c.name}</h3><ul class="list-plain">${KB_ARTICLES.filter(a => a.cat === c.id).map(a => `<li><button class="row-btn" data-act="open-article" data-id="${a.id}"><span class="r-txt"><b>${esc(a.title)}</b><span class="r-sub">${esc(a.summary)}</span></span>${ICON.chev}</button></li>`).join('')}</ul></div>`).join('')}
      </section>
      <section class="section"><h2>🌸 ข้อมูลต้นไม้</h2><div class="species-grid">${Garden.species().map(s => `<button class="sp-tile" data-act="open-species" data-id="${s.id}">${PlantArt.svg(s)}<span>${esc(s.nameTh)}</span></button>`).join('')}</div></section>
    </div>`;
  },
};

function startDoctor({ plantId = undefined, symptom = null } = {}) {
  const plants = Garden.plants().filter(p => p.plantedDate);
  let step = 'q';
  if (!symptom) step = 'symptom';
  else if (plantId === undefined && plants.length) step = 'plant';
  App.ui.doc = { plantId: plantId || null, symptom, step, qi: 0, answers: {} };
  if (App.current().view === 'doctor') App.replace('doctor'); else App.go('doctor');
}

Views.doctor = {
  title: () => 'ตรวจอาการต้นไม้',
  render() {
    const d = App.ui.doc;
    if (!d) return C.EmptyState({ icon: '🆘', title: 'เริ่มตรวจอาการใหม่', action: 'doctor-restart', actionLabel: 'เลือกอาการ' });
    const S = ServiceRegistry.diagnosis;
    const sym = S.getSymptoms().find(s => s.key === d.symptom);
    const p = d.plantId ? Garden.plant(d.plantId) : null;
    const sp = p ? Garden.speciesById(p.speciesId) : null;
    const chips = `<div class="badge-row">${sym ? `<span class="tag pink">${sym.emoji} ${sym.label}</span>` : ''}${p ? `<span class="tag green">🪴 ${esc(Garden.plantName(p))}</span>` : ''}</div>`;

    if (d.step === 'symptom') {
      return `<div class="page"><h1>อาการเป็นอย่างไร?</h1>${chips}<div class="sym-grid">${S.getSymptoms().map(s => `<button class="sym" data-act="doc-sym" data-sym="${s.key}">${`<span class="s-e" aria-hidden="true">${s.emoji}</span>`}${s.label}</button>`).join('')}</div></div>`;
    }
    if (d.step === 'plant') {
      const plants = Garden.plants().filter(x => x.plantedDate);
      return `<div class="page">${chips}<h1>เป็นกับต้นไหน?</h1><p class="muted">เลือกต้น เพื่อให้คำแนะนำตรงกับชนิดและอายุของต้น</p>
        <ul class="list-plain">${plants.map(x => `<li><button class="row-btn" data-act="doc-plant" data-id="${x.id}">${C.Thumb(x, Garden.speciesById(x.speciesId)).replace('class="pthumb"', 'class="pthumb" style="width:48px;height:48px;border-radius:14px"')}<span class="r-txt"><b>${esc(Garden.plantName(x))}</b><span class="r-sub">ปลูกมาแล้ว ${Garden.ageDays(x)} วัน</span></span>${ICON.chev}</button></li>`).join('')}
        <li><button class="row-btn" data-act="doc-plant" data-id=""><span class="r-ico" aria-hidden="true">❔</span><span class="r-txt"><b>ไม่ระบุต้น</b><span class="r-sub">ใช้คำแนะนำทั่วไป</span></span>${ICON.chev}</button></li></ul></div>`;
    }
    const qs = S.getQuestions(d.symptom);
    if (d.step === 'q') {
      const q = qs[d.qi];
      return `<div class="page">${chips}
        <div><div class="prog-row small"><span class="muted">คำถามที่ ${d.qi + 1} จาก ${qs.length}</span></div>${C.ProgressBar(((d.qi) / qs.length) * 100, { label: 'ความคืบหน้าคำถาม', tone: 'pink' })}</div>
        <div class="wz-body"><h1>${esc(q.text)}</h1>${q.hint ? `<p class="muted">${esc(q.hint)}</p>` : ''}
        <div class="options" role="radiogroup" aria-label="${esc(q.text)}">${q.options.map(([v, l]) => `<button class="option" role="radio" aria-checked="${d.answers[q.id] === v}" data-act="doc-answer" data-q="${q.id}" data-v="${v}"><b>${esc(l)}</b></button>`).join('')}</div></div>
        <div class="btn-row"><button class="btn ghost" data-act="doc-prev">← ย้อนกลับ</button></div></div>`;
    }
    // result
    const r = S.diagnose({ symptom: d.symptom, answers: d.answers, species: sp, plantAgeDays: p ? Garden.ageDays(p) : null });
    const kb = (sym && sym.kb || []).map(id => KB_ARTICLES.find(a => a.id === id)).filter(Boolean);
    return `<div class="page">${chips}<h1>ผลการตรวจเบื้องต้น</h1>
      <div class="info"><span aria-hidden="true">ℹ️</span><span class="small">เป็นแนวทางตรวจสอบจากคำตอบของคุณ ไม่ใช่การวินิจฉัยยืนยัน อาการเดียวกันอาจมีได้หลายสาเหตุ</span></div>
      <section class="section"><h2>💭 ความเป็นไปได้</h2>${r.causes.map(c => `<div class="cause"><b>${esc(c.title)}</b><span class="small muted">${esc(c.why)}</span></div>`).join('')}</section>
      <section class="card"><h2>🔎 สิ่งที่ควรตรวจสอบ</h2><ol class="result-list check">${r.checks.map((x, i) => `<li><span class="n">${i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ol></section>
      <section class="card"><h2>🛠️ สิ่งที่ควรทำตอนนี้</h2><ol class="result-list act">${r.actions.map((x, i) => `<li><span class="n">${i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ol></section>
      ${r.safety ? `<div class="warn"><span aria-hidden="true">🧤</span><span class="small"><b>ถ้าจะใช้สารเคมี</b> เช่น ยาฆ่าแมลงหรือสารกำจัดโรค: อ่านฉลาก ใช้ตามอัตราที่ระบุเท่านั้น สวมอุปกรณ์ป้องกันตามฉลาก และเก็บให้พ้นเด็กและสัตว์เลี้ยง ลองวิธีไม่ใช้สารก่อน</span></div>` : ''}
      <p class="small muted">${esc(r.followUp)}</p>
      ${p ? `<button class="btn primary" data-act="doc-save">📌 บันทึกอาการ + เตือนติดตามใน 3 วัน</button>` : ''}
      ${kb.length ? `<section class="section"><h3>อ่านเพิ่มเติม</h3><ul class="list-plain">${kb.map(a => `<li><button class="row-btn" data-act="open-article" data-id="${a.id}"><span class="r-txt"><b>${esc(a.title)}</b><span class="r-sub">${esc(a.summary)}</span></span>${ICON.chev}</button></li>`).join('')}</ul></section>` : ''}
      <div class="btn-row"><button class="btn ghost" data-act="doctor-restart">ตรวจอาการอื่น</button><button class="btn ghost" data-act="go-home">กลับหน้าวันนี้</button></div></div>`;
  },
};

Object.assign(Actions, {
  'doctor-start'(el) { startDoctor({ symptom: el.dataset.sym }); },
  'doctor-for'(el) { startDoctor({ plantId: el.dataset.id, symptom: null }); },
  'doctor-restart'() { const d = App.ui.doc; startDoctor({ plantId: d ? d.plantId : undefined, symptom: null }); },
  'doc-sym'(el) {
    const d = App.ui.doc; d.symptom = el.dataset.sym; d.qi = 0; d.answers = {};
    d.step = (!d.plantId && Garden.plants().some(p => p.plantedDate)) ? 'plant' : 'q';
    App.render({ scrollTop: true });
  },
  'doc-plant'(el) { const d = App.ui.doc; d.plantId = el.dataset.id || null; d.step = 'q'; d.qi = 0; App.render({ scrollTop: true }); },
  'doc-answer'(el) {
    const d = App.ui.doc; d.answers[el.dataset.q] = el.dataset.v;
    const qs = ServiceRegistry.diagnosis.getQuestions(d.symptom);
    if (d.qi < qs.length - 1) d.qi++; else d.step = 'result';
    App.render({ scrollTop: true });
  },
  'doc-prev'() {
    const d = App.ui.doc;
    if (d.qi > 0) d.qi--; else if (Garden.plants().some(p => p.plantedDate) && d.step === 'q') { d.step = 'plant'; }
    else { App.back(); return; }
    App.render({ scrollTop: true });
  },
  async 'doc-save'() {
    const d = App.ui.doc;
    const r = ServiceRegistry.diagnosis.diagnose({ symptom: d.symptom, answers: d.answers, species: Garden.speciesById(Garden.plant(d.plantId).speciesId), plantAgeDays: Garden.ageDays(Garden.plant(d.plantId)) });
    await Garden.saveDoctorReport(d.plantId, d.symptom, d.answers, r, true);
    Toast.show('📌 บันทึกแล้ว เราจะเตือนให้ติดตามอาการใน 3 วัน', { ms: 3500 });
    App.ui.detailTab = 'overview';
    App.stack = [{ view: 'plant', params: { id: d.plantId } }]; App.tab = 'plants';
    App.render({ scrollTop: true });
  },
});

/* ---------------- Article ---------------- */
Views.article = {
  title(p) { const a = KB_ARTICLES.find(x => x.id === p.id); return a ? a.title : 'บทความ'; },
  render({ id }) {
    const a = KB_ARTICLES.find(x => x.id === id);
    if (!a) return C.EmptyState({ icon: '📚', title: 'ไม่พบบทความ' });
    const cat = KB_CATEGORIES.find(c => c.id === a.cat);
    const body = a.body.map(b => b.p ? `<p>${esc(b.p)}</p>` : b.steps ? `<ol class="steps">${b.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>`
      : b.tip ? `<div class="info"><span aria-hidden="true">💡</span><span>${esc(b.tip)}</span></div>` : b.warn ? `<div class="warn"><span aria-hidden="true">⚠️</span><span>${esc(b.warn)}</span></div>` : '').join('');
    const more = KB_ARTICLES.filter(x => x.cat === a.cat && x.id !== a.id);
    return `<article class="page"><div class="page-head"><span class="tag">${cat.emoji} ${cat.name}</span><h1>${esc(a.title)}</h1><p class="muted">${esc(a.summary)}</p></div>
      <div class="article-body">${body}</div>
      ${more.length ? `<section class="section"><h3>อ่านต่อในหมวดนี้</h3><ul class="list-plain">${more.map(x => `<li><button class="row-btn" data-act="open-article" data-id="${x.id}"><span class="r-txt"><b>${esc(x.title)}</b><span class="r-sub">${esc(x.summary)}</span></span>${ICON.chev}</button></li>`).join('')}</ul></section>` : ''}</article>`;
  },
};

/* ---------------- Search (รองรับภาษาไทย) ---------------- */
function searchResults(q) {
  const n = U.norm(q);
  if (!n) return `<p class="muted">พิมพ์ชื่อต้นไม้ อาการ (เช่น ใบเหลือง) หรือเรื่องที่อยากรู้ (เช่น ปุ๋ย)</p>
    <div class="chips">${['ใบเหลือง', 'รดน้ำ', 'ปุ๋ย', 'ชบา', 'เพลี้ย', 'ไม่ออกดอก'].map(s => `<button class="chip" data-act="search-suggest" data-v="${s}">${s}</button>`).join('')}</div>`;
  const has = (...fields) => fields.some(f => U.norm(f).includes(n));
  const myPlants = Garden.plants().filter(p => { const sp = Garden.speciesById(p.speciesId); return has(Garden.plantName(p), sp && sp.nameTh, sp && sp.nameEn, p.location, p.notes); });
  const species = Garden.species().filter(s => has(s.nameTh, s.nameEn, s.scientificName, s.category, s.description));
  const arts = KB_ARTICLES.filter(a => has(a.title, a.summary, a.body.map(b => b.p || b.tip || b.warn || (b.steps || []).join(' ')).join(' ')));
  const syms = DOCTOR_SYMPTOMS.filter(s => has(s.label));
  const tasks = Garden.todayTasks().filter(t => has(t.title, t.description));
  const group = (title, items) => items.length ? `<section class="section"><h2>${title} <span class="tiny num">${items.length}</span></h2><ul class="list-plain">${items.join('')}</ul></section>` : '';
  const row = (act, id, ico, t, sub, extra = '') => `<li><button class="row-btn" data-act="${act}" ${id ? `data-id="${esc(id)}"` : ''} ${extra}><span class="r-ico" aria-hidden="true">${ico}</span><span class="r-txt"><b>${esc(t)}</b>${sub ? `<span class="r-sub">${esc(sub)}</span>` : ''}</span>${ICON.chev}</button></li>`;
  const html = group('🪴 ต้นไม้ของฉัน', myPlants.map(p => row('open-plant', p.id, (Garden.speciesById(p.speciesId) || {}).emoji || '🪴', Garden.plantName(p), Garden.ageDays(p) != null ? `ปลูกมาแล้ว ${Garden.ageDays(p)} วัน` : 'รอปลูก')))
    + group('📋 งานวันนี้', tasks.map(t => row('open-task', t.id, TASK_META[t.type].emoji, t.title, t.completed ? 'เสร็จแล้ว' : 'ยังไม่เสร็จ')))
    + group('🆘 อาการ', syms.map(s => row('doctor-start', '', s.emoji, s.label, 'เริ่มตรวจอาการ', `data-sym="${s.key}"`)))
    + group('🌸 ชนิดต้นไม้', species.map(s => row('open-species', s.id, s.emoji, s.nameTh, s.description)))
    + group('📚 บทความ', arts.map(a => row('open-article', a.id, '📖', a.title, a.summary)));
  return html || C.EmptyState({ icon: '🔍', title: `ไม่พบ "${q}"`, text: 'ลองคำอื่น เช่น ชื่อต้นไม้ หรืออาการที่เห็น' });
}

Views.search = {
  title: () => 'ค้นหา',
  render() {
    return `<div class="page"><form class="searchbar" role="search" data-form="noop"><span aria-hidden="true">${ICON.search.replace('<svg', '<svg width="20" height="20" style="stroke:currentColor;fill:none;stroke-width:2"')}</span>
      <label for="q" class="sr-only">ค้นหา</label><input id="q" type="search" data-live="search-input" value="${esc(App.ui.search)}" placeholder="ค้นหาต้นไม้ อาการ บทความ งาน" autocomplete="off" autofocus></form>
      <div id="searchResults" class="section" aria-live="polite">${searchResults(App.ui.search)}</div></div>`;
  },
  after() { const q = document.getElementById('q'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } },
};
Object.assign(Actions, {
  'search-input': U.debounce((el) => { App.ui.search = el.value; const r = document.getElementById('searchResults'); if (r) { r.innerHTML = searchResults(el.value); } }, 120),
  'search-suggest'(el) { App.ui.search = el.dataset.v; const q = document.getElementById('q'); if (q) q.value = el.dataset.v; document.getElementById('searchResults').innerHTML = searchResults(el.dataset.v); },
  'noop'() {},
});

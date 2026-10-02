/* ============================================================
 * ui/views/plants.js — My Plants, Plant Detail, Plant Form, Species info
 * ============================================================ */
const PLANT_FILTERS = [['all', 'ทั้งหมด'], ['normal', 'ปกติ'], ['needs_care', 'ต้องดูแลวันนี้'], ['problem', 'มีปัญหา'], ['flowering', 'กำลังออกดอก'], ['planning', 'รอปลูก']];
const PLANT_SORTS = [['care', 'ต้องดูแลก่อน'], ['recent', 'ล่าสุด'], ['oldest', 'เก่าที่สุด'], ['name', 'ชื่อต้นไม้']];

Views.plants = {
  title: () => 'ต้นไม้ของฉัน',
  render() {
    const tasks = Garden.todayTasks();
    const all = Garden.plants();
    const f = App.ui.plantFilter, s = App.ui.plantSort;
    let list = all.map(p => ({ p, status: Garden.plantStatus(p, tasks), n: tasks.filter(t => t.userPlantId === p.id && !t.completed).length }));
    if (f !== 'all') list = list.filter(x => x.status === f);
    const order = { problem: 0, needs_care: 1, planning: 2, flowering: 3, normal: 4 };
    list.sort((a, b) => {
      if (s === 'recent') return b.p.createdAt.localeCompare(a.p.createdAt);
      if (s === 'oldest') return (a.p.plantedDate || '9999').localeCompare(b.p.plantedDate || '9999');
      if (s === 'name') return Garden.plantName(a.p).localeCompare(Garden.plantName(b.p), 'th');
      return (order[a.status] - order[b.status]) || (b.n - a.n);
    });
    const body = !all.length
      ? C.EmptyState({ icon: '🌱', title: 'ยังไม่มีต้นไม้', text: 'มาเริ่มปลูกต้นแรกกันเถอะ', action: 'add-plant', actionLabel: '+ เพิ่มต้นไม้' })
      : list.length ? `<div class="plant-grid">${list.map(x => C.PlantCard(x.p, tasks)).join('')}</div>`
        : C.EmptyState({ icon: '🔍', title: 'ไม่มีต้นไม้ในหมวดนี้', text: 'ลองเลือกตัวกรอง "ทั้งหมด"' });
    return `<div class="page"><div class="page-head"><h1>🌱 ต้นไม้ของฉัน</h1><p class="muted">${all.length} ต้น ในสวนของคุณ</p></div>
      ${all.length ? `<div class="chips scroll" role="group" aria-label="กรองต้นไม้">${PLANT_FILTERS.map(([k, l]) => `<button class="chip" aria-pressed="${f === k}" data-act="plant-filter" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="field" style="grid-template-columns:auto 1fr;align-items:center;gap:10px"><label for="pSort" class="small">เรียงตาม</label>
        <select class="input" id="pSort" data-change="plant-sort" style="max-width:240px">${PLANT_SORTS.map(([k, l]) => `<option value="${k}" ${s === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>` : ''}
      ${body}</div>
      ${all.length ? `<button class="btn primary fab" data-act="add-plant">+ เพิ่มต้นไม้</button>` : ''}`;
  },
};

Object.assign(Actions, {
  'plant-filter'(el) { App.ui.plantFilter = el.dataset.v; App.render(); },
  'plant-sort'(el) { App.ui.plantSort = el.value; App.render(); },
});

/* ---------------- Plant Detail ---------------- */
Views.plant = {
  title(p) { const pl = Garden.plant(p.id); return pl ? Garden.plantName(pl) : 'ต้นไม้'; },
  render({ id }) {
    const p = Garden.plant(id);
    if (!p) return C.EmptyState({ icon: '🍃', title: 'ไม่พบต้นไม้นี้', text: 'อาจถูกลบไปแล้ว', action: 'see-all-plants', actionLabel: 'กลับไปหน้าต้นไม้' });
    const sp = Garden.speciesById(p.speciesId);
    const tasks = Garden.todayTasks();
    const status = Garden.plantStatus(p, tasks);
    const age = Garden.ageDays(p);
    const stage = TaskEngine.growthStage(p, sp, U.todayKey());
    const myTasks = tasks.filter(t => t.userPlantId === p.id);
    const tab = App.ui.detailTab;
    const garden = Garden.repo.byId('gardens', p.gardenId);
    const gtype = GARDEN_TYPES.find(g => g.v === p.plantingType);

    const hero = `<div class="pd-hero">${p.coverPhotoId ? `<img data-photo="${p.coverPhotoId}" alt="รูป${esc(Garden.plantName(p))}">` : PlantArt.svg(sp)}
      ${p.plantedDate ? `<button class="btn sm pd-photo-btn" data-act="photo-sheet" data-id="${p.id}">📷 ถ่ายรูป</button>` : ''}</div>`;
    const head = `<div class="page-head"><h1>${sp ? sp.emoji : '🪴'} ${esc(Garden.plantName(p))}</h1>
      <p class="muted">${esc(sp ? sp.nameTh : '')}${sp && sp.scientificName ? ` · <i>${esc(sp.scientificName)}</i>` : ''}${garden ? ` · ${esc(garden.name)}` : ''}</p>
      <div class="badge-row">${C.PlantStatusBadge(status)}${gtype ? `<span class="tag">${gtype.emoji} ${gtype.label}</span>` : ''}${p.quantity > 1 ? `<span class="tag">${p.quantity} ต้น</span>` : ''}</div></div>`;
    const facts = `<div class="facts">
      <div class="fact"><div class="k">ปลูกวันที่</div><div class="v">${p.plantedDate ? U.fmtDate(p.plantedDate) : 'ยังไม่ปลูก'}</div></div>
      <div class="fact"><div class="k">อายุ</div><div class="v num">${age == null ? '-' : age + ' วัน'}</div></div>
      <div class="fact"><div class="k">ระยะ</div><div class="v">${stage.emoji} ${stage.label}</div></div></div>`;

    const problem = p.status === 'problem' ? `<div class="warn danger"><span aria-hidden="true">🟠</span><div style="flex:1"><b>มีปัญหา: ${esc(p.problemNote || 'กำลังติดตามอาการ')}</b><div class="small">ติดตามอาการทุก 2–3 วัน และถ่ายรูปเทียบ</div>
      <div class="btn-row" style="margin-top:8px"><button class="btn sm green" data-act="resolve-problem" data-id="${p.id}">อาการดีขึ้นแล้ว</button><button class="btn sm ghost" data-act="doctor-for" data-id="${p.id}">ตรวจอาการอีกครั้ง</button></div></div></div>` : '';

    const quick = p.plantedDate ? `<div class="btn-row">
      <button class="btn primary" data-act="water-check" data-id="${p.id}">💧 ตรวจดิน</button>
      <button class="btn" data-act="doctor-for" data-id="${p.id}">🆘 มีปัญหา?</button></div>` : '';

    const tabs = [['overview', 'ภาพรวม'], ['care', 'การดูแล'], ['fert', 'ปุ๋ย'], ['photos', 'รูป'], ['history', 'ประวัติ']];
    const tabBar = `<div class="tabs" role="tablist" aria-label="ข้อมูลต้นไม้">${tabs.map(([k, l]) => `<button class="tab" role="tab" id="tab-${k}" aria-selected="${tab === k}" aria-controls="tabpanel" data-act="detail-tab" data-v="${k}">${l}</button>`).join('')}</div>`;

    let panel = '';
    if (tab === 'overview') {
      panel = `<section class="section"><h2>📋 งานวันนี้</h2>${myTasks.length ? C.Checklist(myTasks, { showPlant: false }) : `<p class="muted">วันนี้ไม่มีงานของต้นนี้ ✅</p>`}</section>
        ${p.plantedDate ? `<section class="card"><h2>🌸 การออกดอก</h2>${C.StagePath(p, sp)}
          <p class="small muted">${esc(sp ? sp.floweringNotes : '')} ระยะเวลาออกดอกขึ้นกับพันธุ์และสภาพแวดล้อม ไม่มีวันที่แน่นอน</p>
          ${p.flowering ? `<button class="btn ghost sm" data-act="toggle-flower" data-id="${p.id}">ดอกหมดแล้ว (กลับไปดูแลปกติ)</button>` : `<button class="btn sm" data-act="toggle-flower" data-id="${p.id}">🌸 ต้นนี้ออกดอกแล้ว</button>`}</section>` : ''}
        <section class="card"><h2>🗺️ เส้นทางการปลูก</h2>${C.PlantTimeline(p, sp)}</section>
        ${p.location || p.notes ? `<section class="card flat"><h3>📝 บันทึก</h3>${p.location ? `<p><span class="muted">ตำแหน่ง:</span> ${esc(p.location)}</p>` : ''}${p.notes ? `<p>${esc(p.notes)}</p>` : ''}</section>` : ''}`;
    } else if (tab === 'care') {
      const mm = Garden.sunlightMismatch(sp, garden && garden.sunlight);
      panel = `<div class="card"><div class="care-row"><div class="care-ico yellow" aria-hidden="true">☀️</div><div style="display:grid;gap:4px"><h3>แสง · ${esc(sp.sunlight.label)}</h3><p class="small">${esc(sp.sunlight.text)}</p></div></div>
          ${mm ? `<div class="warn"><span aria-hidden="true">⚠️</span><span>${esc(mm)}</span></div>` : ''}</div>
        ${C.WateringCard(p, sp)}
        <div class="card"><div class="care-row"><div class="care-ico green" aria-hidden="true">🟫</div><div style="display:grid;gap:4px"><h3>ดิน</h3><p class="small">${esc(sp.soilGuideline)}</p>${p.potSize ? `<p class="tiny">ขนาดกระถาง: ${esc((POT_SIZES.find(x => x.v === p.potSize) || {}).label || '')}</p>` : ''}</div></div></div>
        ${sp.temperatureNotes ? `<div class="card"><div class="care-row"><div class="care-ico pink" aria-hidden="true">🌡️</div><div style="display:grid;gap:4px"><h3>อากาศ</h3><p class="small">${esc(sp.temperatureNotes)}</p></div></div></div>` : ''}
        <div class="card"><div class="care-row"><div class="care-ico pink" aria-hidden="true">✂️</div><div style="display:grid;gap:4px"><h3>การตัดแต่ง</h3><p class="small">${esc(sp.pruningNotes)}</p></div></div></div>
        <div class="card"><div class="care-row"><div class="care-ico green" aria-hidden="true">🐛</div><div style="display:grid;gap:4px"><h3>แมลงและโรคที่พบบ่อย</h3><p class="small">${esc(sp.pestNotes)}</p>${sp.diseaseNotes ? `<p class="small">${esc(sp.diseaseNotes)}</p>` : ''}
          ${sp.commonProblems.length ? `<ul class="small" style="margin:4px 0 0;padding-left:18px">${sp.commonProblems.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div></div>
          <div class="warn"><span aria-hidden="true">🧤</span><span class="small">ถ้าจะใช้ยาฆ่าแมลงหรือสารกำจัดโรค อ่านฉลาก ใช้ตามอัตราที่ระบุ สวมอุปกรณ์ป้องกัน และเก็บให้พ้นเด็กและสัตว์เลี้ยง</span></div></div>`;
    } else if (tab === 'fert') {
      panel = p.plantedDate ? C.FertilizerCard(p, sp) : C.EmptyState({ icon: '🧪', title: 'ยังไม่ต้องใส่ปุ๋ย', text: 'ปลูกให้ต้นตั้งตัวก่อน ระบบจะเตือนเมื่อถึงรอบปุ๋ย' });
    } else if (tab === 'photos') {
      panel = `${C.PhotoUpload(p.id)}${C.PhotoTimeline(p)}`;
    } else if (tab === 'history') {
      const h = Garden.history(p.id);
      panel = h.length ? `<div class="card"><ul class="hist">${h.map(x => `<li><span aria-hidden="true">${x.emoji}</span><div><div>${esc(x.text)}</div><div class="h-at">${x.date ? U.fmtDate(x.date) : U.fmtDateTime(x.at)}${x.note ? ' · ' + esc(x.note) : ''}</div></div></li>`).join('')}</ul></div>`
        : C.EmptyState({ icon: '📖', title: 'ยังไม่มีประวัติ', text: 'เมื่อทำงานดูแล ตรวจดิน หรือใส่ปุ๋ย จะแสดงที่นี่' });
    }

    return `<div class="page">${hero}${head}${facts}${problem}${quick}${tabBar}<div id="tabpanel" role="tabpanel" aria-labelledby="tab-${tab}" class="section">${panel}</div>
      <hr class="sep"><div class="btn-row"><button class="btn ghost" data-act="edit-plant" data-id="${p.id}">✏️ แก้ไข</button><button class="btn danger" data-act="delete-plant" data-id="${p.id}">🗑️ ลบต้นนี้</button></div></div>`;
  },
};

Object.assign(Actions, {
  'detail-tab'(el) { App.ui.detailTab = el.dataset.v; App.render(); },
  async 'toggle-flower'(el) {
    const p = Garden.plant(el.dataset.id);
    await Garden.markFlowering(p.id, !p.flowering);
    if (p.flowering) { confetti(['🌸', '🌺', '🌼', '✨']); Toast.show(`🌺 ยินดีด้วย ${Garden.plantName(p)} ออกดอกแล้ว!`); await Garden.checkBadges(); }
    else Toast.show('กลับไปดูแลตามปกติ');
    App.render();
  },
  async 'resolve-problem'(el) { await Garden.setProblem(el.dataset.id, false); Toast.show('🟢 ดีใจด้วย! เปลี่ยนสถานะเป็นปกติแล้ว'); App.render(); },
  'edit-plant'(el) { App.ui.form = null; App.go('plantForm', { id: el.dataset.id }); },
  async 'delete-plant'(el) {
    const p = Garden.plant(el.dataset.id);
    const ok = await Overlay.confirm({ title: `ลบ "${Garden.plantName(p)}"?`, text: 'ประวัติการดูแล รูปภาพ และงานของต้นนี้จะถูกลบด้วย และกู้คืนไม่ได้', okLabel: 'ลบต้นนี้', danger: true });
    if (!ok) return;
    await Garden.deletePlant(p.id);
    App.stack = []; App.tab = 'plants'; App.render({ scrollTop: true });
    Toast.show('ลบต้นไม้แล้ว');
  },
  'photo-sheet'(el) {
    Overlay.open(`${Overlay.head('📷 บันทึกรูปต้นไม้')}
      ${C.Field({ id: 'photoNote', label: 'หมายเหตุ (ไม่บังคับ)', html: '<input class="input" id="photoNote" maxlength="80" placeholder="เช่น แตกใบใหม่ 2 ใบ">' })}
      ${C.PhotoUpload(el.dataset.id)}`, { label: 'ถ่ายรูปต้นไม้' });
  },
  async 'view-photo'(el) {
    const ph = Garden.repo.byId('photoLogs', el.dataset.id); if (!ph) return;
    Overlay.open(`${Overlay.head('📷 ' + U.fmtDate(U.isoToKey(ph.capturedAt)))}
      <img data-photo="${ph.id}" alt="รูปต้นไม้" style="border-radius:16px;width:100%">${ph.note ? `<p>${esc(ph.note)}</p>` : ''}
      <button class="btn danger" data-act="delete-photo" data-id="${ph.id}">ลบรูปนี้</button>`, { label: 'ดูรูป' });
  },
  async 'delete-photo'(el) {
    Overlay.close();
    const ok = await Overlay.confirm({ title: 'ลบรูปนี้?', text: 'ลบแล้วกู้คืนไม่ได้', okLabel: 'ลบรูป', danger: true });
    if (!ok) return;
    await Garden.deletePhoto(el.dataset.id); Toast.show('ลบรูปแล้ว'); App.render();
  },
});

/* ---------------- Plant Form (add / edit) ---------------- */
function plantFormState(params) {
  if (App.ui.form && App.ui.form._for === (params.id || 'new')) return App.ui.form;
  const p = params.id ? Garden.plant(params.id) : null;
  const g = Garden.gardens()[0];
  App.ui.form = p ? {
    _for: p.id, speciesId: p.speciesId, nickname: p.nickname, gardenId: p.gardenId, plantedState: p.plantedDate ? 'before' : 'notyet',
    plantedDate: p.plantedDate || '', plannedDate: p.plannedDate || '', plantingType: p.plantingType, potSize: p.potSize, quantity: String(p.quantity || 1),
    location: p.location, notes: p.notes, customName: '', errors: {},
  } : {
    _for: 'new', speciesId: params.speciesId || '', nickname: '', gardenId: g ? g.id : '', plantedState: 'today', plantedDate: U.todayKey(), plannedDate: '',
    plantingType: g ? g.gardenType : 'pot', potSize: '', quantity: '1', location: '', notes: '', customName: '', errors: {},
  };
  return App.ui.form;
}

Views.plantForm = {
  title: (p) => p.id ? 'แก้ไขต้นไม้' : 'เพิ่มต้นไม้',
  render(params) {
    const f = plantFormState(params);
    const E = f.errors || {};
    const garden = Garden.repo.byId('gardens', f.gardenId);
    const sp = Garden.speciesById(f.speciesId);
    const mm = sp && garden ? Garden.sunlightMismatch(sp, garden.sunlight) : null;
    const potWarn = sp && f.plantingType === 'ground' && !sp.suitableForGround ? `${sp.nameTh}เหมาะกับการปลูกในกระถางหรือวัสดุปลูกเฉพาะมากกว่าลงดิน` : null;
    return `<form class="page form" data-form="save-plant" novalidate>
      <div class="page-head"><h1>${params.id ? '✏️ แก้ไขต้นไม้' : '🌱 เพิ่มต้นไม้'}</h1>${params.id ? '' : '<p class="muted">กรอกเท่าที่รู้ ที่เหลือระบบช่วยเอง</p>'}</div>
      <div class="field ${E.speciesId ? 'err' : ''}"><span class="label" id="spLbl">1. ต้นไม้ชนิดไหน?</span>
        <div class="species-grid" role="radiogroup" aria-labelledby="spLbl">${Garden.species().map(s => `<button type="button" class="sp-tile" role="radio" aria-checked="${f.speciesId === s.id}" data-act="pf-species" data-id="${s.id}">${PlantArt.svg(s)}<span>${esc(s.nameTh)}</span></button>`).join('')}</div>
        ${E.speciesId ? `<span class="err-msg" role="alert">${E.speciesId}</span>` : ''}
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-top:6px"><div class="field"><label for="pfCustom" class="small">ไม่มีในรายการ? เพิ่มชนิดอื่น</label><input class="input" id="pfCustom" data-bind="form.customName" value="${esc(f.customName)}" placeholder="พิมพ์ชื่อต้นไม้" maxlength="30"></div><button type="button" class="btn" data-act="pf-add-custom">เพิ่ม</button></div>
      </div>
      ${mm ? `<div class="warn"><span aria-hidden="true">☀️</span><span>${esc(mm)}</span></div>` : ''}
      ${C.Field({ id: 'pfNick', label: '2. ชื่อเล่น (ไม่บังคับ)', hint: 'ช่วยแยกต้นที่ชนิดเดียวกัน เช่น "ชบาหน้าบ้าน"', err: E.nickname, html: `<input class="input" id="pfNick" data-bind="form.nickname" value="${esc(f.nickname)}" maxlength="40">` })}
      ${Garden.gardens().length > 1 ? C.Field({ id: 'pfGarden', label: 'อยู่ในสวนไหน', err: E.gardenId, html: `<select class="input" id="pfGarden" data-bind="form.gardenId" data-change="pf-rerender">${Garden.gardens().map(g => `<option value="${g.id}" ${g.id === f.gardenId ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>` }) : ''}
      <div class="field"><span class="label" id="plLbl">3. ปลูกแล้วหรือยัง?</span>
        <div class="chips" role="radiogroup" aria-labelledby="plLbl">${[['today', '🌱 ปลูกวันนี้'], ['before', '🪴 ปลูกไปแล้ว'], ['notyet', '🧺 ยังไม่ได้ปลูก']].map(([k, l]) => `<button type="button" class="chip" role="radio" aria-checked="${f.plantedState === k}" data-act="pf-set" data-k="plantedState" data-v="${k}">${l}</button>`).join('')}</div></div>
      ${f.plantedState === 'before' ? C.Field({ id: 'pfDate', label: 'วันที่ปลูก', err: E.plantedDate, html: `<input class="input" type="date" id="pfDate" data-bind="form.plantedDate" value="${esc(f.plantedDate)}" max="${U.todayKey()}" required>` }) : ''}
      ${f.plantedState === 'notyet' ? C.Field({ id: 'pfPlan', label: 'วางแผนจะปลูกวันไหน (ไม่บังคับ)', hint: 'ระบบจะสร้างงาน "ปลูก" พร้อมขั้นตอนทีละข้อ', err: E.plannedDate, html: `<input class="input" type="date" id="pfPlan" data-bind="form.plannedDate" value="${esc(f.plannedDate)}" min="${U.todayKey()}">` }) : ''}
      <div class="field"><span class="label" id="ptLbl">4. ปลูกแบบไหน?</span>
        <div class="options cols-2" role="radiogroup" aria-labelledby="ptLbl">${GARDEN_TYPES.map(x => `<button type="button" class="option" role="radio" aria-checked="${f.plantingType === x.v}" data-act="pf-set" data-k="plantingType" data-v="${x.v}"><span class="o-emoji" aria-hidden="true">${x.emoji}</span><b>${x.label}</b></button>`).join('')}</div></div>
      ${potWarn ? `<div class="warn"><span aria-hidden="true">💡</span><span>${esc(potWarn)}</span></div>` : ''}
      ${f.plantingType === 'pot' ? C.Field({ id: 'pfPot', label: 'ขนาดกระถาง', html: `<select class="input" id="pfPot" data-bind="form.potSize">${POT_SIZES.map(x => `<option value="${x.v}" ${x.v === f.potSize ? 'selected' : ''}>${x.label}</option>`).join('')}</select>` }) : ''}
      ${C.Field({ id: 'pfQty', label: 'จำนวนต้น', err: E.quantity, html: `<input class="input num" type="number" inputmode="numeric" min="1" max="999" step="1" id="pfQty" data-bind="form.quantity" value="${esc(f.quantity)}" style="max-width:140px">` })}
      ${C.Field({ id: 'pfLoc', label: 'ตำแหน่ง (ไม่บังคับ)', hint: 'เช่น ข้างรั้วหลังบ้าน, ระเบียงชั้น 2', html: `<input class="input" id="pfLoc" data-bind="form.location" value="${esc(f.location)}" maxlength="60">` })}
      ${C.Field({ id: 'pfNotes', label: 'หมายเหตุ (ไม่บังคับ)', html: `<textarea class="input" id="pfNotes" data-bind="form.notes" maxlength="300">${esc(f.notes)}</textarea>` })}
      ${!params.id ? '<p class="tiny">เพิ่มรูปได้หลังบันทึก ในหน้าต้นไม้ แท็บ "รูป"</p>' : ''}
      <div class="btn-row"><button type="button" class="btn ghost" data-act="back">ยกเลิก</button><button type="submit" class="btn primary">${params.id ? 'บันทึก' : 'เพิ่มต้นไม้'}</button></div>
    </form>`;
  },
};

Object.assign(Actions, {
  'pf-species'(el) { App.ui.form.speciesId = el.dataset.id; App.ui.form.errors = {}; App.render(); },
  'pf-set'(el) {
    const f = App.ui.form; f[el.dataset.k] = el.dataset.v;
    if (el.dataset.k === 'plantedState' && el.dataset.v === 'today') f.plantedDate = U.todayKey();
    if (el.dataset.k === 'plantedState' && el.dataset.v === 'before' && f.plantedDate === U.todayKey()) f.plantedDate = '';
    App.render();
  },
  'pf-rerender'() { App.render(); },
  'pf-add-custom'() {
    const f = App.ui.form;
    try { const sp = Garden.addCustomSpecies(f.customName); f.speciesId = sp.id; f.customName = ''; Garden.save(); App.render(); Toast.show(`เพิ่ม "${sp.nameTh}" แล้ว`); }
    catch (err) { Toast.show(err.message); }
  },
  async 'save-plant'() {
    const f = App.ui.form;
    const params = App.current().params;
    const data = {
      speciesId: f.speciesId, nickname: f.nickname, gardenId: f.gardenId, plantingType: f.plantingType, potSize: f.plantingType === 'pot' ? f.potSize : '',
      quantity: f.quantity, location: f.location, notes: f.notes,
      plantedDate: f.plantedState === 'today' ? U.todayKey() : f.plantedState === 'before' ? (f.plantedDate || 'invalid') : null,
      plannedDate: f.plantedState === 'notyet' ? f.plannedDate || null : null,
    };
    try {
      if (params.id) {
        await Garden.updatePlant(params.id, data);
        App.ui.form = null; App.back(); Toast.show('บันทึกแล้ว');
      } else {
        const p = Garden.addPlant(data);
        await Garden.save();
        await Garden.checkBadges();
        App.ui.form = null; App.ui.detailTab = 'overview';
        App.stack[App.stack.length - 1] = { view: 'plant', params: { id: p.id } };
        App.render({ scrollTop: true });
        Toast.show(`🌱 เพิ่ม${Garden.plantName(p)}แล้ว ระบบสร้างแผนดูแลให้เรียบร้อย`, { ms: 3500 });
      }
    } catch (err) {
      if (err.fields) {
        if (err.fields.plantedDate && data.plantedDate === 'invalid') err.fields.plantedDate = 'กรุณาเลือกวันที่ปลูก';
        f.errors = err.fields; App.render();
        const first = document.querySelector('.err-msg'); if (first) first.scrollIntoView({ block: 'center' });
      } else Toast.show('ขออภัย บันทึกไม่สำเร็จ ลองอีกครั้งนะครับ');
    }
  },
});

/* ---------------- Species info ---------------- */
Views.species = {
  title(p) { const s = Garden.speciesById(p.id); return s ? s.nameTh : 'ต้นไม้'; },
  render({ id }) {
    const sp = Garden.speciesById(id);
    if (!sp) return C.EmptyState({ icon: '🍃', title: 'ไม่พบข้อมูลต้นไม้' });
    const row = (ico, tone, title, text) => text ? `<div class="card"><div class="care-row"><div class="care-ico ${tone}" aria-hidden="true">${ico}</div><div style="display:grid;gap:4px"><h3>${title}</h3><p class="small">${esc(text)}</p></div></div></div>` : '';
    return `<div class="page"><div class="pd-hero">${PlantArt.svg(sp)}</div>
      <div class="page-head"><h1>${sp.emoji} ${esc(sp.nameTh)}</h1><p class="muted">${esc(sp.nameEn)}${sp.scientificName ? ` · <i>${esc(sp.scientificName)}</i>` : ''}</p>
      <div class="badge-row"><span class="tag green">ปลูก${esc(sp.difficulty)}</span><span class="tag">${esc(sp.category)}</span>${sp.suitableForPot ? '<span class="tag">🪴 กระถางได้</span>' : ''}${sp.suitableForGround ? '<span class="tag">🟫 ลงดินได้</span>' : ''}</div></div>
      <p>${esc(sp.description)}</p>
      ${row('☀️', 'yellow', 'แสง · ' + esc(sp.sunlight.label), sp.sunlight.text)}${row('💧', 'blue', 'น้ำ', sp.wateringGuideline)}${row('🟫', 'green', 'ดิน', sp.soilGuideline)}
      ${row('🧪', 'yellow', 'ปุ๋ย', sp.fertilizerGuideline)}${row('🌸', 'pink', 'การออกดอก', sp.floweringNotes)}${row('✂️', 'pink', 'การตัดแต่ง', sp.pruningNotes)}${row('🐛', 'green', 'แมลงที่พบบ่อย', sp.pestNotes)}
      <button class="btn primary" data-act="add-plant" data-species="${sp.id}">+ ปลูก${esc(sp.nameTh)}</button></div>`;
  },
};

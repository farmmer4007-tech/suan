/* ============================================================
 * ui/views/care.js — Task Detail ("One action at a time"), Water Check, Fertilizer
 * ============================================================ */
function soilButtons(selected, act, extra = '') {
  return `<div class="options cols-3 soil-opts" role="radiogroup" aria-label="สภาพดิน">${Object.entries(SOIL_RESULT).map(([k, r]) =>
    `<button type="button" class="option" role="radio" aria-checked="${selected === k}" data-act="${act}" data-v="${k}" ${extra}><span class="o-emoji" aria-hidden="true">${r.emoji}</span>${r.label.replace('ดิน', '')}</button>`).join('')}</div>`;
}
function soilAdvice(k) {
  const r = SOIL_RESULT[k]; if (!r) return '';
  return `<div class="advice ${r.tone}" role="status" aria-live="polite"><div class="a-title">${r.emoji} ${r.advice}</div><p class="small">${r.detail}</p></div>`;
}

Views.task = {
  title: () => 'งานวันนี้',
  render({ id }) {
    const t = Garden.findTask(id);
    if (!t) return C.EmptyState({ icon: '🍃', title: 'ไม่พบงานนี้', text: 'งานอาจถูกลบ หรือต้นไม้ถูกลบไปแล้ว', action: 'go-home', actionLabel: 'กลับหน้าวันนี้' });
    const p = t.userPlantId ? Garden.plant(t.userPlantId) : null;
    const sp = p ? Garden.speciesById(p.speciesId) : null;
    const meta = TASK_META[t.type] || TASK_META.GENERAL;
    const d = App.ui.taskDraft;
    const future = t.dueDate > U.todayKey();
    let interact = '', doneBtn = '';

    if (t.completed) {
      doneBtn = `<div class="info"><span aria-hidden="true">✅</span><span>ทำเสร็จแล้ว${t.completedAt ? ' เมื่อ ' + U.fmtDateTime(t.completedAt) : ''}</span></div>
        <button class="btn ghost" data-act="task-undo" data-id="${esc(t.id)}">ยกเลิกสถานะเสร็จ</button>`;
    } else if (future) {
      doneBtn = `<div class="info"><span aria-hidden="true">📅</span><span>งานนี้ถึงกำหนด ${U.fmtDate(t.dueDate, { weekday: true })} ยังไม่ต้องทำวันนี้</span></div>`;
    } else if (t.type === 'SOIL_CHECK') {
      interact = `<section class="section"><h2>ดินเป็นอย่างไร?</h2>${soilButtons(d.soil, 'td-soil')}${d.soil ? soilAdvice(d.soil) : ''}</section>`;
      if (d.soil === 'dry') doneBtn = `<div class="btn-row"><button class="btn primary" data-act="td-water-done" data-w="1">💧 รดน้ำแล้ว · เสร็จ</button><button class="btn ghost" data-act="td-water-done" data-w="0">ยังไม่ได้รด · บันทึกผล</button></div>`;
      else if (d.soil) doneBtn = `<button class="btn primary block" data-act="td-water-done" data-w="0">✅ เสร็จแล้ว</button>`;
      else doneBtn = `<p class="tiny" style="text-align:center">เลือกผลตรวจด้านบนก่อน แล้วปุ่ม "เสร็จแล้ว" จะขึ้นมา</p>`;
    } else if (t.type === 'PLANTING' && t.checklist) {
      const st = d.steps || {};
      const all = t.steps.every((_, i) => st[i]);
      interact = `<section class="section"><h2>ติ๊กทีละขั้น</h2><ul class="substeps">${t.steps.map((s, i) => `<li><label><input type="checkbox" data-change="td-step" data-i="${i}" ${st[i] ? 'checked' : ''}><span>${esc(s)}</span></label></li>`).join('')}</ul>
        <p class="small muted">ปลูกเสร็จแล้ว ระบบจะเริ่มนับวันและสร้างงานดูแลประจำวันให้</p></section>`;
      doneBtn = `<button class="btn primary block" data-act="td-complete" ${all ? '' : 'disabled'}>✅ ปลูกเสร็จแล้ว</button>${all ? '' : `<p class="tiny" style="text-align:center">ติ๊กครบทุกขั้นแล้วกดเสร็จได้</p>`}`;
    } else if (t.type === 'PHOTO' && p) {
      interact = `<section class="section">${C.Field({ id: 'photoNote', label: 'หมายเหตุ (ไม่บังคับ)', html: '<input class="input" id="photoNote" maxlength="80" placeholder="เช่น ใบเยอะขึ้น">' })}${C.PhotoUpload(p.id, { taskId: t.id })}</section>`;
      doneBtn = `<button class="btn ghost block" data-act="td-complete">ข้ามรูปครั้งนี้ · ทำเสร็จ</button>`;
    } else if (t.type === 'FERTILIZER' && p) {
      const last = Garden.lastFertilizer(p.id);
      const since = last ? U.diffDays(U.todayKey(), last.appliedAt) : null;
      const recent = since != null && sp && since < sp.fertIntervalDays / 2;
      interact = `<section class="section">
        <div class="warn"><span aria-hidden="true">⚠️</span><span>ใช้อัตราตามฉลากผลิตภัณฑ์เป็นหลัก อย่าเพิ่มปริมาณเองเพราะคิดว่าจะโตเร็วขึ้น</span></div>
        ${recent ? `<div class="info"><span aria-hidden="true">💡</span><span>เพิ่งใส่ปุ๋ยไปเมื่อ ${since} วันก่อน (${esc(last.fertilizerName)}) <b>ไม่ต้องใส่ซ้ำ</b> กด "ข้ามรอบนี้" ได้เลย</span></div>` : ''}
        <div class="btn-row"><button class="btn green" data-act="fert-log" data-id="${p.id}" data-task="${esc(t.id)}">🧪 บันทึกการใส่ปุ๋ย</button><button class="btn ghost" data-act="td-complete" data-skip="1">ข้ามรอบนี้</button></div></section>`;
    } else if (t.type === 'PEST_CHECK' || t.type === 'DISEASE_CHECK') {
      doneBtn = `<div class="btn-row"><button class="btn primary" data-act="td-complete">✅ ไม่พบอะไรผิดปกติ</button><button class="btn" data-act="td-found-problem" data-plant="${p ? p.id : ''}" data-sym="${t.type === 'PEST_CHECK' ? 'pests' : 'unknown'}">🆘 พบปัญหา</button></div>`;
    } else {
      doneBtn = `<button class="btn primary block" data-act="td-complete">✅ เสร็จแล้ว</button>`;
    }

    const why = t.type === 'SOIL_CHECK' ? `<p class="small muted">💡 ทำไมไม่รดทุกวัน? เพราะวันที่ฝนตกหรืออากาศครึ้ม ดินแห้งช้า รดเพิ่มอาจทำให้รากเน่าได้</p>` : '';
    return `<div class="page">
      <div class="badge-row"><span class="tag ${meta.tone}">${meta.emoji} ${meta.label}</span>${t.overdue ? '<span class="tag danger">ค้างอยู่</span>' : ''}<span class="tag">${U.fmtDate(t.dueDate, { year: false })}</span>${t.recurrence ? `<span class="tag">${esc(t.recurrence)}</span>` : ''}</div>
      <section class="section"><p class="muted">วันนี้ทำอะไร?</p><h1>${esc(t.title)}</h1>${t.description ? `<p>${esc(t.description)}</p>` : ''}
        ${p ? `<button class="row-btn" data-act="open-plant" data-id="${p.id}" style="box-shadow:none;background:var(--surface-2)">${C.Thumb(p, sp).replace('class="pthumb"', 'class="pthumb" style="width:44px;height:44px;border-radius:12px"')}<span class="r-txt"><b>${esc(Garden.plantName(p))}</b><span class="r-sub">ดูข้อมูลต้นนี้</span></span>${ICON.chev}</button>` : ''}</section>
      ${t.steps && t.steps.length && !(t.type === 'PLANTING' && t.checklist) ? `<section class="card"><h2>ทำอย่างไร?</h2><ol class="steps">${t.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>${why}</section>` : ''}
      ${interact}
      <div class="section">${doneBtn}</div>
      ${t.source === 'custom' && !t.firstDay ? `<button class="link-btn" data-act="task-delete" data-id="${esc(t.id)}" style="color:var(--danger-ink)">ลบงานนี้</button>` : ''}
    </div>`;
  },
};

Object.assign(Actions, {
  'td-soil'(el) { App.ui.taskDraft.soil = el.dataset.v; App.render(); const a = document.querySelector('.advice'); if (a) a.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); },
  'td-step'(el) { const d = App.ui.taskDraft; d.steps = d.steps || {}; d.steps[el.dataset.i] = el.checked; App.render(); },
  async 'td-water-done'(el) {
    const { id } = App.current().params;
    const t = Garden.findTask(id);
    const soil = App.ui.taskDraft.soil;
    await Garden.logWater(t.userPlantId, { soilCondition: soil, watered: el.dataset.w === '1' });
    await finishTask(id, { soil, watered: el.dataset.w === '1' });
  },
  async 'td-complete'(el) {
    const { id } = App.current().params;
    await finishTask(id, el.dataset.skip ? { skipped: true } : { steps: App.ui.taskDraft.steps || null });
  },
  async 'task-undo'(el) { await Garden.uncompleteTask(el.dataset.id); Toast.show('ยกเลิกสถานะเสร็จแล้ว'); App.render(); },
  async 'task-delete'(el) {
    const ok = await Overlay.confirm({ title: 'ลบงานนี้?', text: 'งานนี้จะหายจากรายการและปฏิทิน', okLabel: 'ลบงาน', danger: true });
    if (!ok) return;
    await Garden.deleteCustomTask(el.dataset.id); App.back(); Toast.show('ลบงานแล้ว');
  },
  'td-found-problem'(el) { startDoctor({ plantId: el.dataset.plant || null, symptom: el.dataset.sym }); },
  'water-check'(el) { openWaterSheet(el.dataset.id, null); },
  'fert-log'(el) { openFertSheet(el.dataset.id, el.dataset.task || null); },
});

/* ---------------- Water Check (BottomSheet) ---------------- */
function openWaterSheet(plantId, taskId) {
  const p = Garden.plant(plantId);
  if (!p) return;
  const sp = Garden.speciesById(p.speciesId);
  const medium = TaskEngine.isMediumNotSoil(sp);
  const st = { soil: null };
  const draw = () => `${Overlay.head(`💧 ${medium ? 'ตรวจวัสดุปลูก' : 'ตรวจดิน'}${esc(Garden.plantName(p))}`)}
    <ol class="steps"><li><span>${medium ? 'ใช้นิ้วแตะวัสดุปลูกด้านใน' : 'ใช้นิ้วจิ้มดินลึกประมาณ 2–3 ซม.'}</span></li><li><span>สังเกตความชื้น</span></li><li><span>เลือกผลด้านล่าง</span></li></ol>
    <h3>ตอนนี้ดินเป็นอย่างไร?</h3>${soilButtons(st.soil, 'ws-soil')}
    ${st.soil ? soilAdvice(st.soil) : ''}
    ${st.soil ? `${C.Field({ id: 'wsNote', label: 'หมายเหตุ (ไม่บังคับ)', html: '<input class="input" id="wsNote" maxlength="80" placeholder="เช่น ฝนตกเมื่อคืน">' })}
      ${st.soil === 'dry' ? `<div class="btn-row"><button class="btn primary" data-act="ws-save" data-w="1">💧 บันทึกว่ารดน้ำแล้ว</button><button class="btn ghost" data-act="ws-save" data-w="0">ยังไม่รด · บันทึกผลตรวจ</button></div>`
        : `<button class="btn primary block" data-act="ws-save" data-w="0">บันทึกผลตรวจ</button>`}` : ''}`;
  Overlay.open(draw(), { label: 'ตรวจดิน' });
  Actions['ws-soil'] = (el) => { st.soil = el.dataset.v; Overlay.update(draw()); const b = document.querySelector('.overlay [data-act="ws-save"]'); if (b) b.scrollIntoView({ block: 'nearest' }); };
  Actions['ws-save'] = async (el) => {
    const watered = el.dataset.w === '1';
    const noteEl = document.getElementById('wsNote');
    await Garden.logWater(plantId, { soilCondition: st.soil, watered, note: noteEl ? noteEl.value : '' });
    Overlay.close();
    if (taskId) await finishTask(taskId, { soil: st.soil, watered });
    else {
      Toast.show(watered ? '💧 บันทึกการรดน้ำแล้ว' : '📝 บันทึกผลตรวจดินแล้ว');
      // ถ้ามีงานตรวจดินของต้นนี้วันนี้ ให้ทำเครื่องหมายเสร็จด้วย
      const t = Garden.todayTasks().find(x => x.userPlantId === plantId && x.type === 'SOIL_CHECK' && !x.completed);
      if (t) await finishTask(t.id, { soil: st.soil, watered }); else App.render();
    }
    const w = Garden.overwaterWarning(plantId);
    if (w && watered) setTimeout(() => Toast.show('⚠️ ' + w, { ms: 5000 }), 1200);
  };
}

/* ---------------- Fertilizer log (BottomSheet) ---------------- */
function openFertSheet(plantId, taskId) {
  const p = Garden.plant(plantId);
  const st = { mode: Garden.db.fertilizers.length ? 'pick' : 'name', fertilizerId: (Garden.db.fertilizers[Garden.db.fertilizers.length - 1] || {}).id || '', errors: {} };
  const draw = () => {
    const E = st.errors;
    const fz = Garden.db.fertilizers;
    const sel = fz.find(x => x.id === st.fertilizerId);
    return `${Overlay.head('🧪 บันทึกการใส่ปุ๋ย')}
      <p class="muted">${esc(Garden.plantName(p))}</p>
      <div class="warn"><span aria-hidden="true">⚠️</span><span>ใช้อัตราตามฉลากผลิตภัณฑ์เป็นหลัก อย่าเพิ่มปริมาณปุ๋ยเองเพราะคิดว่าจะทำให้โตเร็วขึ้น</span></div>
      <form class="form" data-form="fz-save" novalidate>
        ${fz.length ? `<div class="chips" role="radiogroup" aria-label="เลือกปุ๋ย">${fz.map(x => `<button type="button" class="chip" role="radio" aria-checked="${st.mode === 'pick' && st.fertilizerId === x.id}" data-act="fz-pick" data-id="${x.id}">${esc(x.name)}${x.npk ? ' ' + esc(x.npk) : ''}</button>`).join('')}
          <button type="button" class="chip" role="radio" aria-checked="${st.mode === 'name'}" data-act="fz-mode" data-v="name">พิมพ์ชื่อเอง</button></div>` : ''}
        ${sel && st.mode === 'pick' && sel.labelRate ? `<div class="info"><span aria-hidden="true">🏷️</span><span>อัตราตามฉลากที่จดไว้: <b>${esc(sel.labelRate)}</b></span></div>` : ''}
        ${st.mode === 'name' ? C.Field({ id: 'fzName', label: 'ชื่อปุ๋ย', hint: 'ไม่รู้ชื่อ พิมพ์ว่า "ไม่ทราบชื่อ" ได้', err: E.fertilizerName, html: '<input class="input" id="fzName" maxlength="40" placeholder="เช่น ปุ๋ยคอก, ปุ๋ยสูตรเสมอ">' }) : ''}
        ${C.Field({ id: 'fzDate', label: 'วันที่ใส่', err: E.appliedAt, html: `<input class="input" type="date" id="fzDate" value="${U.todayKey()}" max="${U.todayKey()}">` })}
        ${C.Field({ id: 'fzAmt', label: 'ปริมาณที่ใช้ (ตามฉลาก)', hint: 'เช่น 1 ช้อนชา ตามฉลาก', html: '<input class="input" id="fzAmt" maxlength="40">' })}
        ${C.Field({ id: 'fzNote', label: 'หมายเหตุ (ไม่บังคับ)', html: '<input class="input" id="fzNote" maxlength="80">' })}
        <button class="btn green block" type="submit">บันทึก${taskId ? ' · เสร็จงานนี้' : ''}</button>
      </form>
      <button class="link-btn" data-act="fz-manage">⚙️ จัดการรายการปุ๋ยของฉัน</button>`;
  };
  Overlay.open(draw(), { label: 'บันทึกการใส่ปุ๋ย' });
  Actions['fz-pick'] = (el) => { st.mode = 'pick'; st.fertilizerId = el.dataset.id; Overlay.update(draw()); };
  Actions['fz-mode'] = () => { st.mode = 'name'; Overlay.update(draw()); };
  Actions['fz-manage'] = () => { Overlay.closeAll(); App.go('fertilizers'); };
  Actions['fz-save'] = async () => {
    const v = id => (document.getElementById(id) || {}).value || '';
    try {
      await Garden.logFertilizer(plantId, { fertilizerId: st.mode === 'pick' ? st.fertilizerId : null, fertilizerName: v('fzName'), appliedAt: v('fzDate'), amount: v('fzAmt'), note: v('fzNote') });
      Overlay.close();
      if (taskId) await finishTask(taskId, { fertilized: true });
      else {
        const t = Garden.todayTasks().find(x => x.userPlantId === plantId && x.type === 'FERTILIZER' && !x.completed);
        if (t) await finishTask(t.id, { fertilized: true }); else { Toast.show('🧪 บันทึกการใส่ปุ๋ยแล้ว'); App.render(); }
      }
    } catch (err) {
      if (err.fields) { st.errors = err.fields; Overlay.update(draw()); } else Toast.show('ขออภัย บันทึกไม่สำเร็จ ลองอีกครั้งนะครับ');
    }
  };
}

/* ---------------- Fertilizer products page ---------------- */
Views.fertilizers = {
  title: () => 'ปุ๋ยของฉัน',
  render() {
    const list = Garden.db.fertilizers;
    const E = (App.ui.fzErrors) || {};
    const TYPES = [['organic', 'ปุ๋ยอินทรีย์'], ['chemical', 'ปุ๋ยเคมี (เม็ด)'], ['liquid', 'ปุ๋ยละลายน้ำ/น้ำ'], ['unknown', 'ไม่ทราบ']];
    return `<div class="page"><div class="page-head"><h1>🧪 ปุ๋ยของฉัน</h1><p class="muted">จดชื่อปุ๋ยและอัตราบนฉลากไว้ เวลาถึงรอบจะได้ดูง่าย</p></div>
      ${list.length ? `<ul class="list-plain">${list.map(f => `<li class="card flat" style="grid-template-columns:1fr auto;align-items:center"><div><b>${esc(f.name)}</b> ${f.npk ? `<span class="tag yellow">${esc(f.npk)}</span>` : '<span class="tag">สูตร: ไม่ทราบ</span>'}
        <div class="small muted">${esc((TYPES.find(t => t[0] === f.type) || TYPES[3])[1])}${f.labelRate ? ' · ฉลาก: ' + esc(f.labelRate) : ''} · เริ่มใช้ ${U.fmtDate(f.startDate)}</div></div>
        <button class="icon-btn" data-act="fz-del" data-id="${f.id}" aria-label="ลบ ${esc(f.name)}">🗑️</button></li>`).join('')}</ul>`
        : C.EmptyState({ icon: '🧪', title: 'ยังไม่มีปุ๋ยในรายการ', text: 'เพิ่มปุ๋ยที่มีอยู่ หรือข้ามได้ถ้ายังไม่ได้ซื้อ' })}
      <form class="card form" data-form="fz-add" novalidate><h2>+ เพิ่มปุ๋ย</h2>
        ${C.Field({ id: 'fzpName', label: 'ชื่อปุ๋ย', err: E.name, html: '<input class="input" id="fzpName" maxlength="40" placeholder="เช่น ปุ๋ยคอกวัว, ปุ๋ยสูตรเสมอ" required>' })}
        ${C.Field({ id: 'fzpNpk', label: 'สูตร N-P-K', hint: 'ตัวเลข 3 ตัวบนถุง เช่น 15-15-15', err: E.npk, html: '<input class="input num" id="fzpNpk" maxlength="8" placeholder="15-15-15" inputmode="numeric">' })}
        <label class="check-row"><input type="checkbox" id="fzpUnknown"> ไม่ทราบสูตร</label>
        ${C.Field({ id: 'fzpType', label: 'ประเภท', html: `<select class="input" id="fzpType">${TYPES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>` })}
        ${C.Field({ id: 'fzpRate', label: 'อัตราการใช้ตามฉลาก', hint: 'คัดลอกจากฉลาก เช่น "1 ช้อนโต๊ะ ต่อน้ำ 5 ลิตร ทุก 2 สัปดาห์"', html: '<input class="input" id="fzpRate" maxlength="80">' })}
        ${C.Field({ id: 'fzpStart', label: 'วันที่เริ่มใช้', err: E.startDate, html: `<input class="input" type="date" id="fzpStart" value="${U.todayKey()}">` })}
        <div class="warn"><span aria-hidden="true">⚠️</span><span class="small">แอปไม่กำหนดอัตราปุ๋ยแทนฉลาก ใช้อัตราตามฉลากผลิตภัณฑ์เป็นหลัก</span></div>
        <button class="btn green" type="submit">บันทึกปุ๋ย</button></form></div>`;
  },
};
Object.assign(Actions, {
  async 'fz-add'() {
    const v = id => document.getElementById(id);
    try {
      await Garden.addFertilizer({ name: v('fzpName').value, npk: v('fzpNpk').value, npkUnknown: v('fzpUnknown').checked, type: v('fzpType').value, labelRate: v('fzpRate').value, startDate: v('fzpStart').value });
      App.ui.fzErrors = {}; App.render(); Toast.show('เพิ่มปุ๋ยแล้ว');
    } catch (err) { if (err.fields) { App.ui.fzErrors = err.fields; App.render(); } }
  },
  async 'fz-del'(el) {
    const ok = await Overlay.confirm({ title: 'ลบปุ๋ยนี้?', text: 'ประวัติการใส่ปุ๋ยที่บันทึกไว้จะยังอยู่', okLabel: 'ลบ', danger: true });
    if (ok) { await Garden.deleteFertilizer(el.dataset.id); App.render(); }
  },
});

/* ============================================================
 * ui/views/onboarding.js — Onboarding wizard (5 ขั้น + หน้าเสร็จ)
 * ============================================================ */
const Views = {};
const OB_LABELS = ['คุณเป็นใคร', 'สวนอยู่ที่ไหน', 'มีแดดแค่ไหน', 'จะปลูกอะไร', 'พร้อมเริ่มแล้ว'];

function obState() {
  if (!App.ui.ob) App.ui.ob = { step: 0, name: '', experience: 'beginner', province: DEFAULT_PROVINCE, gardenName: 'สวนหลังบ้าน', gardenType: '', typeUnsure: false, sunlight: '', speciesIds: [], plantedStatus: 'notyet', plantedDate: '', customName: '', errors: {} };
  return App.ui.ob;
}

Views.onboarding = function () {
  const ob = obState();
  const E = ob.errors || {};
  if (ob.step === 0) {
    return `<div class="wizard"><div></div><div class="welcome">
      <div class="art">${PlantArt.svg(PLANT_SPECIES[0])}</div>
      <p class="muted">สวัสดีครับ 🌱</p>
      <h1>สวนของฉัน</h1>
      <p class="tagline">ไม่เคยปลูกก็เริ่มได้<br>วันนี้สวนของเราต้องทำอะไร?</p>
      <p class="muted" style="max-width:34ch">เราจะช่วยคุณปลูกต้นไม้ตั้งแต่วันแรก บอกทีละขั้นว่าวันนี้ต้องทำอะไร ไม่ต้องมีความรู้มาก่อน</p>
    </div><div class="wz-foot"><button class="btn primary" data-act="ob-next" autofocus>เริ่มสร้างสวนของฉัน</button></div></div>`;
  }
  if (ob.step === 6) {
    const fd = Garden.firstDayProgress();
    return `<div class="wizard"><div></div><div class="welcome">
      <div class="celebrate"><div class="big" aria-hidden="true">🎉</div><h1>พร้อมแล้ว!</h1>
      <p class="tagline">เราเตรียมแผนดูแลสวนให้คุณแล้ว</p>
      <p class="muted">${fd.active ? `วันนี้มีภารกิจแรก ${fd.total} อย่าง ทำทีละขั้นได้เลย` : 'ระบบสร้างงานดูแลประจำวันให้แล้ว เริ่มจากตรวจดินทุกเช้า'}</p></div>
    </div><div class="wz-foot"><button class="btn primary" data-act="ob-start" autofocus>เริ่มภารกิจวันแรก</button></div></div>`;
  }
  let body = '';
  const s = ob.step;
  if (s === 1) {
    body = `<h1>1️⃣ คุณเป็นใคร</h1>
      ${C.Field({ id: 'obName', label: 'อยากให้เราเรียกคุณว่าอะไร?', err: E.name, html: `<input class="input" id="obName" data-bind="ob.name" value="${esc(ob.name)}" placeholder="เช่น นิด, พี่แดง" maxlength="30" autocomplete="given-name" autofocus>` })}
      <div class="field"><span class="label" id="expLbl">คุณเคยปลูกต้นไม้มาก่อนไหม?</span>
      <div class="options" role="radiogroup" aria-labelledby="expLbl">${EXPERIENCE.map(x => `<button class="option" role="radio" aria-checked="${ob.experience === x.v}" data-act="ob-set" data-k="experience" data-v="${x.v}"><span class="o-emoji" aria-hidden="true">${x.emoji}</span><span class="o-text"><b>${x.label}</b><span class="o-desc">${x.desc}</span></span></button>`).join('')}</div></div>`;
  } else if (s === 2) {
    body = `<h1>2️⃣ สวนอยู่ที่ไหน</h1>
      ${C.Field({ id: 'obProv', label: '📍 คุณอยู่จังหวัดไหน?', hint: 'ใช้ปรับคำแนะนำตามพื้นที่ในอนาคต', html: `<select class="input" id="obProv" data-bind="ob.province">${PROVINCES.map(p => `<option ${p.name === ob.province ? 'selected' : ''}>${p.name}</option>`).join('')}</select>` })}
      ${C.Field({ id: 'obGName', label: 'ตั้งชื่อสวน', err: E.gardenName, html: `<input class="input" id="obGName" data-bind="ob.gardenName" value="${esc(ob.gardenName)}" maxlength="30" placeholder="เช่น สวนหลังบ้าน">` })}
      <div class="field ${E.gardenType ? 'err' : ''}"><span class="label" id="gtLbl">🪴 คุณจะปลูกแบบไหน?</span>
      <div class="options cols-2" role="radiogroup" aria-labelledby="gtLbl">${GARDEN_TYPES.map(x => `<button class="option" role="radio" aria-checked="${ob.gardenType === x.v && !ob.typeUnsure}" data-act="ob-set" data-k="gardenType" data-v="${x.v}"><span class="o-emoji" aria-hidden="true">${x.emoji}</span><b>${x.label}</b></button>`).join('')}
        <button class="option" role="radio" aria-checked="${ob.typeUnsure}" data-act="ob-type-unsure" style="grid-column:1/-1"><span class="o-emoji" aria-hidden="true">🤔</span><b>ยังไม่แน่ใจ</b></button></div>
      ${E.gardenType ? `<span class="err-msg" role="alert">${E.gardenType}</span>` : ''}</div>
      ${ob.typeUnsure ? `<div class="info"><span aria-hidden="true">💡</span><div><b>มือใหม่แนะนำ "กระถาง"</b><br><span class="small">ย้ายหาแดดได้ ควบคุมดินและน้ำง่าย ถ้าน้ำขังก็แก้ได้ทันที เราเลือกกระถางให้แล้ว เปลี่ยนภายหลังได้</span></div></div>` : ''}`;
  } else if (s === 3) {
    body = `<h1>3️⃣ มีแดดแค่ไหน</h1><p class="muted">☀️ ตรงที่จะปลูก มีแดดส่องตรงประมาณกี่ชั่วโมงต่อวัน?</p>
      <div class="options" role="radiogroup" aria-label="ชั่วโมงแดด">${SUN_OPTIONS.map(x => `<button class="option" role="radio" aria-checked="${ob.sunlight === x.v}" data-act="ob-set" data-k="sunlight" data-v="${x.v}"><span class="o-emoji" aria-hidden="true">${{ lt3: '⛅', '3to5': '🌤️', '5to7': '☀️', gt7: '🔆', unsure: '🤔' }[x.v]}</span><b>${x.label}</b></button>`).join('')}</div>
      ${E.sunlight ? `<span class="err-msg" role="alert">${E.sunlight}</span>` : ''}
      ${ob.sunlight === 'unsure' ? `<div class="card tint-yellow"><h3>☀️ วิธีสังเกตแดดง่าย ๆ</h3><ol class="steps"><li>ดูตรงที่จะปลูกตอน 9 โมง, เที่ยง, บ่าย 3 และ 5 โมงเย็น</li><li>จดว่าช่วงไหนมีแดดส่องตรง ช่วงไหนเป็นเงา</li><li>นับรวมเป็นชั่วโมง แล้วกลับมาแก้ในหน้า "สวนของฉัน" ได้</li></ol><p class="small">ไม่เป็นไร ไปต่อได้เลย เราใส่งาน "ตรวจแสงแดด" ไว้ในภารกิจแรกให้แล้ว</p></div>` : ''}`;
  } else if (s === 4) {
    const sun = ob.sunlight;
    const warns = ob.speciesIds.map(id => Garden.sunlightMismatch(Garden.speciesById(id), sun)).filter(Boolean);
    body = `<h1>4️⃣ จะปลูกอะไร</h1><p class="muted">🌸 เลือกได้มากกว่า 1 อย่าง (มือใหม่แนะนำเริ่ม 1–2 ต้น)</p>
      <div class="species-grid" role="group" aria-label="ชนิดต้นไม้">${Garden.species().map(sp => `<button class="sp-tile" role="checkbox" aria-checked="${ob.speciesIds.includes(sp.id)}" data-act="ob-species" data-id="${sp.id}">${PlantArt.svg(sp)}<span>${esc(sp.nameTh)}</span><span class="sp-diff">${sp.custom ? 'เพิ่มเอง' : 'ปลูก' + sp.difficulty}</span></button>`).join('')}</div>
      ${E.speciesIds ? `<span class="err-msg" role="alert">${E.speciesIds}</span>` : ''}
      <form class="field" data-form="ob-add-custom" style="grid-template-columns:1fr auto;align-items:end;gap:8px">
        <div class="field" style="min-width:0"><label for="obCustom">+ เพิ่มต้นไม้ชนิดอื่น</label><input class="input" id="obCustom" data-bind="ob.customName" value="${esc(ob.customName)}" placeholder="พิมพ์ชื่อต้นไม้" maxlength="30"></div>
        <button class="btn" type="submit">เพิ่ม</button></form>
      ${warns.length ? `<div class="warn"><span aria-hidden="true">☀️</span><div>${warns.map(w => `<div>${esc(w)}</div>`).join('')}</div></div>` : ''}
      <div class="field"><span class="label" id="psLbl">ปลูกแล้วหรือยัง?</span>
      <div class="options" role="radiogroup" aria-labelledby="psLbl">
        <button class="option" role="radio" aria-checked="${ob.plantedStatus === 'notyet'}" data-act="ob-set" data-k="plantedStatus" data-v="notyet"><span class="o-emoji" aria-hidden="true">🧺</span><span class="o-text"><b>ยังไม่ได้ปลูก</b><span class="o-desc">เราจะพาเตรียมพื้นที่และปลูกทีละขั้น (แนะนำ)</span></span></button>
        <button class="option" role="radio" aria-checked="${ob.plantedStatus === 'today'}" data-act="ob-set" data-k="plantedStatus" data-v="today"><span class="o-emoji" aria-hidden="true">🌱</span><span class="o-text"><b>ปลูกวันนี้แล้ว</b></span></button>
        <button class="option" role="radio" aria-checked="${ob.plantedStatus === 'before'}" data-act="ob-set" data-k="plantedStatus" data-v="before"><span class="o-emoji" aria-hidden="true">🪴</span><span class="o-text"><b>ปลูกไว้ก่อนหน้านี้</b></span></button>
      </div></div>
      ${ob.plantedStatus === 'before' ? C.Field({ id: 'obPDate', label: 'ปลูกวันที่', err: E.plantedDate, html: `<input class="input" type="date" id="obPDate" data-bind="ob.plantedDate" value="${esc(ob.plantedDate)}" max="${U.todayKey()}">` }) : ''}`;
  } else if (s === 5) {
    const sun = SUN_OPTIONS.find(x => x.v === ob.sunlight);
    const gt = GARDEN_TYPES.find(x => x.v === ob.gardenType);
    body = `<h1>5️⃣ พร้อมเริ่มแล้ว 🌱</h1><p class="muted">ตรวจดูอีกครั้ง แก้ไขภายหลังได้เสมอ</p>
      <div class="card"><dl class="kv">
        <dt>ชื่อ</dt><dd>${esc(ob.name)}</dd>
        <dt>จังหวัด</dt><dd>${esc(ob.province)}</dd>
        <dt>สวน</dt><dd>${esc(ob.gardenName)}</dd>
        <dt>ปลูกแบบ</dt><dd>${gt ? gt.emoji + ' ' + gt.label : '-'}</dd>
        <dt>แสงแดด</dt><dd>${sun ? sun.label : '-'}</dd>
        <dt>ต้นไม้</dt><dd>${ob.speciesIds.map(id => esc(Garden.speciesById(id).nameTh)).join(', ')}</dd>
        <dt>สถานะ</dt><dd>${ob.plantedStatus === 'notyet' ? 'ยังไม่ได้ปลูก' : ob.plantedStatus === 'today' ? 'ปลูกวันนี้' : 'ปลูกเมื่อ ' + U.fmtDate(ob.plantedDate)}</dd>
      </dl></div>
      <div class="info"><span aria-hidden="true">📋</span><span>${ob.plantedStatus === 'notyet' ? `เราจะสร้าง "ภารกิจแรก" ${4 + ob.speciesIds.length} อย่าง: เลือกพื้นที่ ตรวจแดด เตรียมดิน เตรียมต้นไม้ และปลูก` : 'เราจะสร้างงานดูแลประจำวันตามอายุของต้นไม้ เช่น ตรวจดิน ตรวจใบ ตรวจแมลง'}</span></div>`;
  }
  return `<div class="wizard">
    <div><div class="wz-label"><button class="link-btn" data-act="ob-back" aria-label="ย้อนกลับ">← ย้อนกลับ</button><span>ขั้นที่ ${s} จาก 5</span></div>${C.WizardSteps(s - 1, OB_LABELS)}</div>
    <div class="wz-body">${body}</div>
    <div class="wz-foot">${s === 5 ? `<button class="btn primary" data-act="ob-finish">สร้างสวนของฉัน</button>` : `<button class="btn primary" data-act="ob-next">ถัดไป</button>`}</div>
  </div>`;
};

function obValidate(ob) {
  const e = {};
  if (ob.step === 1 && !ob.name.trim()) e.name = 'ใส่ชื่อเล่นสั้น ๆ ก็ได้ครับ';
  if (ob.step === 2) { if (!ob.gardenName.trim()) e.gardenName = 'กรุณาตั้งชื่อสวน'; if (!ob.gardenType) e.gardenType = 'กรุณาเลือกรูปแบบการปลูก'; }
  if (ob.step === 3 && !ob.sunlight) e.sunlight = 'กรุณาเลือกปริมาณแดด (ถ้าไม่รู้ เลือก "ไม่แน่ใจ")';
  if (ob.step === 4) {
    if (!ob.speciesIds.length) e.speciesIds = 'เลือกต้นไม้อย่างน้อย 1 อย่าง';
    if (ob.plantedStatus === 'before') {
      if (!U.isValidKey(ob.plantedDate)) e.plantedDate = 'กรุณาเลือกวันที่ปลูก';
      else if (ob.plantedDate > U.todayKey()) e.plantedDate = 'วันที่ปลูกต้องไม่เกินวันนี้';
    }
  }
  return e;
}

Object.assign(Actions, {
  'ob-next'() {
    const ob = obState();
    ob.errors = obValidate(ob);
    if (Object.keys(ob.errors).length) { App.render(); const f = document.querySelector('.err-msg'); if (f) f.scrollIntoView({ block: 'center' }); return; }
    ob.step++; App.render({ scrollTop: true });
  },
  'ob-back'() { const ob = obState(); ob.errors = {}; ob.step = Math.max(0, ob.step - 1); App.render({ scrollTop: true }); },
  'ob-set'(el) { const ob = obState(); ob[el.dataset.k] = el.dataset.v; if (el.dataset.k === 'gardenType') ob.typeUnsure = false; ob.errors = {}; App.render(); },
  'ob-type-unsure'() { const ob = obState(); ob.typeUnsure = true; ob.gardenType = 'pot'; ob.errors = {}; App.render(); },
  'ob-species'(el) {
    const ob = obState(); const id = el.dataset.id;
    ob.speciesIds = ob.speciesIds.includes(id) ? ob.speciesIds.filter(x => x !== id) : ob.speciesIds.concat(id);
    ob.errors = {}; App.render();
  },
  'ob-add-custom'() {
    const ob = obState();
    try {
      const sp = Garden.addCustomSpecies(ob.customName);
      if (!ob.speciesIds.includes(sp.id)) ob.speciesIds.push(sp.id);
      ob.customName = ''; ob.errors = {}; App.render();
      Toast.show(`เพิ่ม "${sp.nameTh}" แล้ว`);
    } catch (err) { Toast.show(err.message); }
  },
  async 'ob-finish'() {
    const ob = obState();
    try {
      await Garden.completeOnboarding(ob);
      await Garden.runDailyNotifications();
      ob.step = 6; App.render({ scrollTop: true });
    } catch (err) {
      Toast.show('ขออภัย สร้างสวนไม่สำเร็จ ลองอีกครั้งนะครับ');
    }
  },
  'ob-start'() { App.ui.ob = null; App.tab = 'today'; App.stack = []; App.render({ scrollTop: true }); },
});

/* Onboarding ต้องแสดงหน้า "พร้อมแล้ว" ก่อนเข้า dashboard แม้มี user แล้ว */
const _origRender = App.render.bind(App);
App.render = function (opts) {
  if (App.ui.ob && App.ui.ob.step === 6) { App.root.innerHTML = Views.onboarding(); App.afterRender(true); return; }
  return _origRender(opts);
};

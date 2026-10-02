/* ============================================================
 * ui/components.js — Reusable components (pure render → HTML string)
 * AppHeader, BottomNavigation, PlantCard, TaskCard, Checklist, ProgressBar,
 * PlantStatusBadge, WeatherCard, WateringCard, FertilizerCard, Calendar,
 * PlantTimeline, PhotoTimeline, EmptyState, Modal/BottomSheet, StepWizard,
 * ConfirmationDialog, Toast, LoadingState, ErrorState
 * ============================================================ */
const esc = U.esc;

const ICON = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  chev: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round"><path d="M9 6l6 6-6 6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.9 1.9 0 003.4 0"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};

/* ---------- Plant illustration (no external images) ---------- */
const PlantArt = (() => {
  const C = 60, CY = 52;
  const ring = (n, rx, ry, dist, fill, rot = 0, extra = '') => Array.from({ length: n }, (_, i) =>
    `<ellipse cx="${C}" cy="${CY - dist}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra} transform="rotate(${rot + i * 360 / n} ${C} ${CY})"/>`).join('');
  const stem = (leaf = '#5DAE7E') => `<path d="M60 118 C60 98 58 84 60 64" stroke="#4E9A6E" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="46" cy="94" rx="13" ry="6" fill="${leaf}" transform="rotate(-30 46 94)"/><ellipse cx="74" cy="86" rx="13" ry="6" fill="${leaf}" transform="rotate(28 74 86)"/>`;
  function svg(sp) {
    const im = (sp && sp.image) || { kind: 'sprout', petal: '#7CC59A', center: '#4E9A6E', bg: '#E3F4E9' };
    if (im.src) return `<img src="${esc(im.src)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover">`;
    const P = im.petal, Ce = im.center, st = im.stroke ? `stroke="${im.stroke}" stroke-width="1.5"` : '';
    let f = '';
    switch (im.kind) {
      case 'round5':
        f = im.small ? ring(5, 12, 15, 13, P, 0, st) + `<circle cx="60" cy="52" r="6" fill="${Ce}"/>`
          : ring(5, 17, 23, 19, P, 0, st) + `<circle cx="60" cy="52" r="7" fill="${Ce}"/><path d="M60 52 L72 30" stroke="${Ce}" stroke-width="3" stroke-linecap="round"/><circle cx="72" cy="29" r="3.5" fill="${Ce}"/>`;
        break;
      case 'bract': {
        const cl = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-60 -52)">${ring(3, 15, 21, 15, P, 0, 'fill-opacity=".95"')}<circle cx="60" cy="52" r="4" fill="${Ce}"/></g>`;
        f = cl(36, 66, .55) + cl(84, 64, .55) + cl(60, 52, 1);
        break;
      }
      case 'pom':
        f = ring(14, 8, 10, 22, P) + ring(11, 7, 9, 14, P, 12, 'fill-opacity=".9"') + `<circle cx="60" cy="52" r="10" fill="${Ce}"/>` + ring(6, 3, 5, 6, P, 0);
        break;
      case 'daisy':
        f = im.big ? ring(18, 6, 15, 27, P, 0, st) + `<circle cx="60" cy="52" r="17" fill="${Ce}"/><circle cx="60" cy="52" r="11" fill="${Ce}" stroke="#4a2a12" stroke-dasharray="2 3" stroke-width="2"/>`
          : ring(14, 6, 15, 20, P, 0, st) + (im.layers === 2 ? ring(12, 5, 11, 13, P, 15, `fill-opacity=".85" ${st}`) : '') + `<circle cx="60" cy="52" r="8" fill="${Ce}"/>`;
        break;
      case 'star':
        f = ring(6, 6, 16, 15, P, 0, st) + ring(6, 5, 12, 10, P, 30, st) + `<circle cx="60" cy="52" r="5" fill="${Ce}"/>`;
        break;
      case 'rose':
        f = ring(6, 14, 18, 16, P, 0, st) + ring(5, 11, 14, 10, P, 30, st) + ring(4, 7, 9, 5, P, 10, st) + `<circle cx="60" cy="52" r="4" fill="${Ce}"/>`;
        break;
      case 'cluster': {
        const pts = [[60, 36], [48, 42], [72, 42], [40, 54], [60, 50], [80, 54], [50, 62], [70, 62], [60, 66]];
        f = pts.map(([x, y]) => `<g transform="translate(${x - 60} ${y - 52})">${ring(4, 4, 7, 6, P)}<circle cx="60" cy="52" r="2" fill="${Ce}"/></g>`).join('');
        break;
      }
      case 'orchid':
        f = `<ellipse cx="60" cy="30" rx="8" ry="18" fill="${P}"/>
             <ellipse cx="60" cy="52" rx="24" ry="13" fill="${P}" transform="rotate(-25 60 52)" fill-opacity=".9"/>
             <ellipse cx="60" cy="52" rx="24" ry="13" fill="${P}" transform="rotate(25 60 52)" fill-opacity=".9"/>
             <ellipse cx="44" cy="66" rx="7" ry="15" fill="${P}" transform="rotate(35 44 66)"/><ellipse cx="76" cy="66" rx="7" ry="15" fill="${P}" transform="rotate(-35 76 66)"/>
             <path d="M50 58 Q60 82 70 58 Q60 64 50 58Z" fill="#7D3A9A"/><circle cx="60" cy="54" r="5" fill="${Ce}"/>`;
        break;
      case 'anthurium':
        f = `<path d="M60 76 C30 62 26 30 46 26 C54 24 58 30 60 36 C62 30 66 24 74 26 C94 30 90 62 60 76Z" fill="${P}"/>
             <path d="M60 76 C40 64 36 40 48 34" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none"/>
             <rect x="56" y="26" width="8" height="30" rx="4" fill="${Ce}" transform="rotate(18 60 50)"/>`;
        break;
      case 'begonia': {
        const fl = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-60 -52)"><ellipse cx="60" cy="38" rx="13" ry="14" fill="${P}"/><ellipse cx="60" cy="66" rx="13" ry="14" fill="${P}"/><ellipse cx="46" cy="52" rx="9" ry="8" fill="${P}" fill-opacity=".85"/><ellipse cx="74" cy="52" rx="9" ry="8" fill="${P}" fill-opacity=".85"/><circle cx="60" cy="52" r="6" fill="${Ce}"/></g>`;
        f = fl(44, 60, .6) + fl(66, 48, .85);
        break;
      }
      default:
        return `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="${im.bg}"/>
          <path d="M60 110 V70" stroke="#4E9A6E" stroke-width="5" stroke-linecap="round"/>
          <path d="M60 74 C40 72 32 54 34 44 C48 44 60 56 60 74Z" fill="${P}"/><path d="M60 66 C76 64 88 48 86 36 C70 36 60 50 60 66Z" fill="${Ce}"/></svg>`;
    }
    return `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="${im.bg}"/>${stem()}${f}</svg>`;
  }
  return { svg };
})();

const C = {
  /* ---------- AppHeader ---------- */
  AppHeader({ title, back = false, actions = true }) {
    const unread = Garden.unreadCount();
    return `<header class="header" id="appHeader"><div class="wrap header-in">
      ${back ? `<button class="icon-btn" data-act="back" aria-label="ย้อนกลับ">${ICON.back}</button><div class="header-title" role="heading" aria-level="1">${esc(title)}</div>`
        : `<div class="brand"><span class="brand-mark" aria-hidden="true">🌸</span><span>สวนของฉัน</span></div>`}
      ${actions ? `<button class="icon-btn" data-act="open-search" aria-label="ค้นหา">${ICON.search}</button>
      <button class="icon-btn" data-act="open-notifs" aria-label="การแจ้งเตือน${unread ? ` มี ${unread} รายการใหม่` : ''}">${ICON.bell}${unread ? `<span class="dot num">${unread > 9 ? '9+' : unread}</span>` : ''}</button>` : ''}
    </div></header>`;
  },

  /* ---------- BottomNavigation ---------- */
  BottomNavigation(active) {
    const items = [['today', '🏠', 'วันนี้'], ['plants', '🌱', 'ต้นไม้'], ['calendar', '📅', 'ปฏิทิน'], ['help', '🆘', 'ช่วยฉัน'], ['profile', '👤', 'สวนของฉัน']];
    return `<nav class="bnav" aria-label="เมนูหลัก"><div class="rail-brand"><span class="brand-mark" aria-hidden="true">🌸</span>สวนของฉัน</div><ul>
      ${items.map(([k, e, l]) => `<li><button data-act="tab" data-tab="${k}" ${active === k ? 'aria-current="page"' : ''}><span class="ico" aria-hidden="true">${e}</span><span>${l}</span></button></li>`).join('')}
    </ul></nav>`;
  },

  /* ---------- PlantStatusBadge ---------- */
  PlantStatusBadge(status) {
    const s = PLANT_STATUS[status] || PLANT_STATUS.normal;
    return `<span class="tag ${s.tone}"><span aria-hidden="true">${s.emoji}</span> ${s.label}</span>`;
  },

  ProgressBar(pct, { label = '', tone = '' } = {}) {
    const v = U.clamp(Math.round(pct), 0, 100);
    return `<div class="progress ${tone}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}" aria-label="${esc(label)}"><span style="width:${v}%"></span></div>`;
  },

  Thumb(plant, sp) {
    if (plant && plant.coverPhotoId) return `<div class="pthumb"><img data-photo="${esc(plant.coverPhotoId)}" alt="" loading="lazy"></div>`;
    return `<div class="pthumb">${PlantArt.svg(sp)}</div>`;
  },

  /* ---------- PlantCard ---------- */
  PlantCard(p, todayTasks) {
    const sp = Garden.speciesById(p.speciesId);
    const status = Garden.plantStatus(p, todayTasks);
    const pending = todayTasks.filter(t => t.userPlantId === p.id && !t.completed);
    const age = Garden.ageDays(p);
    const garden = Garden.gardens().length > 1 ? (Garden.repo.byId('gardens', p.gardenId) || {}).name : '';
    const todayLine = pending.length ? `${TASK_META[pending[0].type].emoji} ${esc(pending[0].title)}${pending.length > 1 ? ` +${pending.length - 1}` : ''}` : '✅ วันนี้ไม่มีงานค้าง';
    return `<button class="pcard" data-act="open-plant" data-id="${p.id}" aria-label="ดูต้น ${esc(Garden.plantName(p))}">
      ${C.Thumb(p, sp)}
      <div class="pinfo">
        <div class="pname">${esc(Garden.plantName(p))}</div>
        <div class="pmeta">${age == null ? (p.plannedDate ? `วางแผนปลูก ${U.fmtDate(p.plannedDate, { year: false })}` : 'ยังไม่ได้ปลูก') : `ปลูกมาแล้ว <span class="num">${age}</span> วัน`}${garden ? ` · ${esc(garden)}` : ''}${p.nickname && sp ? ` · ${esc(sp.nameTh)}` : ''}</div>
        <div class="badge-row">${C.PlantStatusBadge(status)}</div>
        <div class="pmeta">วันนี้: ${todayLine}</div>
      </div>
      <span class="t-chev">${ICON.chev}</span>
    </button>`;
  },

  /* ---------- TaskCard ---------- */
  TaskCard(t, { showPlant = true, showDate = false } = {}) {
    const meta = TASK_META[t.type] || TASK_META.GENERAL;
    const future = t.dueDate > U.todayKey();
    const p = t.userPlantId ? Garden.plant(t.userPlantId) : null;
    const g = !p && t.gardenId ? Garden.repo.byId('gardens', t.gardenId) : null;
    return `<li class="task ${t.completed ? 'done' : ''}" data-task="${esc(t.id)}">
      <button class="tcheck" data-act="task-check" data-id="${esc(t.id)}" ${future ? 'disabled' : ''} aria-label="${t.completed ? 'ยกเลิกเสร็จ: ' : 'ทำเสร็จ: '}${esc(t.title)}" aria-pressed="${t.completed}">
        <span class="box">${ICON.check.replace('<svg', '<svg')}</span></button>
      <button class="t-body" data-act="open-task" data-id="${esc(t.id)}">
        <span class="t-title">${esc(t.title)}</span>
        <span class="t-meta"><span class="tag ${meta.tone}">${meta.emoji} ${meta.label}</span>
          ${t.overdue ? '<span class="tag danger">ค้างอยู่</span>' : ''}
          ${showDate ? `<span>${U.fmtDate(t.dueDate, { year: false })}</span>` : ''}
          ${showPlant && g ? `<span>${esc(g.name)}</span>` : ''}
          ${t.recurrence ? `<span class="tiny">${esc(t.recurrence)}</span>` : ''}</span>
      </button><span class="t-chev" aria-hidden="true">${ICON.chev}</span>
    </li>`;
  },
  Checklist(tasks, opts) {
    if (!tasks.length) return '';
    return `<ul class="task-list">${tasks.map(t => C.TaskCard(t, opts)).join('')}</ul>`;
  },

  /* ---------- EmptyState / Error / Loading ---------- */
  EmptyState({ icon = '🌱', title, text = '', action = '', actionLabel = '' }) {
    return `<div class="empty"><div class="e-ico" aria-hidden="true">${icon}</div><h3>${esc(title)}</h3>${text ? `<p class="muted">${esc(text)}</p>` : ''}
      ${action ? `<button class="btn primary" data-act="${action}">${esc(actionLabel)}</button>` : ''}</div>`;
  },
  ErrorState({ text = 'ขออภัย ระบบยังโหลดข้อมูลไม่สำเร็จ ลองใหม่อีกครั้งนะครับ', action = 'retry' } = {}) {
    return `<div class="empty" role="alert"><div class="e-ico" aria-hidden="true">🥀</div><h3>มีบางอย่างผิดพลาด</h3><p class="muted">${esc(text)}</p><button class="btn primary" data-act="${action}">ลองอีกครั้ง</button></div>`;
  },
  LoadingState(text = 'กำลังเตรียมสวนของคุณ...') {
    return `<div class="loading-screen" role="status" aria-live="polite"><div><div class="sprout" aria-hidden="true">🌱</div><p>${esc(text)}</p></div></div>`;
  },

  /* ---------- WeatherCard (abstraction, ไม่สร้างคำแนะนำจากอากาศที่ไม่มีจริง) ---------- */
  WeatherCard(w, province) {
    if (w && w.available) {
      return `<div class="card tint-blue"><h3>🌤️ อากาศวันนี้ · ${esc(province)}</h3><p>${esc(w.summary || '')}</p></div>`;
    }
    return `<div class="card flat"><div class="care-row"><div class="care-ico blue" aria-hidden="true">🌤️</div><div>
      <h3>อากาศ · ${esc(province)}</h3>
      <p class="small muted">ยังไม่ได้เชื่อมต่อข้อมูลพยากรณ์อากาศ จึงยังไม่ปรับคำแนะนำตามอากาศ ใช้หลัก "ตรวจดินก่อนรดน้ำ" ได้ทุกวัน</p>
      <p class="small">ถ้ามีฝนตก อย่าลืมตรวจว่าดินแฉะหรือไม่ ก่อนรดน้ำครั้งต่อไป</p></div></div></div>`;
  },

  /* ---------- WateringCard ---------- */
  WateringCard(p, sp) {
    const logs = Garden.waterLogs(p.id).slice(0, 5);
    const warn = Garden.overwaterWarning(p.id);
    return `<div class="card"><div class="care-row"><div class="care-ico blue" aria-hidden="true">💧</div><div style="flex:1;min-width:0;display:grid;gap:6px">
      <h3>น้ำ</h3><p><b>ตรวจดินก่อนรดน้ำ</b></p><p class="small muted">${esc(sp ? sp.wateringGuideline : '')}</p></div></div>
      ${warn ? `<div class="warn"><span aria-hidden="true">⚠️</span><span>${esc(warn)}</span></div>` : ''}
      ${p.plantedDate ? `<button class="btn primary block" data-act="water-check" data-id="${p.id}">💧 ตรวจดิน</button>` : `<p class="tiny">เริ่มบันทึกการตรวจดินได้หลังปลูกแล้ว</p>`}
      ${logs.length ? `<div><div class="small" style="font-weight:600;margin-bottom:4px">ประวัติล่าสุด</div><ul class="hist">${logs.map(l => `<li><span aria-hidden="true">${SOIL_RESULT[l.soilCondition].emoji}</span><div><div>${SOIL_RESULT[l.soilCondition].label} · ${l.watered ? '<b>รดน้ำแล้ว</b>' : 'ไม่ได้รด'}</div><div class="h-at">${U.fmtDateTime(l.checkedAt)}${l.note ? ' · ' + esc(l.note) : ''}</div></div></li>`).join('')}</ul></div>` : ''}
    </div>`;
  },

  /* ---------- FertilizerCard ---------- */
  FertilizerCard(p, sp) {
    const logs = Garden.fertilizerLogs(p.id);
    const next = Garden.nextFertilizerDate(p);
    const last = logs[0];
    const stage = TaskEngine.growthStage(p, sp, U.todayKey());
    return `<div class="card"><div class="care-row"><div class="care-ico yellow" aria-hidden="true">🧪</div><div style="flex:1;min-width:0;display:grid;gap:6px">
      <h3>ปุ๋ย</h3><p class="small muted">${esc(sp ? sp.fertilizerGuideline : '')}</p></div></div>
      <dl class="kv"><dt>ระยะตอนนี้</dt><dd>${stage.emoji} ${stage.label}</dd>
        <dt>รอบปุ๋ยถัดไป</dt><dd>${next ? U.fmtDate(next) + ' (โดยประมาณ)' : 'หลังปลูกแล้ว'}</dd>
        <dt>ใส่ล่าสุด</dt><dd>${last ? `${U.fmtDate(last.appliedAt)} · ${esc(last.fertilizerName)}` : 'ยังไม่มีบันทึก'}</dd></dl>
      <div class="warn"><span aria-hidden="true">⚠️</span><span>ใช้อัตราตามฉลากผลิตภัณฑ์เป็นหลัก อย่าเพิ่มปริมาณปุ๋ยเองเพราะคิดว่าจะโตเร็วขึ้น ปุ๋ยมากเกินไปทำให้รากเสียหายได้</span></div>
      <button class="btn green block" data-act="fert-log" data-id="${p.id}">🧪 บันทึกการใส่ปุ๋ย</button>
      ${logs.length ? `<ul class="hist">${logs.map(l => `<li><span aria-hidden="true">🧪</span><div><div><b>${esc(l.fertilizerName)}</b>${l.amount ? ' · ' + esc(l.amount) : ''}</div><div class="h-at">${U.fmtDate(l.appliedAt)}${l.note ? ' · ' + esc(l.note) : ''}</div></div></li>`).join('')}</ul>` : ''}
    </div>`;
  },

  /* ---------- Growth stage path (การออกดอก) ---------- */
  StagePath(p, sp) {
    const cur = TaskEngine.growthStage(p, sp, U.todayKey());
    const idx = GROWTH_STAGES.findIndex(s => s.key === cur.key);
    return `<div class="stage-path" role="list" aria-label="ระยะการเติบโต">${GROWTH_STAGES.slice(1).map((s, i) => {
      const k = i + 1; const cls = k < idx ? 'done' : k === idx ? 'now' : '';
      return `<div class="stage ${cls}" role="listitem" ${cls === 'now' ? 'aria-current="step"' : ''}><span class="s-dot" aria-hidden="true">${s.emoji}</span><span>${s.label}</span></div>`;
    }).join('')}</div>`;
  },

  /* ---------- PlantTimeline (Journey) ---------- */
  PlantTimeline(p, sp) {
    const cur = TaskEngine.journeyPhase(p, sp, U.todayKey());
    const ci = JOURNEY_PHASES.findIndex(j => j.key === cur);
    return `<ol class="journey">${JOURNEY_PHASES.map((j, i) => {
      const cls = i < ci ? 'done' : i === ci ? 'now' : '';
      return `<li class="jstep ${cls}" ${cls === 'now' ? 'aria-current="step"' : ''}><span class="jdot" aria-hidden="true">${i < ci ? '✓' : j.icon}</span>
        <div><div class="jtitle">${j.title} <span class="tiny">· ${j.when}</span>${cls === 'now' ? ' <span class="tag pink">ตอนนี้</span>' : ''}</div>
        ${cls === 'now' || cls === '' && i === ci + 1 ? `<ul>${j.items.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}</div></li>`;
    }).join('')}</ol>`;
  },

  /* ---------- PhotoTimeline ---------- */
  PhotoTimeline(p) {
    const photos = Garden.photos(p.id);
    if (!photos.length) return C.EmptyState({ icon: '📷', title: 'ยังไม่มีรูป', text: 'ถ่ายรูปไว้วันนี้ แล้วกลับมาเทียบการเติบโตได้' });
    const dayLabel = ph => p.plantedDate ? `วันที่ ${Math.max(0, U.diffDays(U.isoToKey(ph.capturedAt), p.plantedDate)) + 1}` : U.fmtDate(U.isoToKey(ph.capturedAt), { year: false });
    const first = photos[0], last = photos[photos.length - 1];
    return `${photos.length > 1 ? `<div class="card"><div class="section-head"><h3>🌱 ดูการเติบโต</h3></div><div class="compare">
        <figure><div class="img"><img data-photo="${first.id}" alt="รูปแรก" loading="lazy"></div><figcaption>ก่อน · ${dayLabel(first)}</figcaption></figure>
        <figure><div class="img"><img data-photo="${last.id}" alt="รูปล่าสุด" loading="lazy"></div><figcaption>ล่าสุด · ${dayLabel(last)}</figcaption></figure></div></div>` : ''}
      <div class="photo-tl">${photos.slice().reverse().map(ph => `<button class="ph" data-act="view-photo" data-id="${ph.id}" aria-label="ดูรูป ${dayLabel(ph)}">
        <div class="img"><img data-photo="${ph.id}" alt="" loading="lazy"></div>
        <div class="cap"><b>📷 ${dayLabel(ph)}</b><span class="tiny">${U.fmtDate(U.isoToKey(ph.capturedAt))}</span>${ph.note ? `<span class="small">${esc(ph.note)}</span>` : ''}</div></button>`).join('')}</div>`;
  },

  PhotoUpload(plantId, { label = '📷 ถ่ายรูป / เลือกรูป', taskId = '' } = {}) {
    return `<label class="upload"><input type="file" accept="image/*" capture="environment" data-upload="${plantId}" data-task="${esc(taskId)}" aria-label="อัปโหลดรูปต้นไม้"><span aria-hidden="true" style="font-size:1.8rem">📷</span><span>${label}</span><span class="tiny">รูปจะถูกย่อขนาดและเก็บในเครื่องนี้</span></label>`;
  },

  /* ---------- StepWizard header ---------- */
  WizardSteps(cur, labels) {
    return `<div><div class="wz-steps" aria-hidden="true">${labels.map((_, i) => `<span class="${i <= cur ? 'on' : ''}"></span>`).join('')}</div>
      <p class="sr-only">ขั้นตอนที่ ${cur + 1} จาก ${labels.length}: ${esc(labels[cur])}</p></div>`;
  },

  Field({ id, label, hint = '', err = '', html }) {
    return `<div class="field ${err ? 'err' : ''}"><label for="${id}">${label}</label>${hint ? `<span class="hint" id="${id}-hint">${hint}</span>` : ''}${html}${err ? `<span class="err-msg" role="alert">${esc(err)}</span>` : ''}</div>`;
  },
};

/* ---------- Overlay: Modal / BottomSheet / Confirm / Toast ---------- */
const Overlay = {
  stack: [],
  open(html, { center = false, label = 'หน้าต่าง', onClose } = {}) {
    const root = document.getElementById('overlay-root');
    const el = document.createElement('div');
    el.className = 'overlay' + (center ? ' center' : '');
    el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}"><div class="grab" aria-hidden="true"></div>${html}</div>`;
    el.addEventListener('click', e => { if (e.target === el) Overlay.close(); });
    const prevFocus = document.activeElement;
    root.appendChild(el);
    this.stack.push({ el, onClose, prevFocus });
    document.body.style.overflow = 'hidden';
    const f = el.querySelector('[autofocus], button, input, select, textarea');
    setTimeout(() => f && f.focus(), 30);
    hydratePhotos(el);
    return el;
  },
  update(html) {
    const top = this.stack[this.stack.length - 1]; if (!top) return;
    const sheet = top.el.querySelector('.sheet');
    sheet.innerHTML = `<div class="grab" aria-hidden="true"></div>${html}`;
    hydratePhotos(sheet);
  },
  close() {
    const top = this.stack.pop(); if (!top) return;
    top.el.remove();
    if (!this.stack.length) document.body.style.overflow = '';
    if (top.onClose) top.onClose();
    if (top.prevFocus && document.contains(top.prevFocus)) top.prevFocus.focus();
  },
  closeAll() { while (this.stack.length) this.close(); },
  get isOpen() { return this.stack.length > 0; },
  head(title) { return `<div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-act="close-overlay" aria-label="ปิด">${ICON.close}</button></div>`; },

  /** ConfirmationDialog — ใช้แทน confirm() ที่ถูกปิดในบาง environment */
  confirm({ title, text, okLabel = 'ยืนยัน', danger = false }) {
    return new Promise(resolve => {
      let done = false;
      const el = this.open(`<div style="display:grid;gap:12px;padding-top:8px"><h2>${esc(title)}</h2><p class="muted">${esc(text)}</p>
        <div class="btn-row"><button class="btn ghost" data-c="no">ยกเลิก</button><button class="btn ${danger ? 'danger' : 'primary'}" data-c="yes">${esc(okLabel)}</button></div></div>`,
        { center: true, label: title, onClose: () => { if (!done) resolve(false); } });
      el.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => { done = true; resolve(b.dataset.c === 'yes'); Overlay.close(); }));
    });
  },
};

const Toast = {
  show(msg, { action, actionLabel, ms = 2800 } = {}) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status');
    el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(actionLabel)}</button>` : ''}`;
    if (action) el.querySelector('button').addEventListener('click', () => { action(); el.remove(); });
    root.appendChild(el);
    setTimeout(() => el.remove(), ms);
  },
};

function confetti(chars = ['🌸', '🌼', '🌱', '✨', '💮']) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('i');
    s.textContent = chars[i % chars.length];
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * .6) + 's';
    s.style.fontSize = (1 + Math.random()) + 'rem';
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2800);
}

/** Lazy-load รูปจาก IndexedDB เมื่อเลื่อนมาถึง */
const _photoObserver = ('IntersectionObserver' in window) ? new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { _photoObserver.unobserve(en.target); loadPhoto(en.target); } });
}, { rootMargin: '200px' }) : null;
async function loadPhoto(img) {
  const url = await PhotoStore.get(img.dataset.photo);
  if (url) img.src = url; else img.alt = 'ไม่พบรูป';
}
function hydratePhotos(root) {
  root.querySelectorAll('img[data-photo]:not([src])').forEach(img => _photoObserver ? _photoObserver.observe(img) : loadPhoto(img));
}

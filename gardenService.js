/* ============================================================
 * logic/gardenService.js — Application Logic (ไม่มี DOM ในไฟล์นี้)
 * UI เรียกฟังก์ชันที่นี่เท่านั้น ห้ามแก้ repo ตรงจาก UI
 * ============================================================ */
const BADGES = [
  { key: 'first_plant', emoji: '🌱', label: 'มือใหม่เริ่มปลูก', desc: 'ปลูกต้นแรกสำเร็จ' },
  { key: 'first_task', emoji: '🌸', label: 'ผ่านภารกิจแรก', desc: 'ทำงานดูแลสวนเสร็จครั้งแรก' },
  { key: 'care7', emoji: '🌿', label: 'ดูแลครบ 7 วัน', desc: 'ดูแลสวน 7 วัน (ไม่จำเป็นต้องติดกัน)' },
  { key: 'first_bloom', emoji: '🌺', label: 'ต้นแรกออกดอก', desc: 'มีต้นไม้ออกดอกเป็นครั้งแรก' },
  { key: 'care30', emoji: '🏡', label: 'ดูแลสวนครบ 30 วัน', desc: 'ดูแลสวนครบ 30 วัน' },
];

const SUN_OPTIONS = [
  { v: 'lt3', label: 'น้อยกว่า 3 ชั่วโมง', hours: 2 },
  { v: '3to5', label: '3–5 ชั่วโมง', hours: 4 },
  { v: '5to7', label: '5–7 ชั่วโมง', hours: 6 },
  { v: 'gt7', label: 'มากกว่า 7 ชั่วโมง', hours: 8 },
  { v: 'unsure', label: 'ไม่แน่ใจ', hours: null },
];
const GARDEN_TYPES = [
  { v: 'ground', label: 'ลงดิน', emoji: '🟫' },
  { v: 'pot', label: 'กระถาง', emoji: '🪴' },
  { v: 'box', label: 'กระบะปลูก', emoji: '📦' },
  { v: 'raised', label: 'แปลงยกสูง', emoji: '🧱' },
];
const EXPERIENCE = [
  { v: 'beginner', label: 'มือใหม่มาก', emoji: '🌱', desc: 'ไม่เคยปลูกเลย' },
  { v: 'some', label: 'เคยปลูกบ้าง', emoji: '🌿', desc: 'เคยลองมาบ้าง' },
  { v: 'experienced', label: 'มีประสบการณ์', emoji: '🌳', desc: 'ปลูกเป็นประจำ' },
];
const POT_SIZES = [
  { v: '', label: 'ไม่ระบุ' }, { v: 'S', label: 'เล็ก (ไม่เกิน 8 นิ้ว)' }, { v: 'M', label: 'กลาง (8–12 นิ้ว)' }, { v: 'L', label: 'ใหญ่ (12 นิ้วขึ้นไป)' },
];
const PLANT_STATUS = {
  planning: { label: 'รอปลูก', emoji: '🧺', tone: 'yellow' },
  normal: { label: 'ปกติ', emoji: '🟢', tone: 'green' },
  needs_care: { label: 'ต้องดูแลวันนี้', emoji: '💧', tone: 'blue' },
  problem: { label: 'มีปัญหา', emoji: '🟠', tone: 'danger' },
  flowering: { label: 'กำลังออกดอก', emoji: '🌸', tone: 'pink' },
};
const SOIL_RESULT = {
  dry: { emoji: '🟤', label: 'ดินแห้ง', advice: 'สามารถรดน้ำได้', detail: 'รดช้า ๆ ที่โคนต้นจนน้ำไหลออกก้นกระถาง (ถ้าปลูกลงดิน รดจนดินชุ่มลึก) ช่วงเช้าหรือเย็นดีที่สุด', tone: 'yellow' },
  moist: { emoji: '🟢', label: 'ดินชื้น', advice: 'ยังไม่จำเป็นต้องรดน้ำ', detail: 'ดินยังมีน้ำพอ รดเพิ่มอาจทำให้รากแฉะ พรุ่งนี้ค่อยตรวจใหม่', tone: 'green' },
  wet: { emoji: '🔵', label: 'ดินแฉะ', advice: 'งดน้ำก่อน และตรวจการระบายน้ำ', detail: 'เทน้ำในจานรองทิ้ง ดูว่ารูก้นกระถางไม่ตัน ถ้าปลูกลงดินและน้ำขัง ลองทำร่องให้น้ำไหลออก', tone: 'blue' },
};

const Garden = {
  repo: null,
  init(repo) { this.repo = repo; },
  get db() { return this.repo.db; },
  save() { return this.repo.commit(); },

  // ---------- Species ----------
  species() { return PLANT_SPECIES.concat(this.db.customSpecies); },
  speciesById(id) { return this.species().find(s => s.id === id) || null; },
  addCustomSpecies(nameTh) {
    const name = String(nameTh || '').trim();
    if (!name) throw new Error('กรุณาใส่ชื่อต้นไม้');
    const existing = this.species().find(s => s.nameTh === name);
    if (existing) return existing;
    const sp = makeCustomSpecies(name);
    this.db.customSpecies.push(sp);
    return sp;
  },

  // ---------- Onboarding ----------
  /** @param f {name, experience, province, gardenName, gardenType, sunlight, speciesIds[], plantedStatus:'notyet'|'today'|'before', plantedDate} */
  async completeOnboarding(f) {
    const now = U.nowISO();
    const user = { id: U.uid('usr'), name: (f.name || '').trim() || 'เพื่อนนักปลูก', province: f.province || DEFAULT_PROVINCE, gardenType: f.gardenType, sunlight: f.sunlight, experienceLevel: f.experience || 'beginner', createdAt: now };
    this.db.user = user;
    const garden = this.addGarden({ name: f.gardenName || 'สวนหลังบ้าน', location: user.province, gardenType: f.gardenType, sunlight: f.sunlight, soilType: '', notes: '' }, false);
    const planted = f.plantedStatus === 'today' ? U.todayKey() : f.plantedStatus === 'before' ? f.plantedDate : null;
    f.speciesIds.forEach(sid => this.addPlant({ gardenId: garden.id, speciesId: sid, plantedDate: planted, plantingType: f.gardenType }, false));
    if (!planted) this.createGardenPrepTasks(garden);
    await this.save();
    return garden;
  },

  createGardenPrepTasks(garden) {
    const due = U.todayKey();
    const defs = [
      ['spot', 'GENERAL', 'เลือกพื้นที่ปลูก', 'เลือกที่ที่แดดถึง น้ำไม่ขัง และเดินไปดูได้ทุกวัน', ['เดินดูรอบบ้าน หาที่ที่ไม่มีน้ำขังเวลาฝนตก', 'ควรอยู่ใกล้ก๊อกน้ำหรือสายยาง', 'ถ้าปลูกกระถาง เลือกที่วางที่มั่นคง']],
      ['sun', 'SUNLIGHT', 'ตรวจแสงแดด', 'นับว่าตรงนั้นมีแดดส่องกี่ชั่วโมง', ['ดูตอน 9 โมง เที่ยง และบ่าย 3', 'นับชั่วโมงที่มีแดดส่องตรง', 'ไม้ดอกส่วนใหญ่ชอบแดด 6 ชั่วโมงขึ้นไป']],
      ['soil', 'GENERAL', 'เตรียมดิน', 'ดินร่วน ระบายน้ำดี รากเดินง่าย', ['ถ้าปลูกกระถาง: ใช้ดินผสมพร้อมปลูก', 'ถ้าปลูกลงดิน: ขุดดิน เก็บหินและรากหญ้าออก', 'ผสมปุ๋ยหมักกับดินเพื่อให้ดินร่วน']],
      ['prep', 'GENERAL', 'เตรียมต้นไม้และอุปกรณ์', 'เตรียมให้พร้อมก่อนลงมือปลูก', ['ต้นไม้ (เลือกต้นที่ใบเขียว ไม่มีแมลง)', 'กระถางที่มีรูระบายน้ำ (ถ้าปลูกกระถาง)', 'ช้อนปลูกหรือเสียม ถุงมือ', 'บัวรดน้ำหรือสายยาง']],
    ];
    defs.forEach(([k, type, title, description, steps]) => {
      this.db.tasks.push({ id: `${garden.id}|prep-${k}`, userPlantId: null, gardenId: garden.id, type, title, description, steps, dueDate: due, completed: false, completedAt: null, recurrence: null, priority: 1, stage: 'prep', source: 'custom', firstDay: true });
    });
  },

  // ---------- Garden ----------
  gardens() { return this.db.gardens; },
  addGarden(g, commit = true) {
    const name = String(g.name || '').trim();
    if (!name) throw new Error('กรุณาใส่ชื่อสวน');
    const garden = { id: U.uid('gdn'), userId: this.db.user && this.db.user.id, name, location: g.location || DEFAULT_PROVINCE, gardenType: g.gardenType || 'pot', sunlight: g.sunlight || 'unsure', soilType: g.soilType || '', notes: g.notes || '', createdAt: U.nowISO() };
    this.db.gardens.push(garden);
    if (commit) this.save();
    return garden;
  },
  updateGarden(id, patch) {
    if ('name' in patch && !String(patch.name).trim()) throw new Error('กรุณาใส่ชื่อสวน');
    this.repo.update('gardens', id, patch); return this.save();
  },
  deleteGarden(id) {
    if (this.db.gardens.length <= 1) throw new Error('ต้องมีสวนอย่างน้อย 1 สวน');
    this.plants().filter(p => p.gardenId === id).forEach(p => this.deletePlant(p.id, false));
    this.repo.remove('gardens', g => g.id === id);
    this.repo.remove('tasks', t => t.gardenId === id);
    return this.save();
  },

  // ---------- Plants ----------
  plants() { return this.db.plants; },
  plant(id) { return this.repo.byId('plants', id); },
  validatePlant(d) {
    const errors = {};
    if (!d.speciesId || !this.speciesById(d.speciesId)) errors.speciesId = 'กรุณาเลือกชนิดต้นไม้';
    if (!d.gardenId || !this.repo.byId('gardens', d.gardenId)) errors.gardenId = 'กรุณาเลือกสวน';
    if (d.plantedDate) {
      if (!U.isValidKey(d.plantedDate)) errors.plantedDate = 'วันที่ไม่ถูกต้อง';
      else if (d.plantedDate > U.todayKey()) errors.plantedDate = 'วันที่ปลูกต้องไม่เกินวันนี้ ถ้ายังไม่ได้ปลูก เลือก "ยังไม่ได้ปลูก"';
      else if (U.diffDays(U.todayKey(), d.plantedDate) > 3650) errors.plantedDate = 'วันที่เก่าเกินไป ลองตรวจสอบปีอีกครั้ง (ใช้ปี ค.ศ. ในปฏิทิน)';
    }
    if (d.plannedDate && !U.isValidKey(d.plannedDate)) errors.plannedDate = 'วันที่ไม่ถูกต้อง';
    if (d.quantity != null && d.quantity !== '') {
      const q = Number(d.quantity);
      if (!Number.isInteger(q) || q < 1 || q > 999) errors.quantity = 'จำนวนต้นต้องเป็นตัวเลข 1–999';
    }
    if (d.nickname && d.nickname.length > 40) errors.nickname = 'ชื่อเล่นยาวได้ไม่เกิน 40 ตัวอักษร';
    return errors;
  },
  addPlant(d, commit = true) {
    const errors = this.validatePlant(d);
    if (Object.keys(errors).length) { const e = new Error('validation'); e.fields = errors; throw e; }
    const garden = this.repo.byId('gardens', d.gardenId);
    const p = {
      id: U.uid('plt'), gardenId: d.gardenId, speciesId: d.speciesId, nickname: (d.nickname || '').trim(),
      plantedDate: d.plantedDate || null, plannedDate: d.plantedDate ? null : (d.plannedDate || null),
      location: (d.location || '').trim(), plantingType: d.plantingType || garden.gardenType || 'pot', potSize: d.potSize || '',
      quantity: d.quantity ? Number(d.quantity) : 1, notes: (d.notes || '').trim(), status: 'normal',
      flowering: false, floweringSince: null, coverPhotoId: null, createdAt: U.nowISO(),
    };
    this.db.plants.push(p);
    if (commit) this.save();
    return p;
  },
  updatePlant(id, d) {
    const cur = this.plant(id);
    const merged = Object.assign({}, cur, d);
    const errors = this.validatePlant(merged);
    if (Object.keys(errors).length) { const e = new Error('validation'); e.fields = errors; throw e; }
    Object.assign(cur, {
      gardenId: merged.gardenId, speciesId: merged.speciesId, nickname: (merged.nickname || '').trim(),
      plantedDate: merged.plantedDate || null, plannedDate: merged.plantedDate ? null : (merged.plannedDate || null),
      location: (merged.location || '').trim(), plantingType: merged.plantingType, potSize: merged.potSize || '',
      quantity: merged.quantity ? Number(merged.quantity) : 1, notes: (merged.notes || '').trim(),
    });
    return this.save();
  },
  deletePlant(id, commit = true) {
    const photos = this.db.photoLogs.filter(x => x.userPlantId === id);
    photos.forEach(ph => PhotoStore.del(ph.id));
    ['waterLogs', 'fertilizerLogs', 'photoLogs', 'doctorReports'].forEach(c => this.repo.remove(c, x => x.userPlantId === id));
    this.repo.remove('tasks', t => t.userPlantId === id);
    Object.keys(this.db.taskState).forEach(k => { if (k.startsWith(id + '|')) delete this.db.taskState[k]; });
    this.repo.remove('plants', p => p.id === id);
    if (commit) return this.save();
  },
  plantName(p) { return TaskEngine.plantName(p, this.speciesById(p.speciesId)); },
  ageDays(p) { return p.plantedDate ? Math.max(0, U.diffDays(U.todayKey(), p.plantedDate)) : null; },
  async markFlowering(id, on) {
    const p = this.plant(id);
    p.flowering = !!on; p.floweringSince = on ? U.todayKey() : null;
    if (on && p.status === 'problem') p.status = 'normal';
    await this.save();
  },
  async setProblem(id, on, note) {
    const p = this.plant(id); p.status = on ? 'problem' : 'normal';
    if (on && note) p.problemNote = note; if (!on) p.problemNote = '';
    await this.save();
  },

  plantStatus(p, todayTasks) {
    if (!p.plantedDate) return 'planning';
    if (p.status === 'problem') return 'problem';
    const tt = (todayTasks || this.todayTasks()).filter(t => t.userPlantId === p.id && !t.completed);
    if (tt.length) return 'needs_care';
    if (p.flowering) return 'flowering';
    return 'normal';
  },

  // ---------- Tasks ----------
  withState(t) {
    if (t.source === 'engine') {
      const s = this.db.taskState[t.id];
      if (s) Object.assign(t, { completed: !!s.completed, completedAt: s.completedAt, result: s.result });
    }
    return t;
  },
  engineTasksFor(p) { return { sp: this.speciesById(p.speciesId) }; },
  tasksForDate(dk) {
    const out = [];
    this.plants().forEach(p => {
      const sp = this.speciesById(p.speciesId);
      TaskEngine.recurring(p, sp, dk).forEach(t => out.push(this.withState(t)));
      TaskEngine.oneTime(p, sp).filter(t => t.dueDate === dk).forEach(t => out.push(this.withState(t)));
    });
    this.db.tasks.filter(t => t.dueDate === dk).forEach(t => out.push(Object.assign({}, t)));
    return this.sortTasks(out);
  },
  todayTasks() {
    const today = U.todayKey();
    const out = this.tasksForDate(today);
    const seen = new Set(out.map(t => t.id));
    this.plants().forEach(p => {
      const sp = this.speciesById(p.speciesId);
      TaskEngine.oneTime(p, sp).filter(t => t.dueDate < today).map(t => this.withState(t))
        .filter(t => !t.completed && !seen.has(t.id)).forEach(t => { t.overdue = true; out.push(t); });
    });
    this.db.tasks.filter(t => t.dueDate < today && !t.completed && !seen.has(t.id))
      .forEach(t => out.push(Object.assign({}, t, { overdue: true })));
    return this.sortTasks(out);
  },
  sortTasks(list) {
    return list.sort((a, b) => (a.completed - b.completed) || ((a.firstDay ? 0 : 1) - (b.firstDay ? 0 : 1)) || (a.priority - b.priority) || a.title.localeCompare(b.title, 'th'));
  },
  findTask(id) {
    const custom = this.db.tasks.find(t => t.id === id);
    if (custom) return Object.assign({}, custom);
    const [pid] = id.split('|');
    const p = this.plant(pid);
    if (!p) return null;
    const sp = this.speciesById(p.speciesId);
    const parts = id.split('|');
    if (parts.length >= 3) {
      const dk = parts[parts.length - 1];
      return TaskEngine.recurring(p, sp, dk).map(t => this.withState(t)).find(t => t.id === id) || null;
    }
    return TaskEngine.oneTime(p, sp).map(t => this.withState(t)).find(t => t.id === id) || null;
  },
  async completeTask(id, result = {}) {
    const t = this.findTask(id);
    if (!t) throw new Error('ไม่พบงานนี้');
    const at = U.nowISO();
    if (t.source === 'custom') this.repo.update('tasks', id, { completed: true, completedAt: at, result });
    else this.db.taskState[id] = { completed: true, completedAt: at, result };
    let planted = false;
    if (t.type === 'PLANTING' && t.userPlantId) {
      const p = this.plant(t.userPlantId);
      if (p && !p.plantedDate) { p.plantedDate = U.todayKey(); p.plannedDate = null; planted = true; }
    }
    await this.save();
    const newBadges = await this.checkBadges();
    return { task: t, planted, newBadges };
  },
  async uncompleteTask(id) {
    const t = this.findTask(id);
    if (!t) return;
    if (t.source === 'custom') this.repo.update('tasks', id, { completed: false, completedAt: null });
    else delete this.db.taskState[id];
    await this.save();
  },
  async addCustomTask({ title, dueDate, userPlantId, description, type = 'GENERAL' }) {
    const errors = {};
    if (!String(title || '').trim()) errors.title = 'กรุณาใส่ชื่องาน';
    if (!U.isValidKey(dueDate)) errors.dueDate = 'วันที่ไม่ถูกต้อง';
    if (Object.keys(errors).length) { const e = new Error('validation'); e.fields = errors; throw e; }
    const p = userPlantId ? this.plant(userPlantId) : null;
    const t = { id: U.uid('tsk'), userPlantId: p ? p.id : null, gardenId: p ? p.gardenId : (this.db.gardens[0] || {}).id, type, title: title.trim(), description: (description || '').trim(), steps: [], dueDate, completed: false, completedAt: null, recurrence: null, priority: 2, stage: p ? TaskEngine.growthStage(p, this.speciesById(p.speciesId), dueDate).key : 'general', source: 'custom' };
    this.db.tasks.push(t);
    await this.save();
    return t;
  },
  async deleteCustomTask(id) { this.repo.remove('tasks', t => t.id === id); await this.save(); },

  firstDayProgress() {
    const prep = this.todayTasks().filter(t => t.firstDay || t.type === 'PLANTING');
    const all = this.db.tasks.filter(t => t.firstDay);
    const plantingAll = this.plants().map(p => ({ p, done: !!p.plantedDate }));
    const total = all.length + plantingAll.length;
    const done = all.filter(t => t.completed).length + plantingAll.filter(x => x.done).length;
    const active = all.some(t => !t.completed) || plantingAll.some(x => !x.done);
    return { total, done, active, hasPrep: all.length > 0, list: prep };
  },

  // ---------- Water ----------
  async logWater(plantId, { soilCondition, watered, note = '', amount = '' }) {
    if (!SOIL_RESULT[soilCondition]) throw new Error('กรุณาเลือกสภาพดิน');
    const log = { id: U.uid('wtr'), userPlantId: plantId, checkedAt: U.nowISO(), soilCondition, watered: !!watered, amount, note: String(note).trim() };
    this.db.waterLogs.push(log);
    await this.save();
    await this.checkOverwatering(plantId);
    return log;
  },
  waterLogs(plantId) { return this.db.waterLogs.filter(l => l.userPlantId === plantId).sort((a, b) => b.checkedAt.localeCompare(a.checkedAt)); },
  overwaterWarning(plantId) {
    const p = this.plant(plantId); if (!p) return null;
    const sp = this.speciesById(p.speciesId);
    const since = U.addDays(U.todayKey(), -2);
    const recent = this.waterLogs(plantId).filter(l => U.isoToKey(l.checkedAt) >= since);
    const wateredCount = recent.filter(l => l.watered).length;
    const wateredWhenWet = recent.some(l => l.watered && (l.soilCondition === 'wet' || l.soilCondition === 'moist'));
    const limit = (sp && sp.waterNeed === 'low') || p.plantingType === 'ground' ? 3 : 4;
    if (wateredWhenWet) return 'มีการรดน้ำตอนที่ดินยังชื้นหรือแฉะ ลองตรวจความชื้นดินก่อนรดครั้งต่อไป';
    if (wateredCount >= limit) return `ช่วง 3 วันนี้รดน้ำไป ${wateredCount} ครั้ง ถี่กว่าปกติ ลองตรวจความชื้นดินก่อนรดครั้งต่อไป`;
    return null;
  },
  async checkOverwatering(plantId) {
    const msg = this.overwaterWarning(plantId);
    if (msg) {
      const p = this.plant(plantId);
      await ServiceRegistry.notifications.notify({ type: 'warning', title: `⚠️ ${this.plantName(p)}: รดน้ำถี่กว่าปกติ`, body: msg, plantId, dedupeKey: `over:${plantId}:${U.todayKey()}` });
      await this.save();
    }
  },

  // ---------- Fertilizer ----------
  validateNPK(s) { return !s || /^\d{1,2}-\d{1,2}-\d{1,2}$/.test(String(s).trim()); },
  async addFertilizer(f) {
    const errors = {};
    if (!String(f.name || '').trim()) errors.name = 'กรุณาใส่ชื่อปุ๋ย';
    if (!f.npkUnknown && !this.validateNPK(f.npk)) errors.npk = 'รูปแบบสูตรควรเป็นตัวเลข เช่น 15-15-15 หรือเลือก "ไม่ทราบ"';
    if (f.startDate && !U.isValidKey(f.startDate)) errors.startDate = 'วันที่ไม่ถูกต้อง';
    if (Object.keys(errors).length) { const e = new Error('validation'); e.fields = errors; throw e; }
    const item = { id: U.uid('fz'), name: f.name.trim(), npk: f.npkUnknown ? '' : String(f.npk || '').trim(), type: f.type || 'unknown', labelRate: String(f.labelRate || '').trim(), startDate: f.startDate || U.todayKey(), createdAt: U.nowISO() };
    this.db.fertilizers.push(item);
    await this.save();
    return item;
  },
  async deleteFertilizer(id) { this.repo.remove('fertilizers', f => f.id === id); await this.save(); },
  async logFertilizer(plantId, { fertilizerId, fertilizerName, appliedAt, amount, note }) {
    const errors = {};
    const fz = fertilizerId ? this.repo.byId('fertilizers', fertilizerId) : null;
    const name = fz ? fz.name : String(fertilizerName || '').trim();
    if (!name) errors.fertilizerName = 'กรุณาเลือกหรือใส่ชื่อปุ๋ย (ถ้าไม่ทราบ พิมพ์ว่า "ไม่ทราบชื่อ")';
    const d = appliedAt || U.todayKey();
    if (!U.isValidKey(d)) errors.appliedAt = 'วันที่ไม่ถูกต้อง';
    else if (d > U.todayKey()) errors.appliedAt = 'วันที่ใส่ปุ๋ยต้องไม่เกินวันนี้';
    if (Object.keys(errors).length) { const e = new Error('validation'); e.fields = errors; throw e; }
    const log = { id: U.uid('fzl'), userPlantId: plantId, fertilizerId: fz ? fz.id : null, fertilizerName: name, appliedAt: d, amount: String(amount || '').trim(), note: String(note || '').trim(), createdAt: U.nowISO() };
    this.db.fertilizerLogs.push(log);
    await this.save();
    return log;
  },
  fertilizerLogs(plantId) { return this.db.fertilizerLogs.filter(l => l.userPlantId === plantId).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)); },
  lastFertilizer(plantId) { return this.fertilizerLogs(plantId)[0] || null; },
  nextFertilizerDate(p) {
    const sp = this.speciesById(p.speciesId);
    if (!p.plantedDate || !sp) return null;
    const d = U.diffDays(U.todayKey(), p.plantedDate);
    if (d < sp.fertStartDay) return U.addDays(p.plantedDate, sp.fertStartDay);
    const k = Math.ceil((d - sp.fertStartDay) / sp.fertIntervalDays);
    return U.addDays(p.plantedDate, sp.fertStartDay + k * sp.fertIntervalDays);
  },

  // ---------- Photos ----------
  async addPhoto(plantId, file, note = '') {
    const dataUrl = await resizeImageFile(file);
    const id = U.uid('pht');
    await PhotoStore.put(id, dataUrl);
    const log = { id, userPlantId: plantId, imageUrl: 'idb:' + id, capturedAt: U.nowISO(), note: String(note).trim() };
    this.db.photoLogs.push(log);
    const p = this.plant(plantId); if (p) p.coverPhotoId = id;
    await this.save();
    return log;
  },
  async deletePhoto(id) {
    const ph = this.repo.byId('photoLogs', id); if (!ph) return;
    await PhotoStore.del(id);
    this.repo.remove('photoLogs', x => x.id === id);
    const p = this.plant(ph.userPlantId);
    if (p && p.coverPhotoId === id) { const rest = this.photos(p.id); p.coverPhotoId = rest.length ? rest[rest.length - 1].id : null; }
    await this.save();
  },
  photos(plantId) { return this.db.photoLogs.filter(x => x.userPlantId === plantId).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)); },

  // ---------- Doctor ----------
  async saveDoctorReport(plantId, symptom, answers, result, makeFollowUp) {
    const rep = { id: U.uid('doc'), userPlantId: plantId, symptom, answers, causes: result.causes.map(c => c.title), createdAt: U.nowISO() };
    this.db.doctorReports.push(rep);
    const p = this.plant(plantId);
    const sym = DOCTOR_SYMPTOMS.find(s => s.key === symptom);
    if (p) { p.status = 'problem'; p.problemNote = sym ? sym.label : ''; }
    if (makeFollowUp && p) {
      this.db.tasks.push({ id: U.uid('tsk'), userPlantId: p.id, gardenId: p.gardenId, type: 'DISEASE_CHECK', title: `ติดตามอาการ${sym ? sym.label : ''} (${this.plantName(p)})`, description: 'ดูว่าอาการดีขึ้นหรือแย่ลง เทียบกับรูปครั้งก่อน', steps: ['ดูจุดที่มีอาการเดิม', 'ถ่ายรูปเทียบ', 'ถ้าดีขึ้น กด "อาการดีขึ้นแล้ว" ในหน้าต้นไม้'], dueDate: U.addDays(U.todayKey(), 3), completed: false, completedAt: null, recurrence: null, priority: 1, stage: 'problem', source: 'custom' });
    }
    await this.save();
    return rep;
  },

  // ---------- History ----------
  history(plantId) {
    const items = [];
    this.waterLogs(plantId).forEach(l => items.push({ at: l.checkedAt, emoji: '💧', text: `ตรวจดิน: ${SOIL_RESULT[l.soilCondition].label}${l.watered ? ' · รดน้ำแล้ว' : ' · ไม่ได้รด'}`, note: l.note }));
    this.fertilizerLogs(plantId).forEach(l => items.push({ at: l.createdAt || l.appliedAt, date: l.appliedAt, emoji: '🧪', text: `ใส่ปุ๋ย: ${l.fertilizerName}${l.amount ? ' · ' + l.amount : ''}`, note: l.note }));
    this.photos(plantId).forEach(l => items.push({ at: l.capturedAt, emoji: '📷', text: 'ถ่ายรูปต้นไม้', note: l.note }));
    Object.entries(this.db.taskState).filter(([k, s]) => k.startsWith(plantId + '|') && s.completed).forEach(([k, s]) => {
      const t = this.findTask(k);
      if (t && !['SOIL_CHECK', 'FERTILIZER', 'PHOTO'].includes(t.type)) items.push({ at: s.completedAt, emoji: '✅', text: t.title });
    });
    this.db.tasks.filter(t => t.userPlantId === plantId && t.completed).forEach(t => items.push({ at: t.completedAt, emoji: '✅', text: t.title }));
    this.db.doctorReports.filter(r => r.userPlantId === plantId).forEach(r => {
      const s = DOCTOR_SYMPTOMS.find(x => x.key === r.symptom);
      items.push({ at: r.createdAt, emoji: '🆘', text: `บันทึกอาการ: ${s ? s.label : r.symptom}` });
    });
    return items.sort((a, b) => b.at.localeCompare(a.at));
  },

  // ---------- Progress / Gamification ----------
  careDays() { return this.db.user ? U.diffDays(U.todayKey(), U.isoToKey(this.db.user.createdAt)) + 1 : 0; },
  activeDays() {
    const days = new Set();
    Object.values(this.db.taskState).forEach(s => s.completed && s.completedAt && days.add(U.isoToKey(s.completedAt)));
    this.db.tasks.forEach(t => t.completed && t.completedAt && days.add(U.isoToKey(t.completedAt)));
    this.db.waterLogs.forEach(l => days.add(U.isoToKey(l.checkedAt)));
    return days.size;
  },
  gardenGrowth() {
    const ps = this.plants();
    if (!ps.length) return 0;
    const today = U.todayKey();
    const sum = ps.reduce((acc, p) => {
      const sp = this.speciesById(p.speciesId);
      const idx = GROWTH_STAGES.findIndex(s => s.key === TaskEngine.growthStage(p, sp, today).key);
      let frac = idx / 5;
      // ความคืบหน้าระหว่าง stage (ละเอียดขึ้น)
      const d = TaskEngine.dayN(p, today);
      if (d != null && idx >= 1 && idx < 4) { const fs = sp ? sp.floweringStartDay : 90; frac = Math.min(0.8, 0.2 + (d / fs) * 0.6); }
      return acc + frac;
    }, 0);
    return Math.round((sum / ps.length) * 100);
  },
  async checkBadges() {
    const b = this.db.badges, earned = [];
    const give = (k) => { if (!b[k]) { b[k] = U.nowISO(); earned.push(BADGES.find(x => x.key === k)); } };
    if (this.plants().some(p => p.plantedDate)) give('first_plant');
    const anyDone = Object.values(this.db.taskState).some(s => s.completed) || this.db.tasks.some(t => t.completed);
    if (anyDone) give('first_task');
    const ad = this.activeDays();
    if (ad >= 7) give('care7');
    if (ad >= 30) give('care30');
    if (this.plants().some(p => p.flowering)) give('first_bloom');
    if (earned.length) {
      for (const e of earned) await ServiceRegistry.notifications.notify({ type: 'badge', title: `${e.emoji} ได้รับเหรียญ: ${e.label}`, body: e.desc, dedupeKey: 'badge:' + e.key });
      await this.save();
    }
    return earned;
  },

  // ---------- Notifications ----------
  async runDailyNotifications() {
    const today = U.todayKey();
    if (!this.db.user || this.db.meta.lastNotifyDay === today) return;
    const tasks = this.todayTasks().filter(t => !t.completed);
    const N = ServiceRegistry.notifications;
    if (tasks.length) await N.notify({ type: 'digest', title: `🌸 วันนี้มีงานดูแลสวน ${tasks.length} รายการ`, body: 'เปิดหน้า "วันนี้" เพื่อดูว่าต้องทำอะไรบ้าง', dedupeKey: 'digest:' + today });
    const soil = tasks.filter(t => t.type === 'SOIL_CHECK').slice(0, 3);
    for (const t of soil) await N.notify({ type: 'task', title: `🌱 ถึงเวลา${t.title}แล้ว`, body: 'ตรวจดินก่อนรดน้ำ ถ้าดินยังชื้นก็ยังไม่ต้องรด', taskId: t.id, dedupeKey: 'soil:' + t.id });
    this.db.meta.lastNotifyDay = today;
    await this.save();
  },
  unreadCount() { return this.db.notifications.filter(n => !n.read).length; },
  async markAllRead() { this.db.notifications.forEach(n => n.read = true); await this.save(); },

  // ---------- Settings ----------
  async updateUser(patch) {
    if ('name' in patch && !String(patch.name).trim()) throw new Error('กรุณาใส่ชื่อ');
    Object.assign(this.db.user, patch); await this.save();
  },
  sunlightMismatch(sp, sunV) {
    const o = SUN_OPTIONS.find(s => s.v === sunV);
    if (!sp || !o || o.hours == null || !sp.sunlight.minHours) return null;
    if (o.hours + 1 < sp.sunlight.minHours) return `${sp.nameTh} (${sp.sunlight.label}) อาจออกดอกน้อยถ้าได้แดดแค่ ${o.label}`;
    if (sp.sunlight.minHours <= 3 && o.hours >= 6) return `${sp.nameTh} (${sp.sunlight.label}) แดดจัดอาจทำให้ใบไหม้ ควรมีร่มเงาช่วงบ่าย`;
    return null;
  },
};

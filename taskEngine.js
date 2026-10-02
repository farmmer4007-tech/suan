/* ============================================================
 * logic/taskEngine.js — Checklist Engine (pure functions)
 * งานประจำ (recurring) คำนวณจาก วันปลูก + ชนิดพืช + รูปแบบปลูก แบบ deterministic
 * จึงไม่ต้องเก็บงานล่วงหน้าทั้งหมด เก็บเฉพาะสถานะการทำ (taskState) ตาม id
 * ============================================================ */
const TASK_TYPES = ['WATER', 'FERTILIZER', 'SUNLIGHT', 'SOIL_CHECK', 'PEST_CHECK', 'DISEASE_CHECK', 'PRUNING', 'WEEDING', 'PLANTING', 'PHOTO', 'GENERAL'];

const TASK_META = {
  WATER: { emoji: '💧', label: 'รดน้ำ', tone: 'blue' },
  SOIL_CHECK: { emoji: '💧', label: 'ตรวจดิน', tone: 'blue' },
  FERTILIZER: { emoji: '🧪', label: 'ปุ๋ย', tone: 'yellow' },
  SUNLIGHT: { emoji: '☀️', label: 'แสงแดด', tone: 'yellow' },
  PEST_CHECK: { emoji: '🐛', label: 'ตรวจแมลง', tone: 'green' },
  DISEASE_CHECK: { emoji: '🍃', label: 'ตรวจใบ', tone: 'green' },
  PRUNING: { emoji: '✂️', label: 'ตัดแต่ง', tone: 'pink' },
  WEEDING: { emoji: '🌾', label: 'ถอนหญ้า', tone: 'green' },
  PLANTING: { emoji: '🌱', label: 'ปลูก', tone: 'pink' },
  PHOTO: { emoji: '📷', label: 'ถ่ายรูป', tone: 'pink' },
  GENERAL: { emoji: '📝', label: 'งานทั่วไป', tone: 'green' },
};

const GROWTH_STAGES = [
  { key: 'prep', emoji: '🧺', label: 'เตรียมปลูก' },
  { key: 'establish', emoji: '🌱', label: 'ตั้งตัว' },
  { key: 'leafing', emoji: '🌿', label: 'แตกใบ' },
  { key: 'bushing', emoji: '🪴', label: 'สร้างทรงพุ่ม' },
  { key: 'budding', emoji: '🌸', label: 'เริ่มสร้างตาดอก' },
  { key: 'flowering', emoji: '🌺', label: 'ออกดอก' },
];

const JOURNEY_PHASES = [
  { key: 'prep', icon: '🧺', title: 'เตรียมพื้นที่', when: 'ก่อนปลูก', items: ['เลือกตำแหน่ง', 'ตรวจแสง', 'เตรียมดิน', 'เตรียมอุปกรณ์และน้ำ'] },
  { key: 'plant', icon: '🌱', title: 'วันปลูก', when: 'วันที่ 1', items: ['เตรียมหลุม/กระถาง', 'ปลูกและกลบดิน', 'รดน้ำครั้งแรก', 'ถ่ายรูปต้นไม้'] },
  { key: 'd2_7', icon: '🌱', title: 'ช่วงตั้งตัว', when: 'วันที่ 2–7', items: ['ตรวจดินทุกวัน', 'ตรวจใบ', 'ตรวจแมลง', 'ไม่ย้ายหรือรบกวนราก'] },
  { key: 'w2', icon: '🌿', title: 'สัปดาห์ที่ 2', when: 'วันที่ 8–14', items: ['ตรวจการเติบโต', 'ถอนวัชพืช', 'ตรวจการระบายน้ำ', 'ตรวจแมลง'] },
  { key: 'w3_4', icon: '🌿', title: 'สัปดาห์ที่ 3–4', when: 'วันที่ 15–30', items: ['ตรวจสุขภาพใบ', 'ตรวจทรงพุ่ม', 'งานปุ๋ยตามฉลาก'] },
  { key: 'grow', icon: '🪴', title: 'ดูแลการเติบโต', when: 'เดือนที่ 2 ขึ้นไป', items: ['ตรวจดินก่อนรด', 'ปุ๋ยตามรอบ', 'ตัดแต่งตามชนิดพืช'] },
  { key: 'bloom', icon: '🌸', title: 'ระยะออกดอก', when: 'เมื่อเริ่มมีตาดอก', items: ['ตรวจตาดอก', 'ตรวจแมลงที่ดอก', 'เด็ดดอกโรย', 'บันทึกภาพ'] },
];

const TaskEngine = {
  plantName(plant, sp) { return plant.nickname || (sp ? sp.nameTh.replace(/\s*\(.*\)/, '') : 'ต้นไม้'); },
  isMediumNotSoil(sp) { return sp && (sp.medium === 'orchid' || sp.medium === 'airy'); },

  dayN(plant, dk) { return plant.plantedDate ? U.diffDays(dk, plant.plantedDate) : null; },

  growthStage(plant, sp, dk) {
    const d = this.dayN(plant, dk);
    if (d == null || d < 0) return GROWTH_STAGES[0];
    if (plant.flowering) return GROWTH_STAGES[5];
    const fs = sp ? sp.floweringStartDay : 90;
    if (d >= fs) return GROWTH_STAGES[4];
    if (d >= 30) return GROWTH_STAGES[3];
    if (d >= 14) return GROWTH_STAGES[2];
    return GROWTH_STAGES[1];
  },
  journeyPhase(plant, sp, dk) {
    const d = this.dayN(plant, dk);
    if (d == null || d < 0) return 'prep';
    if (plant.flowering || (sp && d >= sp.floweringStartDay)) return 'bloom';
    if (d === 0) return 'plant';
    if (d <= 6) return 'd2_7';
    if (d <= 13) return 'w2';
    if (d <= 29) return 'w3_4';
    return 'grow';
  },

  soilInterval(plant, sp, d) {
    if (this.isMediumNotSoil(sp)) return 1;
    const type = plant.plantingType || 'pot';
    if (d <= 14) return 1;
    if (type === 'ground') return sp && sp.waterNeed === 'low' ? 3 : sp && sp.waterNeed === 'high' ? 1 : 2;
    return sp && sp.waterNeed === 'low' ? 2 : 1;
  },

  /** สร้าง Task object มาตรฐาน */
  make(plant, sp, key, type, dk, extra) {
    const pri = { PLANTING: 1, SOIL_CHECK: 1, PEST_CHECK: 2, DISEASE_CHECK: 2, FERTILIZER: 2, GENERAL: 2 }[type] || 3;
    return Object.assign({
      id: `${plant.id}|${key}`, userPlantId: plant.id, gardenId: plant.gardenId, type,
      dueDate: dk, completed: false, completedAt: null, recurrence: null, priority: pri,
      stage: this.growthStage(plant, sp, dk).key, source: 'engine', steps: [], description: '',
    }, extra);
  },

  /** งานประจำของต้นนี้ ณ วันที่ dk */
  recurring(plant, sp, dk) {
    const d = this.dayN(plant, dk);
    if (d == null || d < 1) return [];
    if (dk < U.isoToKey(plant.createdAt)) return [];
    const n = this.plantName(plant, sp);
    const out = [];
    const mk = (key, type, extra) => out.push(this.make(plant, sp, `${key}|${dk}`, type, dk, extra));
    const medium = this.isMediumNotSoil(sp);

    const si = this.soilInterval(plant, sp, d);
    if (d % si === 0) {
      mk('soil', 'SOIL_CHECK', {
        title: `${medium ? 'ตรวจวัสดุปลูก' : 'ตรวจดิน'}${n}`,
        description: 'ตรวจก่อนรดน้ำทุกครั้ง ไม่ต้องรดตามตาราง',
        steps: medium
          ? ['ใช้นิ้วแตะวัสดุปลูก (กาบมะพร้าว/ถ่าน) ด้านใน', 'สังเกตว่าแห้ง ชื้น หรือแฉะ', 'เลือกผลด้านล่าง']
          : ['ใช้นิ้วจิ้มดินลึกประมาณ 2–3 ซม.', 'สังเกตความชื้นที่ติดนิ้ว', 'เลือกผลด้านล่าง'],
        recurrence: si === 1 ? 'ทุกวัน' : `ทุก ${si} วัน`,
      });
    }
    if ((d <= 7 && d % 2 === 1) || (d > 7 && d % 7 === 3)) {
      mk('leaf', 'DISEASE_CHECK', {
        title: `ตรวจใบ${n}`, description: 'ดูสีใบและจุดผิดปกติ ใช้เวลาไม่ถึง 1 นาที',
        steps: ['ดูใบบนและใบล่างว่าเขียวดีไหม', 'ดูว่ามีจุด ใบเหลือง หรือใบไหม้ไหม', 'ถ้าเจออะไรแปลก ๆ กด "พบปัญหา"'],
        recurrence: d <= 7 ? 'ทุก 2 วัน' : 'สัปดาห์ละครั้ง',
      });
    }
    if ((d <= 7 && d % 3 === 2) || (d > 7 && d % 4 === 2)) {
      mk('pest', 'PEST_CHECK', {
        title: `ตรวจแมลง${n}`, description: 'แมลงชอบซ่อนใต้ใบและที่ยอดอ่อน',
        steps: ['พลิกดูใต้ใบ 3–4 ใบ', 'ดูยอดอ่อนและดอกตูม', 'สังเกตปุยขาว ตัวเล็ก ๆ หรือรอยแหว่ง'],
        recurrence: d <= 7 ? 'ทุก 3 วัน' : 'ทุก 4 วัน',
      });
    }
    const type = plant.plantingType || 'pot';
    if (type !== 'pot' && d >= 7 && d % 7 === 0) {
      mk('weed', 'WEEDING', {
        title: `ถอนวัชพืชรอบ${n}`, description: 'หญ้ารอบโคนแย่งน้ำและอาหาร',
        steps: ['ถอนหญ้าในรัศมีประมาณ 1 ฝ่ามือรอบโคน', 'ถอนให้ติดราก', 'ระวังอย่าดึงโดนรากต้นไม้ของเรา'],
        recurrence: 'สัปดาห์ละครั้ง',
      });
    }
    if (sp && d >= sp.fertStartDay && (d - sp.fertStartDay) % sp.fertIntervalDays === 0) {
      mk('fert', 'FERTILIZER', {
        title: `ถึงรอบปุ๋ย${n}`, description: 'ใช้ตามอัตราบนฉลากผลิตภัณฑ์เท่านั้น',
        steps: ['อ่านอัตราการใช้บนฉลากปุ๋ย', 'รดน้ำให้ดินชื้นก่อนใส่ปุ๋ย', 'ใส่ห่างจากโคนต้นเล็กน้อย ไม่กองติดลำต้น', 'บันทึกการใส่ปุ๋ยด้านล่าง'],
        recurrence: `ทุก ${sp.fertIntervalDays} วัน (โดยประมาณ)`,
      });
    }
    (sp && sp.pruneTasks || []).forEach((p, i) => {
      if (p.every && d >= p.day && (d - p.day) % p.every === 0) {
        mk('prune' + i, 'PRUNING', {
          title: `${p.title} (${n})`, description: sp.pruningNotes,
          steps: ['ใช้กรรไกรคมและสะอาด', 'ตัดกิ่งแห้ง กิ่งเสียก่อน', 'ตัดเหนือข้อหรือตาใบประมาณ 0.5–1 ซม.'],
          recurrence: `ทุก ${p.every} วัน (ถ้าจำเป็น)`,
        });
      }
    });
    // งานตรวจเฉพาะชนิดพืช (ฟิลด์เสริม extraChecks ใน Plant Database)
    (sp && sp.extraChecks || []).forEach(x => {
      if (d >= x.startDay && (d - x.startDay) % x.every === 0) {
        mk('x-' + x.key, x.type || 'GENERAL', {
          title: x.title.replace('{name}', n), description: x.description || '', steps: x.steps || [],
          recurrence: x.every === 1 ? 'ทุกวัน' : x.every === 7 ? 'สัปดาห์ละครั้ง' : `ทุก ${x.every} วัน`,
        });
      }
    });
    if (plant.flowering && sp && sp.deadhead && d % 7 === 5) {
      mk('deadhead', 'PRUNING', {
        title: `เด็ดดอกที่โรย (${n})`, description: 'ช่วยให้ต้นออกดอกใหม่ต่อเนื่อง',
        steps: ['หาดอกที่เหี่ยวหรือแห้ง', 'เด็ดหรือตัดใต้ดอกลงมาถึงใบคู่แรก', 'ทิ้งดอกโรยให้ห่างต้น'], recurrence: 'สัปดาห์ละครั้ง',
      });
    }
    const stage = this.growthStage(plant, sp, dk).key;
    if ((stage === 'budding' || stage === 'flowering') && d % 7 === 4) {
      mk('bud', 'GENERAL', {
        title: stage === 'flowering' ? `ดูแลช่วงออกดอก (${n})` : `ตรวจตาดอก${n}`,
        description: 'ระยะออกดอกขึ้นกับพันธุ์และสภาพแวดล้อม ไม่มีวันที่แน่นอน',
        steps: ['ดูปลายกิ่งว่ามีตาดอกเล็ก ๆ ไหม', 'ตรวจแมลงที่ดอกตูม', 'อย่าย้ายต้นบ่อยช่วงนี้ ดอกตูมอาจร่วง'],
        recurrence: 'สัปดาห์ละครั้ง',
      });
    }
    if (d === 7 || d === 14 || d === 30 || (d > 30 && d % 30 === 0)) {
      mk('photo', 'PHOTO', {
        title: `ถ่ายรูป${n} (วันที่ ${d})`, description: 'ถ่ายมุมเดิมทุกครั้ง จะเห็นการเติบโตชัดเจน',
        steps: ['ถ่ายจากมุมเดิมกับครั้งก่อน', 'ถ่ายให้เห็นทั้งต้น', 'อัปโหลดรูปด้านล่าง'],
      });
    }
    return out;
  },

  /** งานครั้งเดียวของต้นนี้ (ไม่ขึ้นกับวันที่ดู) */
  oneTime(plant, sp) {
    const n = this.plantName(plant, sp);
    const created = U.isoToKey(plant.createdAt);
    const out = [];
    if (!plant.plantedDate) {
      const due = plant.plannedDate || created;
      const orchid = sp && sp.medium === 'orchid';
      out.push(this.make(plant, sp, 'plant', 'PLANTING', due, {
        title: `ปลูก${n}`, description: 'ทำทีละขั้น ติ๊กให้ครบแล้วกดเสร็จ',
        steps: sp && sp.plantingSteps ? sp.plantingSteps : orchid
          ? ['เตรียมกระถางหรือกระเช้าสำหรับกล้วยไม้', 'ใส่กาบมะพร้าวหรือถ่าน', 'วางต้นให้โคนไม่จมวัสดุปลูก', 'ใช้ลวดหรือไม้หลักยึดต้นให้แน่น', 'รดน้ำให้ชุ่ม']
          : ['เตรียมหลุมหรือกระถาง (กระถางต้องมีรูระบายน้ำ)', 'ใส่ดินผสมหรือวัสดุปลูก', 'ค่อย ๆ ถอดต้นออกจากถุง ระวังรากแตก', 'วางต้นให้โคนอยู่ระดับเดียวกับผิวดิน', 'กลบดินและกดเบา ๆ รอบโคน', 'รดน้ำครั้งแรกให้ชุ่ม'],
        checklist: true,
      }));
      return out;
    }
    const pd = plant.plantedDate;
    const at = (day) => U.addDays(pd, day);
    const keep = (due) => due >= created;
    out.push(this.make(plant, sp, 'photo0', 'PHOTO', pd < created ? created : pd, {
      title: `ถ่ายรูป${n}วันแรก`, description: 'รูปแรกจะใช้เทียบการเติบโตภายหลัง',
      steps: ['ถ่ายให้เห็นทั้งต้น', 'จำมุมที่ถ่ายไว้ ครั้งหน้าถ่ายมุมเดิม', 'อัปโหลดรูปด้านล่าง'],
    }));
    if (keep(at(10))) out.push(this.make(plant, sp, 'drain', 'GENERAL', at(10), {
      title: `ตรวจการระบายน้ำ (${n})`, description: 'น้ำขังเป็นสาเหตุอันดับต้น ๆ ที่ทำให้ต้นไม้ตาย',
      steps: ['หลังรดน้ำ สังเกตว่าน้ำไหลออกก้นกระถางภายในไม่กี่นาที', 'ถ้าปลูกลงดิน ดูว่ามีน้ำขังรอบโคนนานไหม', 'ถ้าขัง เทน้ำในจานรองทิ้ง หรือพูนดินโคนต้นให้สูงขึ้น'],
    }));
    if (keep(at(14))) out.push(this.make(plant, sp, 'growth14', 'GENERAL', at(14), {
      title: `ตรวจการเติบโต (${n})`, description: 'ครบ 2 สัปดาห์แล้ว ดูว่ามียอดหรือใบใหม่ไหม',
      steps: ['ดูว่ามีใบอ่อนหรือยอดใหม่', 'เทียบกับรูปวันแรก', 'ถ้าต้นดูไม่โต ลองใช้ "ช่วยฉัน"'],
    }));
    if (keep(at(28))) out.push(this.make(plant, sp, 'shape28', 'GENERAL', at(28), {
      title: `ตรวจทรงพุ่ม (${n})`, description: 'ดูว่าต้นแตกกิ่งสวย หรือยืดยาวเกินไป',
      steps: ['ดูว่ากิ่งแตกออกรอบต้นหรือยืดไปด้านเดียว', 'ถ้ายืดไปทางเดียว อาจได้แดดด้านเดียว ลองหมุนกระถาง', 'ถ้ายาวเกะกะ จดไว้ตัดแต่งรอบหน้า'],
    }));
    (sp && sp.pruneTasks || []).forEach((p, i) => {
      if (!p.every && keep(at(p.day))) out.push(this.make(plant, sp, 'pruneOnce' + i, 'PRUNING', at(p.day), {
        title: `${p.title} (${n})`, description: sp.pruningNotes,
        steps: ['ใช้มือหรือกรรไกรสะอาด', 'เด็ดปลายยอดออกประมาณ 1–2 ซม. เหนือข้อใบ', 'ต้นจะแตกกิ่งข้างภายใน 1–2 สัปดาห์'],
      }));
    });
    if (plant.flowering && plant.floweringSince) out.push(this.make(plant, sp, 'bloomPhoto', 'PHOTO', plant.floweringSince, {
      title: `ถ่ายรูปดอกแรกของ${n} 🌸`, description: 'เก็บความภูมิใจไว้ในไทม์ไลน์', steps: ['ถ่ายดอกใกล้ ๆ 1 รูป', 'ถ่ายทั้งต้นอีก 1 รูป'],
    }));
    return out;
  },
};

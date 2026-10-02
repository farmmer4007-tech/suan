/* ============================================================
 * services/diagnosis.js — PlantDiagnosisService (Rule-based MVP)
 * Interface: getSymptoms(), getQuestions(symptom), diagnose(input) → result
 * อนาคต: สร้าง AIDiagnosisService ที่ implement interface เดียวกัน แล้วสลับใน ServiceRegistry
 * หลักการ: ไม่ฟันธง ใช้คำว่า "อาจเกิดจาก" / "ควรตรวจสอบ" เสมอ
 * ============================================================ */
const DOCTOR_SYMPTOMS = [
  { key: 'yellow', emoji: '🍂', label: 'ใบเหลือง', kb: ['water-over', 'fert-what'] },
  { key: 'wilt', emoji: '🥀', label: 'ใบเหี่ยว', kb: ['water-when', 'water-under'] },
  { key: 'spots', emoji: '🟤', label: 'ใบมีจุด', kb: ['chem-safety'] },
  { key: 'pests', emoji: '🐛', label: 'มีแมลง', kb: ['pest-aphid', 'pest-worm', 'chem-safety'] },
  { key: 'nogrowth', emoji: '🌱', label: 'ไม่โต', kb: ['sun-check', 'soil-prep'] },
  { key: 'noflower', emoji: '🌸', label: 'ไม่ออกดอก', kb: ['flower-why-not', 'flower-prune'] },
  { key: 'soggy', emoji: '💧', label: 'ดินแฉะ', kb: ['water-over', 'pot-choose'] },
  { key: 'burn', emoji: '☀️', label: 'ใบไหม้', kb: ['sun-check', 'fert-chem'] },
  { key: 'unknown', emoji: '❓', label: 'ไม่รู้ว่าเป็นอะไร', kb: ['water-when'] },
];

const DOCTOR_QUESTIONS = {
  soil: { text: 'ดินตอนนี้เป็นอย่างไร?', hint: 'ใช้นิ้วจิ้มดินลึกประมาณ 2–3 ซม.', options: [['dry', '🟤 แห้ง'], ['moist', '🟢 ชื้น'], ['wet', '🔵 แฉะ'], ['unsure', '🤔 ไม่แน่ใจ']] },
  sun: { text: 'ต้นได้รับแดดประมาณกี่ชั่วโมง?', options: [['lt3', 'น้อยกว่า 3 ชม.'], ['3to5', '3–5 ชม.'], ['5to7', '5–7 ชม.'], ['gt7', 'มากกว่า 7 ชม.'], ['unsure', 'ไม่แน่ใจ']] },
  water3d: { text: 'ช่วง 3 วันที่ผ่านมา รดน้ำกี่ครั้ง?', hint: 'รวมวันที่ฝนตกด้วย', options: [['0', 'ไม่ได้รดเลย'], ['1-2', '1–2 ครั้ง'], ['3+', '3 ครั้งขึ้นไป'], ['unsure', 'จำไม่ได้']] },
  onset: { text: 'เริ่มมีอาการตั้งแต่เมื่อไร?', options: [['new', 'วันนี้–เมื่อวาน'], ['days', '2–7 วัน'], ['weeks', 'มากกว่า 1 สัปดาห์']] },
  where: { text: 'ใบเหลืองตรงไหน?', options: [['lower', 'ใบล่าง ๆ (ใบแก่)'], ['top', 'ยอดอ่อน/ใบบน'], ['all', 'ทั้งต้น']] },
  pestsSeen: { text: 'พลิกดูใต้ใบ เห็นแมลงตัวเล็ก ๆ หรือปุยขาวไหม?', options: [['yes', 'เห็น'], ['no', 'ไม่เห็น'], ['unsure', 'ไม่แน่ใจ']] },
  wiltTime: { text: 'ใบเหี่ยวแบบไหน?', options: [['afternoon', 'เหี่ยวตอนบ่าย แล้วฟื้นตอนเย็น'], ['always', 'เหี่ยวตลอด ไม่ฟื้น']] },
  spotType: { text: 'จุดบนใบมีลักษณะแบบไหน?', options: [['white', 'ผงขาว ๆ คล้ายแป้ง'], ['brown', 'จุดน้ำตาล มีขอบเหลือง'], ['black', 'คราบดำ ๆ เช็ดออกได้'], ['speckle', 'จุดเล็ก ๆ ซีดเหลืองทั่วใบ']] },
  pestType: { text: 'แมลงที่เห็นเป็นแบบไหน?', options: [['aphid', 'ตัวเล็ก ๆ เกาะกลุ่มตามยอด'], ['mealy', 'ปุยขาว ๆ คล้ายสำลี'], ['worm', 'ตัวหนอน'], ['holes', 'ไม่เห็นตัว แต่ใบแหว่งเป็นรู'], ['mite', 'จุดเล็กมาก มีใยบาง ๆ ใต้ใบ']] },
  fert: { text: 'ที่ผ่านมาใส่ปุ๋ยอย่างไร?', options: [['never', 'ยังไม่เคยใส่'], ['label', 'ใส่ตามฉลาก'], ['often', 'ใส่บ่อย/ใส่เยอะ'], ['unsure', 'ไม่แน่ใจ']] },
  pruned: { text: 'ช่วงเดือนที่ผ่านมา ตัดแต่งกิ่งไปเยอะไหม?', options: [['yes', 'ตัดไปเยอะ'], ['no', 'ไม่ได้ตัด/ตัดนิดหน่อย']] },
  drainage: { text: 'ปลูกแบบไหน?', options: [['pot-holes', 'กระถางมีรูระบายน้ำ'], ['pot-noholes', 'กระถางไม่มีรู/ไม่แน่ใจ'], ['ground', 'ปลูกลงดิน']] },
  movedSun: { text: 'เพิ่งย้ายต้นไปที่แดดแรงขึ้น หรือเพิ่งซื้อมาจากร้านไหม?', options: [['yes', 'ใช่'], ['no', 'ไม่ใช่']] },
};

const SYMPTOM_FLOW = {
  yellow: ['where', 'soil', 'water3d', 'sun', 'pestsSeen', 'onset'],
  wilt: ['wiltTime', 'soil', 'water3d', 'sun', 'onset'],
  spots: ['spotType', 'soil', 'water3d', 'onset'],
  pests: ['pestType', 'onset'],
  nogrowth: ['sun', 'soil', 'water3d', 'fert'],
  noflower: ['sun', 'fert', 'pruned', 'water3d'],
  soggy: ['drainage', 'water3d', 'onset'],
  burn: ['movedSun', 'sun', 'soil', 'fert'],
  unknown: ['soil', 'sun', 'water3d', 'pestsSeen', 'onset'],
};

const RuleBasedDiagnosisService = {
  getSymptoms() { return DOCTOR_SYMPTOMS; },
  getQuestions(symptom) { return (SYMPTOM_FLOW[symptom] || []).map(id => ({ id, ...DOCTOR_QUESTIONS[id] })); },

  /**
   * @param {{symptom:string, answers:Object, species?:Object, plantAgeDays?:number|null}} input
   * @returns {{causes:{title:string,why:string}[], checks:string[], actions:string[], safety:boolean, followUp:string}}
   */
  diagnose({ symptom, answers: a, species, plantAgeDays }) {
    const causes = [], checks = [], actions = [];
    const add = (arr, ...items) => items.forEach(i => { if (!arr.includes(i)) arr.push(i); });
    const cause = (title, why) => causes.push({ title, why });
    let safety = false;
    const young = plantAgeDays != null && plantAgeDays <= 14;
    const shadeLover = species && species.sunlight.minHours <= 3;
    const sunLow = a.sun === 'lt3' || (a.sun === '3to5' && species && species.sunlight.minHours >= 6);

    const waterTooMuch = () => {
      cause('อาจเกิดจากน้ำมากเกินไป หรือดินระบายน้ำไม่ดี', 'ดินยังชื้นหรือแฉะ และรดน้ำค่อนข้างบ่อย รากที่แช่น้ำนานจะหายใจไม่ได้');
      add(checks, 'ดูก้นกระถางว่ามีน้ำขัง หรือรูระบายน้ำตันไหม', 'ดมดินว่ามีกลิ่นเหม็นอับไหม', 'ดูโคนต้นว่านิ่มหรือดำไหม');
      add(actions, 'งดรดน้ำจนดินลึก 2–3 ซม. แห้ง แล้วค่อยรด', 'เทน้ำในจานรองกระถางออก', 'ถ้าปลูกลงดินแล้วน้ำขัง ลองพูนดินโคนต้นให้สูงขึ้น หรือทำร่องให้น้ำไหลออก');
    };
    const waterTooLittle = () => {
      cause('อาจเกิดจากน้ำไม่พอ', 'ดินแห้งและไม่ค่อยได้รดน้ำ ต้นจึงดึงน้ำไปใช้ไม่ทัน');
      add(checks, 'ดูว่าดินแห้งแข็ง หรือหดตัวออกจากขอบกระถางไหม');
      add(actions, 'รดน้ำช้า ๆ จนน้ำไหลออกก้นกระถาง', 'ตรวจดินทุกเช้า และรดเมื่อดินลึก 2–3 ซม. แห้ง', 'ถ้าเป็นช่วงร้อนจัด ลองย้ายกระถางให้ได้ร่มช่วงบ่าย');
    };
    const pestsSuck = () => {
      safety = true;
      cause('อาจเกิดจากแมลงดูดน้ำเลี้ยง เช่น เพลี้ยหรือไรแดง', 'แมลงตัวเล็กดูดน้ำเลี้ยงจากใบ ทำให้ใบซีด เหลือง หรือหงิก');
      add(checks, 'พลิกดูใต้ใบและยอดอ่อน ใช้แว่นขยายถ้ามี', 'ดูว่ามีมดเดินขึ้นลงต้นไหม (มักมากับเพลี้ย)');
      add(actions, 'ฉีดน้ำแรง ๆ ล้างใต้ใบ หรือเช็ดด้วยผ้าชุบน้ำ', 'ตัดใบหรือยอดที่เป็นมากทิ้ง ใส่ถุงมัดปากก่อนทิ้ง', 'แยกต้นนี้ออกจากต้นอื่นชั่วคราว');
    };
    const lightLow = () => {
      cause('อาจเกิดจากแสงแดดไม่พอ', species ? `${species.nameTh} ${species.sunlight.label} (${species.sunlight.text})` : 'ไม้ดอกส่วนใหญ่ต้องการแดดหลายชั่วโมงต่อวัน');
      add(checks, 'สังเกตตำแหน่งปลูกตอน 9 โมง เที่ยง บ่าย 3 ว่าโดนแดดไหม');
      add(actions, 'ถ้าปลูกกระถาง ค่อย ๆ ย้ายไปที่แดดมากขึ้น (เพิ่มทีละน้อยใน 1 สัปดาห์ ป้องกันใบไหม้)');
    };

    switch (symptom) {
      case 'yellow': {
        if (a.soil === 'wet' || (a.soil === 'moist' && a.water3d === '3+')) waterTooMuch();
        if (a.soil === 'dry' && (a.water3d === '0' || a.water3d === 'unsure')) waterTooLittle();
        if (a.pestsSeen === 'yes') pestsSuck();
        if (a.where === 'lower' && a.soil !== 'wet') {
          cause('อาจเป็นใบแก่ที่หมดอายุตามธรรมชาติ หรือธาตุอาหารเริ่มไม่พอ', 'ถ้าเหลืองแค่ใบล่าง ๆ ไม่กี่ใบ มักเป็นเรื่องปกติ แต่ถ้าเหลืองขึ้นเรื่อย ๆ ต้นอาจขาดอาหาร');
          add(actions, 'เด็ดใบเหลืองออกได้', plantAgeDays != null && plantAgeDays > 30 ? 'ถ้ายังไม่เคยใส่ปุ๋ยเลย พิจารณาใส่ปุ๋ยตามอัตราบนฉลาก' : 'ถ้าต้นยังปลูกไม่ถึง 1 เดือน ยังไม่ต้องรีบใส่ปุ๋ย');
        }
        if (a.where === 'top') {
          cause('อาจเกี่ยวกับสภาพดินหรือธาตุอาหารรอง', 'ยอดอ่อนเหลืองซีดแต่เส้นใบยังเขียว พบบ่อยในพุดและเข็มที่ชอบดินเป็นกรดเล็กน้อย');
          add(checks, 'ดูว่าใบเหลืองแต่เส้นใบยังเขียวไหม');
          add(actions, 'ถ่ายรูปใบไปปรึกษาร้านต้นไม้ใกล้บ้าน เรื่องการปรับดินหรือปุ๋ยที่เหมาะ');
        }
        if (sunLow) lightLow();
        if (young) cause('อาจเป็นช่วงปรับตัวหลังย้ายปลูก', 'ต้นที่เพิ่งปลูกไม่ถึง 2 สัปดาห์ อาจมีใบเหลืองร่วงบ้างระหว่างรากกำลังเดิน');
        break;
      }
      case 'wilt': {
        if (a.wiltTime === 'afternoon' && a.soil !== 'dry') {
          cause('อาจเป็นการเหี่ยวชั่วคราวจากอากาศร้อน', 'ช่วงบ่ายต้นคายน้ำเร็วกว่าที่รากดูดทัน ถ้าฟื้นตอนเย็นถือว่าปกติ');
          add(actions, 'ไม่ต้องรดน้ำเพิ่มถ้าดินยังชื้น', 'ถ้าเหี่ยวทุกวัน ลองให้ร่มช่วงบ่าย');
        }
        if (a.soil === 'dry') waterTooLittle();
        if ((a.soil === 'wet' || a.soil === 'moist') && a.wiltTime === 'always') {
          waterTooMuch();
          cause('มีความเป็นไปได้ว่ารากเสียหาย (รากเน่า)', 'ต้นเหี่ยวทั้งที่ดินชื้น อาจเพราะรากไม่สามารถดูดน้ำได้');
          add(checks, 'ถ้าปลูกกระถาง ลองค่อย ๆ ดูรากด้านล่าง รากดีมักเป็นสีขาว/ครีม รากเสียมักดำและนิ่ม');
        }
        if (young) cause('อาจเป็นอาการช็อกหลังย้ายปลูก', 'รากยังเดินไม่เต็มที่ ต้นจะเหี่ยวง่ายใน 1–2 สัปดาห์แรก');
        if (young) add(actions, 'ให้ร่มรำไรช่วงบ่ายสัก 3–5 วัน', 'อย่าย้ายต้นหรือรบกวนรากซ้ำ');
        break;
      }
      case 'spots': {
        safety = true;
        if (a.spotType === 'white') {
          cause('อาจเป็นราแป้ง', 'ผงขาวบนใบ มักเกิดเมื่ออากาศชื้นและลมไม่ถ่ายเท');
          add(actions, 'ตัดใบที่เป็นมากทิ้ง', 'จัดให้ลมผ่านสะดวก อย่าวางกระถางชิดกันเกินไป', 'รดน้ำที่โคน ไม่รดโดนใบ และรดตอนเช้า');
        } else if (a.spotType === 'brown') {
          cause('อาจเป็นโรคใบจุด', 'จุดน้ำตาลมีขอบเหลือง พบบ่อยช่วงฝนชุกหรือใบเปียกนาน');
          add(actions, 'เด็ดใบที่เป็นจุดทิ้ง ไม่ทิ้งไว้ใต้ต้น', 'รดน้ำที่โคน หลีกเลี่ยงการรดโดนใบตอนเย็น');
        } else if (a.spotType === 'black') {
          pestsSuck();
          cause('อาจเป็นราดำ', 'คราบดำมักขึ้นตามน้ำหวานที่เพลี้ยขับออกมา แก้ที่ต้นเหตุคือแมลง');
          add(actions, 'เช็ดคราบดำออกด้วยผ้าชุบน้ำ');
        } else if (a.spotType === 'speckle') {
          pestsSuck();
        }
        if (a.soil === 'wet') waterTooMuch();
        add(checks, 'ดูว่าจุดลามไปใบอื่นเร็วไหม ถ่ายรูปเก็บไว้เทียบใน 2–3 วัน');
        break;
      }
      case 'pests': {
        safety = true;
        const t = a.pestType;
        if (t === 'aphid' || t === 'mealy' || t === 'mite') pestsSuck();
        if (t === 'mealy') cause('อาจเป็นเพลี้ยแป้ง', 'ปุยขาวคล้ายสำลีตามซอกใบและยอด');
        if (t === 'mite') cause('อาจเป็นไรแดง', 'พบบ่อยช่วงอากาศร้อนแห้ง ใบซีดเป็นจุดเล็ก ๆ มีใยบาง');
        if (t === 'mite') add(actions, 'ฉีดน้ำใต้ใบช่วงเช้า ช่วยลดไรแดงได้');
        if (t === 'worm') {
          cause('อาจเป็นหนอนกินใบหรือหนอนเจาะดอก', 'หนอนมักซ่อนใต้ใบ มีมูลเม็ดเล็ก ๆ ให้เห็น');
          add(checks, 'พลิกใต้ใบตามรอยแหว่ง', 'ดูดอกตูมว่ามีรูไหม');
          add(actions, 'สวมถุงมือ เก็บหนอนออก', 'ตรวจซ้ำช่วงเช้าหรือเย็นทุกวันสัก 3 วัน');
        }
        if (t === 'holes') {
          cause('อาจเป็นแมลงกัดกินใบ หนอน หรือหอยทาก', 'ถ้าไม่เห็นตัวตอนกลางวัน อาจออกหากินตอนกลางคืน');
          add(checks, 'ส่องไฟฉายดูตอนกลางคืน');
          add(actions, 'เก็บออกด้วยมือ', 'เก็บใบไม้แห้งรอบโคนต้นที่เป็นที่หลบซ่อน');
        }
        break;
      }
      case 'nogrowth': {
        if (young) cause('อาจยังอยู่ในช่วงตั้งตัว', 'ช่วง 1–2 สัปดาห์แรก รากกำลังเดิน ส่วนบนอาจดูไม่โต เป็นเรื่องปกติ');
        if (sunLow) lightLow();
        if (a.soil === 'wet') waterTooMuch();
        if (a.soil === 'dry' && a.water3d === '0') waterTooLittle();
        if (a.fert === 'never' && plantAgeDays != null && plantAgeDays > 30) {
          cause('อาจขาดธาตุอาหาร', 'ปลูกมาเกิน 1 เดือนแล้วยังไม่เคยใส่ปุ๋ย ดินในกระถางมีอาหารจำกัด');
          add(actions, 'ใส่ปุ๋ยตามอัตราบนฉลากผลิตภัณฑ์ และจดบันทึกไว้');
        }
        add(checks, 'ถ้าปลูกกระถาง ดูว่ารากโผล่ออกก้นกระถางไหม (กระถางอาจเล็กเกินไป)');
        break;
      }
      case 'noflower': {
        const minDay = species ? species.floweringStartDay : null;
        if (minDay && plantAgeDays != null && plantAgeDays < minDay) {
          cause('อาจยังไม่ถึงช่วงออกดอก', `${species.nameTh} มักเริ่มออกดอกหลังปลูกประมาณ ${minDay} วันขึ้นไป แต่ขึ้นกับพันธุ์และอายุต้นตอนซื้อ ไม่ใช่วันที่แน่นอน`);
        }
        if (sunLow || a.sun === '3to5') lightLow();
        if (a.fert === 'often') {
          cause('อาจได้ปุ๋ยมากเกินไป โดยเฉพาะไนโตรเจน', 'ปุ๋ยที่ตัวเลขแรก (N) สูง ทำให้ใบเขียวเยอะแต่ดอกน้อย');
          add(actions, 'หยุดใส่ปุ๋ยสักพัก แล้วกลับมาใช้ตามอัตราบนฉลาก');
        }
        if (a.pruned === 'yes') cause('อาจตัดแต่งกิ่งไปพร้อมตาดอก', 'ต้นต้องใช้เวลาแตกกิ่งใหม่ก่อนจะออกดอกรุ่นต่อไป');
        if (a.water3d === '3+' && species && species.waterNeed === 'low') {
          cause('อาจได้น้ำมากเกินไปสำหรับต้นชนิดนี้', `${species.nameTh} ชอบดินค่อนข้างแห้ง ถ้าน้ำมากมักแตกแต่ใบ`);
          add(actions, 'รดน้ำเฉพาะเมื่อดินแห้งจริง ๆ');
        }
        add(checks, 'ดูปลายกิ่งว่ามีตาดอกเล็ก ๆ เริ่มขึ้นไหม');
        break;
      }
      case 'soggy': {
        waterTooMuch();
        if (a.drainage === 'pot-noholes') {
          cause('อาจเกิดจากกระถางไม่มีรูระบายน้ำ', 'น้ำไม่มีทางออก จะขังอยู่ก้นกระถาง');
          add(actions, 'ย้ายไปปลูกในกระถางที่มีรู หรือเจาะรูเพิ่มที่ก้นกระถาง');
        }
        if (a.drainage === 'ground') add(checks, 'ดูว่าตรงนั้นเป็นแอ่งที่น้ำฝนไหลมารวมไหม');
        break;
      }
      case 'burn': {
        if (a.movedSun === 'yes') {
          cause('อาจเป็นใบไหม้แดดจากการปรับตัวไม่ทัน', 'ต้นที่เคยอยู่ร่มแล้วโดนแดดแรงทันที ใบจะไหม้เป็นปื้นซีดหรือน้ำตาล');
          add(actions, 'ให้ร่มรำไรช่วงบ่าย แล้วค่อย ๆ เพิ่มแดดทีละน้อยใน 1–2 สัปดาห์');
        }
        if (shadeLover && (a.sun === '5to7' || a.sun === 'gt7')) {
          cause('อาจได้แดดแรงเกินไปสำหรับต้นชนิดนี้', `${species.nameTh} ${species.sunlight.label}`);
          add(actions, 'ย้ายไปที่แสงรำไร หรือใต้ชายคา/ซาแรน');
        }
        if (a.fert === 'often') {
          cause('มีความเป็นไปได้ว่าปุ๋ยมากเกินไป', 'ปุ๋ยเข้มข้นทำให้ขอบใบไหม้ได้');
          add(actions, 'หยุดใส่ปุ๋ย รดน้ำให้ชุ่มเพื่อช่วยชะปุ๋ยส่วนเกิน (ถ้าดินระบายน้ำดี)');
        }
        if (a.soil === 'dry') waterTooLittle();
        add(actions, 'ตัดเฉพาะส่วนที่ไหม้แห้งออกได้ ใบที่ไหม้แล้วจะไม่กลับมาเขียว');
        break;
      }
      default: {
        if (a.soil === 'wet') waterTooMuch();
        if (a.soil === 'dry') waterTooLittle();
        if (a.pestsSeen === 'yes') pestsSuck();
        if (a.sun === 'lt3') lightLow();
        add(checks, 'ดูใบทั้งด้านบนและใต้ใบ', 'ดูโคนต้นและผิวดิน', 'ถ่ายรูปไว้เทียบใน 2–3 วัน');
      }
    }

    // กฎเฉพาะชนิดพืชจาก Plant Database (doctorHints) — เสริมกฎทั่วไป ไม่ฟันธง
    (species && species.doctorHints || []).forEach(h => {
      if (!h.symptoms.includes(symptom)) return;
      const ok = Object.entries(h.when || {}).every(([q, vals]) => vals.includes(a[q]));
      if (!ok) return;
      causes.unshift({ title: h.title, why: h.why, speciesSpecific: true });
      add(checks, ...(h.checks || []));
      add(actions, ...(h.actions || []));
    });

    if (!causes.length) {
      cause('ยังระบุสาเหตุที่ชัดเจนไม่ได้จากข้อมูลตอนนี้', 'อาการอาจเกิดจากหลายปัจจัยร่วมกัน ลองสังเกตต่อและบันทึกภาพไว้');
      add(checks, 'ดูดินทุกเช้าก่อนรดน้ำ', 'ดูใต้ใบหาแมลง', 'ถ่ายรูปเทียบทุก 2–3 วัน');
    }
    if (a.soil === 'unsure') add(checks, 'ลองใช้นิ้วจิ้มดินลึก 2–3 ซม. เพื่อดูความชื้นจริง');
    add(actions, 'ถ่ายรูปบันทึกไว้ แล้วกลับมาดูอีกใน 3 วัน');
    return {
      causes, checks, actions, safety,
      followUp: 'ถ้าอาการไม่ดีขึ้นใน 1–2 สัปดาห์ หรือลามเร็ว ลองนำรูปไปปรึกษาร้านต้นไม้หรือผู้เชี่ยวชาญใกล้บ้าน',
    };
  },
};

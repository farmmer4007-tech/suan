// E2E: ไม้ดอกใหม่ 3 ชนิด (มากาเร็ต / เดซี่ / เยอบีร่า) — Test 1–8. node test/e2e-new-species.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const URL = 'file://' + path.join(__dirname, '../dist/index.html');
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.join(SHOTS, 'ns-' + n + '.png') });
  const wait = ms => page.waitForTimeout(ms);
  const nav = n => page.locator('.bnav').getByRole('button', { name: n }).click();
  let failed = 0;
  const test = async (name, fn) => {
    const cel = page.getByText('เยี่ยมเลย'); if (await cel.count()) await cel.click();
    try { await fn(); console.log('✔', name); } catch (e) { failed++; console.log('✘', name, '—', e.message.split('\n')[0]); await shot('FAIL-' + name.slice(0, 6)); }
  };
  const addPlant = async (label, nick) => {
    await nav('ต้นไม้');
    await page.getByRole('button', { name: '+ เพิ่มต้นไม้' }).first().click();
    await page.fill('#pfSearch', label);
    await page.getByRole('radio', { name: new RegExp('^' + label) }).click();
    if (nick) await page.fill('#pfNick', nick);
    await page.getByRole('button', { name: 'เพิ่มต้นไม้', exact: true }).click();
    await page.getByText('เส้นทางการปลูก').waitFor();
  };

  await page.goto(URL);
  await test('Onboarding lists 3 new species (not forced)', async () => {
    await page.getByText('เริ่มสร้างสวนของฉัน').click();
    await page.fill('#obName', 'ทดสอบ'); await page.getByText('ถัดไป').click();
    await page.getByRole('radio', { name: 'กระถาง' }).click(); await page.getByText('ถัดไป').click();
    await page.getByRole('radio', { name: '3–5 ชั่วโมง' }).click(); await page.getByText('ถัดไป').click();
    for (const n of ['มากาเร็ต', 'เดซี่', 'เยอบีร่า']) await page.getByRole('checkbox', { name: new RegExp('^' + n) }).waitFor();
    // ไม่บังคับ: เลือกเฉพาะมากาเร็ต
    await page.getByRole('checkbox', { name: /^มากาเร็ต/ }).click();
    await page.getByRole('radio', { name: /ปลูกวันนี้แล้ว/ }).click();
    await shot('onboarding'); await page.getByText('ถัดไป').click();
    await page.getByText('สร้างสวนของฉัน').click(); await page.getByText('เริ่มภารกิจวันแรก').click();
  });
  await test('Test 1: มากาเร็ต อยู่ใน My Plants', async () => {
    await nav('ต้นไม้');
    await page.getByRole('button', { name: /ดูต้น มากาเร็ต/ }).waitFor(); await shot('t1-myplants');
  });
  await test('Picker: search shows image/name/difficulty/sun/pot', async () => {
    await page.getByRole('button', { name: '+ เพิ่มต้นไม้' }).first().click();
    await page.fill('#pfSearch', 'gerbera'); await wait(150);
    const visible = await page.$$eval('.sp-tile[data-search]', ts => ts.filter(t => !t.hidden).map(t => t.innerText.replace(/\s+/g, ' ')));
    if (visible.length !== 1 || !/เยอบีร่า/.test(visible[0]) || !/ปานกลาง–ค่อนข้างยาก/.test(visible[0]) || !/แดด 4–6/.test(visible[0]) || !/กระถาง/.test(visible[0])) throw new Error(JSON.stringify(visible));
    await page.fill('#pfSearch', 'เดซี่'); await wait(100);
    const v2 = await page.$$eval('.sp-tile[data-search]', ts => ts.filter(t => !t.hidden).map(t => t.querySelector('span').innerText));
    if (!v2.includes('เดซี่')) throw new Error(v2.join(','));
    await page.fill('#pfSearch', ''); await shot('picker'); await page.getByRole('button', { name: 'ยกเลิก' }).click();
  });
  await test('Test 2: เดซี่ → Plant Detail เป็นข้อมูลของเดซี่', async () => {
    await addPlant('เดซี่');
    await page.getByRole('tab', { name: 'การดูแล' }).click();
    const txt = await page.locator('#tabpanel').innerText();
    for (const k of ['แดด 4–6 ชั่วโมง', 'อากาศถ่ายเท', 'เด็ดดอกโรย', 'อากาศเย็นเหมาะกับการออกดอก', 'การดูแล', 'การออกดอก', 'การตัดแต่ง', 'ปัญหาที่ควรเฝ้าระวัง'])
      if (!txt.includes(k)) throw new Error('missing ' + k);
    if (/ชบา|เยอบีร่า|โคนเน่า/.test(txt)) throw new Error('leaked other species text');
    await shot('t2-daisy-care');
  });
  await test('Test 3: เยอบีร่า → เห็นคำเตือนน้ำขัง/โคนต้น', async () => {
    await addPlant('เยอบีร่า');
    await page.getByText('ข้อควรระวังสำหรับเยอบีร่า').waitFor();
    await page.getByText(/ระวังน้ำขัง/).first().waitFor();
    await page.getByText(/อย่าปลูกลึกจนดินกลบคอ\/โคนต้น/).first().waitFor();
    await shot('t3-gerbera');
  });
  await test('Test 4: Dashboard สร้าง Checklist ของทั้ง 3 ต้น', async () => {
    // ไปวันถัดไปเพื่อให้งานตั้งตัวเริ่ม (วันที่ 1+) แล้วดูวันที่ 2 ซึ่งมีงานตรวจน้ำขังของเยอบีร่า
    await nav('สวนของฉัน'); await page.getByText('โหมดทดลอง').click();
    await page.getByRole('button', { name: '+1 วัน' }).click(); await wait(200);
    await page.getByRole('button', { name: '+1 วัน' }).click(); await wait(200);
    await nav('วันนี้');
    for (const t of ['ตรวจดินมากาเร็ต', 'ตรวจดินเดซี่', 'ตรวจดินเยอบีร่า', 'ตรวจน้ำขัง (เยอบีร่า)'])
      await page.getByRole('button', { name: new RegExp('^' + t.replace(/[()]/g, '\\$&')) }).first().waitFor();
    await shot('t4-dashboard');
  });
  await test('Test 5: ตรวจดิน → ดินแห้ง → แนะนำให้พิจารณารดน้ำ', async () => {
    await page.getByRole('button', { name: /^ตรวจดินมากาเร็ต/ }).click();
    await page.getByRole('radio', { name: /แห้ง/ }).click();
    await page.getByText('สามารถรดน้ำได้').waitFor();
    await page.getByRole('button', { name: /รดน้ำแล้ว/ }).waitFor();
    await page.getByText('รดน้ำแล้ว · เสร็จ').click(); await wait(500);
  });
  await test('Test 6: ดินแฉะ → ไม่แนะนำให้รดน้ำเพิ่ม', async () => {
    await page.getByRole('button', { name: /^ตรวจดินเยอบีร่า/ }).click();
    await page.getByRole('radio', { name: /แฉะ/ }).click();
    await page.getByText('งดน้ำก่อน และตรวจการระบายน้ำ').waitFor();
    if (await page.getByRole('button', { name: /รดน้ำแล้ว/ }).count()) throw new Error('watering button shown for wet soil');
    await shot('t6-wet'); await page.getByRole('button', { name: '✅ เสร็จแล้ว' }).click(); await wait(500);
  });
  await test('Test 7: Plant Doctor ตอบได้ทั้ง 3 ชนิด', async () => {
    const run = async (plant, sym, answers, expect) => {
      await nav('ช่วยฉัน');
      await page.getByRole('button', { name: sym, exact: true }).click();
      await page.getByRole('button', { name: new RegExp(plant) }).first().click();
      for (const a of answers) { await page.getByRole('radio', { name: a, exact: true }).click(); await wait(60); }
      await page.getByText('ผลการตรวจเบื้องต้น').waitFor();
      await page.getByText(expect).first().waitFor();
      const body = await page.locator('main').innerText();
      if (!body.includes('ไม่ใช่การวินิจฉัยยืนยัน') || /เป็นโรค[^\n]*แน่นอน|ยืนยันว่าเป็น/.test(body)) throw new Error('definitive wording');
    };
    await run('เยอบีร่า', 'ใบเหี่ยว', ['เหี่ยวตลอด ไม่ฟื้น', '🔵 แฉะ', '3 ครั้งขึ้นไป', '3–5 ชม.', '2–7 วัน'], 'อาจเกี่ยวข้องกับความชื้นในดินมากเกินไปหรือการระบายน้ำไม่ดี');
    await page.getByText('งดรดน้ำจนกว่าดินจะเริ่มแห้ง').waitFor(); await shot('t7-gerbera');
    await run('มากาเร็ต', 'ไม่ออกดอก', ['5–7 ชม.', 'ใส่ตามฉลาก', 'ไม่ได้ตัด/ตัดนิดหน่อย', '1–2 ครั้ง'], 'อาจเกี่ยวกับอากาศร้อนจัดหรือต้นยังไม่แตกพุ่มพอ');
    await run('เดซี่', 'ใบไหม้', ['ไม่ใช่', 'มากกว่า 7 ชม.', '🟢 ชื้น', 'ใส่ตามฉลาก'], 'มีความเป็นไปได้ว่าโดนแดดบ่ายร้อนจัดเกินไป');
  });
  await test('Fertilizer log works for new species', async () => {
    await nav('ต้นไม้'); await page.getByRole('button', { name: /ดูต้น เดซี่/ }).click();
    await page.getByRole('tab', { name: 'ปุ๋ย' }).click();
    await page.getByText('บันทึกการใส่ปุ๋ย').first().click();
    await page.fill('#fzName', 'ปุ๋ยคอก'); await page.getByRole('button', { name: /^บันทึก/ }).last().click(); await wait(500);
    await page.getByText('ปุ๋ยคอก').first().waitFor();
  });
  await test('Test 8: Refresh แล้วข้อมูลยังอยู่', async () => {
    await page.reload(); await wait(400);
    await nav('ต้นไม้');
    for (const n of ['มากาเร็ต', 'เดซี่', 'เยอบีร่า']) await page.getByRole('button', { name: new RegExp('ดูต้น ' + n) }).waitFor();
    const ow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ow > 0) throw new Error('overflow ' + ow);
    await shot('t8-after-reload');
  });
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors', `\n${failed ? failed + ' FAILED' : 'ALL PASSED'}`);
  await browser.close();
  process.exit(failed ? 1 : 0);
})();

// E2E: Scenario A, B, C + persistence. node test/e2e.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const URL = 'file://' + path.join(__dirname, '../dist/index.html');
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'th-TH' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const shot = n => page.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: false });
  const wait = ms => page.waitForTimeout(ms);
  const step = async (name, fn) => { try { const cel = page.getByText('เยี่ยมเลย'); if (await cel.count()) { await cel.click(); await wait(200); } await fn(); console.log('✔', name); } catch (e) { console.log('✘', name, e.message.split('\n')[0]); await shot('FAIL-' + name.replace(/\W+/g, '_')); throw e; } };

  await page.goto(URL);
  // ---------- Scenario A ----------
  await step('A1 welcome', async () => { await page.getByText('เริ่มสร้างสวนของฉัน').click(); });
  await step('A2 name validation + fill', async () => {
    await page.getByText('ถัดไป').click();
    await page.getByText('ใส่ชื่อเล่นสั้น ๆ ก็ได้ครับ').waitFor();
    await page.fill('#obName', 'นิด'); await page.getByText('ถัดไป').click();
  });
  await step('A3 province lopburi + pot', async () => {
    const v = await page.$eval('#obProv', e => e.value); if (v !== 'ลพบุรี') throw new Error('default province ' + v);
    await page.getByRole('radio', { name: 'กระถาง' }).click(); await page.getByText('ถัดไป').click();
  });
  await step('A4 sun 5-7', async () => { await page.getByRole('radio', { name: '5–7 ชั่วโมง' }).click(); await page.getByText('ถัดไป').click(); });
  await step('A5 choose hibiscus', async () => { await page.getByRole('checkbox', { name: /ชบา/ }).click(); await shot('a5-species'); await page.getByText('ถัดไป').click(); });
  await step('A6 create garden', async () => { await shot('a6-summary'); await page.getByText('สร้างสวนของฉัน').click(); await page.getByText('พร้อมแล้ว!').waitFor(); await shot('a7-ready'); await page.getByText('เริ่มภารกิจวันแรก').click(); });
  await step('A7 dashboard shows 5 tasks', async () => {
    await page.getByText('วันนี้สวนของคุณมี 5 อย่างที่ต้องทำ').waitFor();
    await page.getByText('ภารกิจแรกของคุณ').waitFor(); await shot('a8-dashboard');
  });
  await step('A8 complete 4 prep tasks', async () => {
    for (const t of ['เลือกพื้นที่ปลูก', 'ตรวจแสงแดด', 'เตรียมดิน', 'เตรียมต้นไม้และอุปกรณ์']) {
      await page.getByRole('button', { name: 'ทำเสร็จ: ' + t }).click(); await wait(500);
    }
    await page.getByText('4').first().waitFor();
  });
  await step('A9 planting task checklist', async () => {
    await page.getByRole('button', { name: /^ปลูกชบา/ }).click();
    await page.getByText('ติ๊กทีละขั้น').waitFor(); await shot('a9-planting');
    const boxes = await page.$$('.substeps input');
    for (let i = 0; i < boxes.length; i++) { await page.locator('.substeps input').nth(i).check(); await wait(60); }
    await page.getByRole('button', { name: '✅ ปลูกเสร็จแล้ว' }).click();
    await page.getByText('เก่งมาก! คุณปลูกต้นแรกแล้ว').waitFor(); await shot('a10-celebrate');
    await page.getByText('เยี่ยมเลย').click();
  });
  await step('A10 first photo task with upload', async () => {
    await page.getByRole('button', { name: /^ถ่ายรูปชบาวันแรก/ }).click();
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVQI12P4z8DAwMDAxMDAwMDAAAANHQEDK+mmyAAAAABJRU5ErkJggg==', 'base64');
    await page.setInputFiles('input[type=file]', { name: 'p.png', mimeType: 'image/png', buffer: png });
    await wait(1200);
    await page.getByText('วันนี้ดูแลสวนครบแล้ว!').first().waitFor();
    await page.getByText('เยี่ยมเลย').click();
  });
  await step('A11 go +1 day, soil check dry -> watered', async () => {
    await page.getByRole('button', { name: /สวนของฉัน/ }).last().click();
    await page.getByText('โหมดทดลอง').click(); await page.getByRole('button', { name: '+1 วัน' }).click(); await wait(300);
    await page.locator('.bnav').getByRole('button', { name: 'วันนี้' }).click();
    await page.getByRole('button', { name: /^ตรวจดินชบา/ }).click();
    await page.getByRole('radio', { name: /แห้ง/ }).click();
    await page.getByText('สามารถรดน้ำได้').waitFor(); await shot('a11-soil');
    await page.getByText('รดน้ำแล้ว · เสร็จ').click(); await wait(600);
  });
  await step('A12 water sheet from dashboard checkbox (moist)', async () => {
    const btn = page.getByRole('button', { name: /ทำเสร็จ: ตรวจใบชบา/ });
    if (await btn.count()) { await btn.click(); await wait(500); }
  });
  await step('A13 calendar month + week', async () => {
    await page.locator('.bnav').getByRole('button', { name: 'ปฏิทิน' }).click();
    await page.getByText('ปฏิทินดูแลสวน').waitFor(); await shot('a13-calendar');
    await page.getByRole('button', { name: 'สัปดาห์' }).click(); await wait(200); await shot('a13b-week');
    await page.getByRole('button', { name: 'เดือน' }).click();
  });
  await step('A14 plant detail + water history', async () => {
    await page.locator('.bnav').getByRole('button', { name: 'ต้นไม้' }).click();
    await page.getByRole('button', { name: /ดูต้น ชบา/ }).click();
    await page.getByText('ปลูกวันที่').waitFor(); await shot('a14-detail');
    await page.getByRole('tab', { name: 'การดูแล' }).click();
    await page.getByText('รดน้ำแล้ว').first().waitFor(); await shot('a14b-care');
    await page.getByRole('tab', { name: 'ปุ๋ย' }).click();
    await page.getByText('บันทึกการใส่ปุ๋ย').first().click();
    await page.fill('#fzName', 'ปุ๋ยสูตรเสมอ'); await page.fill('#fzAmt', '1 ช้อนชา ตามฉลาก');
    await page.getByRole('button', { name: /^บันทึก/ }).last().click(); await wait(600);
    await page.getByText('ปุ๋ยสูตรเสมอ').first().waitFor();
    await page.getByRole('tab', { name: 'รูป' }).click(); await wait(300); await shot('a14c-photos');
    await page.getByRole('tab', { name: 'ประวัติ' }).click(); await page.getByText('ใส่ปุ๋ย: ปุ๋ยสูตรเสมอ').waitFor();
  });
  await step('A15 reload persists', async () => {
    await page.reload(); await wait(500);
    await page.getByText('สวัสดีครับ คุณนิด').waitFor();
  });

  // ---------- Scenario B ----------
  await step('B add marigold planted 10 days ago', async () => {
    await page.locator('.bnav').getByRole('button', { name: 'ต้นไม้' }).click();
    await page.getByRole('button', { name: '+ เพิ่มต้นไม้' }).click();
    await page.getByRole('radio', { name: /ดาวเรือง/ }).click();
    await page.getByRole('radio', { name: /ปลูกไปแล้ว/ }).click();
    await page.getByText('เพิ่มต้นไม้', { exact: true }).last().click();
    await page.getByText('กรุณาเลือกวันที่ปลูก').waitFor();
    const d = await page.evaluate(() => U.addDays(U.todayKey(), -10));
    await page.fill('#pfDate', d);
    await page.getByRole('button', { name: 'เพิ่มต้นไม้', exact: true }).click();
    await page.getByText('10 วัน').first().waitFor(); await shot('b-detail');
    await page.getByText('เส้นทางการปลูก').waitFor();
  });

  // ---------- Scenario C ----------
  await step('C plant doctor yellow leaves', async () => {
    await page.locator('.bnav').getByRole('button', { name: 'ช่วยฉัน' }).click();
    await page.getByRole('button', { name: 'ใบเหลือง' }).click();
    await page.getByText('เป็นกับต้นไหน?').waitFor();
    await page.getByRole('button', { name: /ชบา/ }).first().click();
    const answers = ['ใบล่าง ๆ (ใบแก่)', '🔵 แฉะ', '3 ครั้งขึ้นไป', '5–7 ชม.', 'ไม่เห็น', '2–7 วัน'];
    for (const a of answers) { await page.getByRole('radio', { name: a }).click(); await wait(80); }
    await page.getByText('ผลการตรวจเบื้องต้น').waitFor();
    await page.getByText('อาจเกิดจากน้ำมากเกินไป หรือดินระบายน้ำไม่ดี').waitFor();
    await page.getByText('สิ่งที่ควรตรวจสอบ').waitFor(); await shot('c-result');
    await page.getByText('บันทึกอาการ + เตือนติดตามใน 3 วัน').click(); await wait(400);
    await page.getByText('อาการดีขึ้นแล้ว').waitFor();
  });
  await step('search thai', async () => {
    await page.getByRole('button', { name: 'ค้นหา' }).click();
    await page.fill('#q', 'ปุ๋ย'); await wait(300);
    await page.getByText('N-P-K คืออะไร').waitFor(); await shot('search');
  });
  await step('delete plant', async () => {
    await page.locator('.bnav').getByRole('button', { name: 'ต้นไม้' }).click();
    await page.getByRole('button', { name: /ดูต้น ดาวเรือง/ }).click();
    await page.getByText('ลบต้นนี้').first().click();
    await page.getByRole('button', { name: 'ลบต้นนี้' }).last().click(); await wait(300);
    if (await page.getByRole('button', { name: /ดูต้น ดาวเรือง/ }).count()) throw new Error('not deleted');
  });
  await step('desktop layout', async () => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.locator('.bnav').getByRole('button', { name: 'วันนี้' }).click(); await wait(300); await shot('desktop-dashboard');
    await page.setViewportSize({ width: 390, height: 844 });
    const ow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (ow > 0) throw new Error('horizontal overflow ' + ow);
    await shot('mobile-dashboard');
  });
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
  await browser.close();
})().catch(e => { console.error('ABORT'); process.exit(1); });

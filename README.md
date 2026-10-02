# 🌸 สวนของฉัน

> ไม่เคยปลูกก็เริ่มได้ วันนี้สวนของเราต้องทำอะไร?

เว็บแอปสำหรับมือใหม่ที่ไม่เคยปลูกต้นไม้มาก่อน เปิดแอปแล้วรู้ทันทีว่าวันนี้ต้องดูแลต้นไม้อย่างไร ออกแบบสำหรับอากาศร้อนภาคกลาง (เช่น ลพบุรี) และรองรับทุกจังหวัด

## ฟีเจอร์ (MVP)
- Onboarding 5 ขั้น → สร้างสวน + ภารกิจแรกอัตโนมัติ
- Dashboard "วันนี้ต้องทำอะไร" + Checklist Engine (งานตามอายุพืช/ชนิด/รูปแบบปลูก)
- ตรวจดินก่อนรดน้ำ (แห้ง/ชื้น/แฉะ) + Water Log + เตือนรดน้ำถี่
- บันทึกปุ๋ย (ยึดอัตราตามฉลาก) + รายการปุ๋ยของฉัน
- ปฏิทิน วัน/สัปดาห์/เดือน, Photo Log + เทียบก่อน/หลัง
- Plant Doctor แบบ rule-based (ไม่ฟันธง), ฐานความรู้, ค้นหาภาษาไทย
- เก็บข้อมูลในเครื่อง (localStorage + IndexedDB สำหรับรูป)

## เปิดใช้งาน
เปิด `docs/index.html` ในเบราว์เซอร์ได้เลย หรือเปิด GitHub Pages (Settings → Pages → Branch `main`, folder `/docs`)

## โครงสร้างโค้ด
```
src/
  core/          utils (วันที่ไทย, escape)
  data/          จังหวัด, ฐานข้อมูลพืช, ฐานความรู้
  data-access/   Repository + Storage adapters + PhotoStore
  services/      Weather / Notification / Diagnosis / Assistant (abstraction)
  logic/         TaskEngine, GardenService (business logic)
  ui/            components, app (router), views/
build.js         รวมเป็นไฟล์เดียว → dist/ (และคัดลอกไป docs/)
test/e2e.js      Playwright: Scenario A/B/C
```

## พัฒนา
```bash
node build.js && cp dist/index.html docs/index.html
npm i -D playwright && node test/e2e.js
```

> คำแนะนำในแอปเป็นแนวทางทั่วไป ไม่รับประกันผล

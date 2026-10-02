// build.js — รวมไฟล์ใน src/ เป็นไฟล์เดียว (ไม่ต้องใช้ bundler)
// node build.js → dist/index.html (เว็บเต็ม + PWA manifest) และ dist/artifact.html (สำหรับเผยแพร่เป็น Artifact)
const fs = require('fs');
const path = require('path');
const src = p => fs.readFileSync(path.join(__dirname, 'src', p), 'utf8');

const JS_ORDER = [
  'core/utils.js',
  'data/provinces.js', 'data/species.js', 'data/knowledge.js',
  'services/diagnosis.js', 'services/services.js',
  'data-access/storage.js',
  'logic/taskEngine.js', 'logic/gardenService.js',
  'ui/components.js', 'ui/app.js',
  'ui/views/onboarding.js', 'ui/views/today.js', 'ui/views/plants.js', 'ui/views/care.js',
  'ui/views/calendar.js', 'ui/views/help.js', 'ui/views/profile.js',
];
const js = `"use strict";\n${JS_ORDER.map(f => `/* ==== ${f} ==== */\n${src(f)}`).join('\n')}\nboot();\n`;
const css = src('styles.css');
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&family=Mitr:wght@400;500&display=swap">';
const body = `<div id="app"></div><div id="overlay-root"></div><div id="toast-root" class="toasts" aria-live="polite"></div>\n<script>\n${js}</script>`;

const manifest = { name: 'สวนของฉัน', short_name: 'สวนของฉัน', start_url: '.', display: 'standalone', background_color: '#FFFAF4', theme_color: '#F28BAA', lang: 'th' };
const full = `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>สวนของฉัน</title><meta name="description" content="ไม่เคยปลูกก็เริ่มได้ วันนี้สวนของเราต้องทำอะไร?">
<meta name="theme-color" content="#FFFAF4"><meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}">
${fonts}<style>[hidden]{display:none!important} body{margin:0} img{max-width:100%}\n${css}</style></head><body>
${body}
</body></html>`;
const artifact = `<title>สวนของฉัน</title>\n${fonts}\n<style>\n${css}</style>\n${body}\n`;

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), full);
fs.writeFileSync(path.join(__dirname, 'dist/artifact.html'), artifact);
fs.writeFileSync(path.join(__dirname, 'dist/app.js'), js);
console.log('built', (full.length / 1024).toFixed(1) + 'KB');

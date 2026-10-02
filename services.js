/* ============================================================
 * services/services.js — Weather / Notification / Assistant abstractions
 * MVP ใช้ Mock / In-app; เปลี่ยนเป็นของจริงได้ที่ ServiceRegistry โดยไม่แตะ UI
 * ============================================================ */

/** WeatherService interface: getCurrentWeather(location), getForecast(location) */
class MockWeatherService {
  constructor() { this.name = 'mock'; }
  /** คืน available:false เพราะยังไม่มีข้อมูลจริง — UI จะไม่สร้างคำแนะนำจากอากาศ */
  async getCurrentWeather(location) { return { available: false, location }; }
  async getForecast(location) { return { available: false, location, days: [] }; }
}
// ตัวอย่างสำหรับอนาคต:
// class OpenMeteoWeatherService { async getCurrentWeather(loc){ /* fetch → {available:true,tempC,rainMm,humidity} */ } }

/** Notification channels — InApp (MVP). อนาคต: BrowserPushChannel, PWAChannel */
class InAppNotificationChannel {
  constructor(repo) { this.repo = repo; }
  async send(n) {
    const exists = this.repo.db.notifications.some(x => x.dedupeKey && x.dedupeKey === n.dedupeKey);
    if (exists) return false;
    this.repo.db.notifications.unshift({ id: U.uid('ntf'), read: false, createdAt: U.nowISO(), ...n });
    this.repo.db.notifications = this.repo.db.notifications.slice(0, 60);
    return true;
  }
}

class NotificationService {
  constructor(channels) { this.channels = channels; }
  async notify(n) { let sent = false; for (const c of this.channels) sent = (await c.send(n)) || sent; return sent; }
}

/** GardeningAssistantService — Phase 2 (AI). MVP คืนค่า unavailable */
const GardeningAssistantService = {
  available: false,
  async ask(question, context) { return { available: false, answer: null }; },
};

const ServiceRegistry = {
  weather: new MockWeatherService(),
  diagnosis: RuleBasedDiagnosisService,
  assistant: GardeningAssistantService,
  notifications: null, // set at boot (needs repo)
};

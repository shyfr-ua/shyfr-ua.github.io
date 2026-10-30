// Публічні ідентифікатори рекламних пікселів (не токени і не секретні ключі).
// Meta Events Manager > Data Sources / Datasets > Settings > Dataset ID (Pixel ID).
// Вставте числовий Meta Pixel ID після створення. До цього скрипт Meta не завантажується.
// OpenAI Pixel залишено вимкненим до окремого налаштування.
window.SHYFR_ADS_CONFIG = Object.freeze({
  metaPixelId: "2025745325465805",
  // Fill with public Cloudflare Worker URL after bridge is deployed.
  metaBridgeUrl: "https://shyfr-meta-bridge.dvbilan.workers.dev",
  pixelId: ""
});

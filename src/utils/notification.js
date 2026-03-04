/**
 * Notification utility for daily finance reminder.
 *
 * Uses the Notification API + setInterval scheduling from main thread.
 * Tracks last-sent date in localStorage to avoid duplicate notifications.
 */

const NOTIFICATION_HOUR = 20; // Jam 20:00 (8 PM)
const CHECK_INTERVAL_MS = 60 * 1000; // Check setiap 1 menit
const LAST_NOTIF_KEY = 'kelolaku-last-notif-date';

let schedulerIntervalId = null;

/**
 * Check apakah browser mendukung Notification API.
 */
export function isNotificationSupported() {
    return 'Notification' in window;
}

/**
 * Request permission dari user untuk menampilkan notifikasi.
 * @returns {Promise<string>} 'granted' | 'denied' | 'default'
 */
export async function requestNotificationPermission() {
    if (!isNotificationSupported()) {
        return 'denied';
    }
    const result = await Notification.requestPermission();
    return result;
}

/**
 * Cek status permission notifikasi saat ini.
 * @returns {string} 'granted' | 'denied' | 'default' | 'unsupported'
 */
export function getNotificationPermission() {
    if (!isNotificationSupported()) {
        return 'unsupported';
    }
    return Notification.permission;
}

/**
 * Tampilkan notifikasi via Service Worker registration (agar muncul meski tab tertutup).
 * Fallback ke Notification constructor jika SW tidak tersedia.
 */
async function showNotification(title, options) {
    try {
        const registration = await navigator.serviceWorker?.ready;
        if (registration) {
            await registration.showNotification(title, options);
            return;
        }
    } catch {
        // Fallback ke constructor
    }
    new Notification(title, options);
}

/**
 * Cek apakah sudah waktunya kirim notifikasi dan belum terkirim hari ini.
 * Waktu selalu mengacu ke WIB (Asia/Jakarta, UTC+7).
 */
function checkAndSendNotification() {
    // Gunakan timezone Asia/Jakarta (WIB) agar konsisten di semua device
    const wibDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    const wibDate = new Date(wibDateStr);
    const currentHour = wibDate.getHours();

    if (currentHour !== NOTIFICATION_HOUR) {
        return;
    }

    // Cek apakah sudah kirim hari ini (berdasarkan tanggal WIB)
    const todayKey = `${wibDate.getFullYear()}-${wibDate.getMonth()}-${wibDate.getDate()}`;
    const lastSent = localStorage.getItem(LAST_NOTIF_KEY);

    if (lastSent === todayKey) {
        return;
    }

    // Kirim notifikasi
    showNotification('Kelola Keuangan 💰', {
        body: 'Sudah catat keuangan hari ini? Yuk, catat pemasukan dan pengeluaran kamu sekarang!',
        icon: '/logo-192.webp',
        badge: '/logo-192.webp',
        tag: 'nightly-reminder',
        renotify: false,
    });

    // Tandai sudah kirim hari ini
    localStorage.setItem(LAST_NOTIF_KEY, todayKey);
}

/**
 * Start atau stop scheduler notifikasi harian.
 * @param {boolean} enabled - Apakah notifikasi diaktifkan
 */
export function scheduleNightlyReminder(enabled) {
    // Selalu bersihkan interval lama dulu
    if (schedulerIntervalId !== null) {
        clearInterval(schedulerIntervalId);
        schedulerIntervalId = null;
    }

    if (!enabled) {
        return;
    }

    // Cek permission
    if (getNotificationPermission() !== 'granted') {
        return;
    }

    // Cek langsung saat start
    checkAndSendNotification();

    // Set interval check tiap 1 menit
    schedulerIntervalId = setInterval(checkAndSendNotification, CHECK_INTERVAL_MS);
}

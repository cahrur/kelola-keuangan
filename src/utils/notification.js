/**
 * Daily finance reminder, scheduled differently per target.
 *
 * Web/PWA: the Notification API driven by a setInterval on the main thread, so it
 * only fires while a tab is open — a limitation of the platform, not a bug.
 *
 * Android: @capacitor/local-notifications hands the schedule to AlarmManager, so
 * the reminder fires even when the app is closed and survives a reboot. Android
 * WebView has no Notification API at all, which is why the web path cannot simply
 * be reused inside the app.
 */

import { isNative } from './platform';

const NOTIFICATION_HOUR = 20; // Jam 20:00 (8 PM)
const CHECK_INTERVAL_MS = 60 * 1000; // Check setiap 1 menit
const LAST_NOTIF_KEY = 'kelolaku-last-notif-date';

// Stable id so re-scheduling replaces the alarm instead of stacking duplicates.
const REMINDER_ID = 1;

const REMINDER_TITLE = 'Kelola Keuangan 💰';
const REMINDER_BODY = 'Sudah catat keuangan hari ini? Yuk, catat pemasukan dan pengeluaran kamu sekarang!';

let schedulerIntervalId = null;

// Permission reads are async on native but the settings UI reads them
// synchronously, so the last known value is cached here and refreshed through
// refreshNotificationPermission().
let nativePermission = 'default';

let localNotificationsModule = null;

// Returns the module, never the plugin object itself: a Capacitor plugin is a
// Proxy that turns any property access into a method call, so resolving a
// promise with one makes JavaScript probe `.then` and the plugin answers with
// "LocalNotifications.then() is not implemented".
function loadLocalNotifications() {
    if (!localNotificationsModule) {
        localNotificationsModule = import('@capacitor/local-notifications');
    }
    return localNotificationsModule;
}

// The plugin reports 'prompt' / 'prompt-with-rationale' where the web API says 'default'.
function toWebPermission(state) {
    if (state === 'granted' || state === 'denied') {
        return state;
    }
    return 'default';
}

/**
 * Check apakah platform mendukung notifikasi.
 */
export function isNotificationSupported() {
    return isNative || 'Notification' in window;
}

/**
 * Cek status permission notifikasi saat ini (sinkron).
 *
 * Di native nilainya berasal dari cache — panggil refreshNotificationPermission()
 * lebih dulu kalau butuh nilai terbaru.
 * @returns {string} 'granted' | 'denied' | 'default' | 'unsupported'
 */
export function getNotificationPermission() {
    if (!isNotificationSupported()) {
        return 'unsupported';
    }
    return isNative ? nativePermission : Notification.permission;
}

/**
 * Baca ulang status permission dari sistem.
 * @returns {Promise<string>} 'granted' | 'denied' | 'default' | 'unsupported'
 */
export async function refreshNotificationPermission() {
    if (!isNotificationSupported()) {
        return 'unsupported';
    }

    if (!isNative) {
        return Notification.permission;
    }

    try {
        const { LocalNotifications } = await loadLocalNotifications();
        const { display } = await LocalNotifications.checkPermissions();
        nativePermission = toWebPermission(display);
    } catch {
        nativePermission = 'default';
    }
    return nativePermission;
}

/**
 * Request permission dari user untuk menampilkan notifikasi.
 * @returns {Promise<string>} 'granted' | 'denied' | 'default'
 */
export async function requestNotificationPermission() {
    if (!isNotificationSupported()) {
        return 'denied';
    }

    if (!isNative) {
        return Notification.requestPermission();
    }

    try {
        const { LocalNotifications } = await loadLocalNotifications();
        const { display } = await LocalNotifications.requestPermissions();
        nativePermission = toWebPermission(display);
    } catch {
        nativePermission = 'denied';
    }
    return nativePermission;
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
    showNotification(REMINDER_TITLE, {
        body: REMINDER_BODY,
        icon: '/logo-192.webp',
        badge: '/logo-192.webp',
        tag: 'nightly-reminder',
        renotify: false,
    });

    // Tandai sudah kirim hari ini
    localStorage.setItem(LAST_NOTIF_KEY, todayKey);
}

/**
 * Daftarkan (atau batalkan) alarm harian di Android.
 *
 * `isExactNotification: false` menjaga aplikasi tetap memakai alarm biasa. Alarm
 * eksak butuh izin SCHEDULE_EXACT_ALARM yang dibatasi Play Store untuk aplikasi
 * jam alarm dan kalender — dan pengingat harian tidak memerlukan presisi itu.
 */
async function scheduleNativeReminder(enabled) {
    const { LocalNotifications } = await loadLocalNotifications();

    // Selalu bersihkan jadwal lama supaya tidak menumpuk saat setelan diubah.
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });

    if (!enabled) {
        return;
    }

    if ((await refreshNotificationPermission()) !== 'granted') {
        return;
    }

    await LocalNotifications.schedule({
        notifications: [
            {
                id: REMINDER_ID,
                title: REMINDER_TITLE,
                body: REMINDER_BODY,
                schedule: {
                    // Berulang setiap hari pada jam perangkat.
                    on: { hour: NOTIFICATION_HOUR, minute: 0 },
                    allowWhileIdle: false,
                },
                isExactNotification: false,
            },
        ],
    });
}

/**
 * Start atau stop pengingat harian.
 *
 * Di Android jadwalnya hidup di dalam sistem operasi, jadi pemanggilan ini
 * bersifat menetap — tidak perlu (dan tidak boleh) dibatalkan saat komponen
 * unmount, karena justru itu yang membuatnya jalan saat aplikasi tertutup.
 * @param {boolean} enabled - Apakah notifikasi diaktifkan
 */
export function scheduleNightlyReminder(enabled) {
    if (isNative) {
        scheduleNativeReminder(enabled).catch(() => {
            // Penjadwalan gagal (izin dicabut, plugin tidak tersedia) — pengingat
            // tidak aktif, tapi tidak ada yang perlu dilaporkan ke pengguna di sini.
        });
        return;
    }

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

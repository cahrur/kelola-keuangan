/**
 * Menyimpan berkas hasil ekspor.
 *
 * Di browser cukup tautan blob. Di aplikasi Android cara itu tidak jalan —
 * WebView memblokir unduhan blob — jadi berkas ditulis langsung ke folder
 * Download lewat plugin FileSaver, memakai MediaStore. Hasilnya sama seperti
 * mengunduh dari browser: berkasnya langsung ada, tanpa lembar Bagikan.
 */

import { isNative } from './platform';

// Modul, bukan objek plugin: plugin Capacitor adalah Proxy yang menganggap
// setiap akses properti sebagai pemanggilan method, sehingga menyelesaikan
// promise dengannya membuat JavaScript memeriksa `.then` dan plugin melempar.
let corePlugin = null;

function loadFileSaver() {
    if (!corePlugin) {
        corePlugin = import('@capacitor/core').then(({ registerPlugin }) => ({
            FileSaver: registerPlugin('FileSaver'),
        }));
    }
    return corePlugin;
}

function toBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function saveOnWeb(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Dibebaskan setelah unduhan sempat dimulai.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { location: null, notified: false };
}

async function saveOnNative(blob, filename, mimeType) {
    const { FileSaver } = await loadFileSaver();

    const { notified } = await FileSaver.saveToDownloads({
        fileName: filename,
        data: await toBase64(blob),
        mimeType,
    });
    return { location: `Download/${filename}`, notified: Boolean(notified) };
}

/**
 * @returns {Promise<{location: string|null, notified: boolean}>} Lokasi berkas
 * untuk ditampilkan ke pengguna — null di web, karena browser sudah punya
 * indikator unduhannya sendiri — dan apakah notifikasi sistem sempat tayang.
 */
export async function saveFile(data, filename, mimeType) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    return isNative ? saveOnNative(blob, filename, mimeType) : saveOnWeb(blob, filename);
}

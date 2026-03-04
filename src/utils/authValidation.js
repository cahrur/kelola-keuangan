const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+62|62|0)8[0-9]{7,12}$/;

const SERVER_MESSAGE_MAP = {
    'Email sudah terdaftar': 'Email sudah terdaftar',
    'invalid email or password': 'Email atau password salah',
    'password minimal 8 karakter': 'Password minimal 8 karakter',
    'Invalid Google token': 'Token Google tidak valid. Silakan coba lagi.',
    'Token audience mismatch': 'Konfigurasi Google OAuth tidak cocok. Hubungi admin.',
    'Verifikasi keamanan wajib diselesaikan': 'Selesaikan verifikasi keamanan terlebih dahulu.',
    'Verifikasi keamanan kadaluarsa. Silakan ulangi': 'Verifikasi keamanan kadaluarsa. Silakan ulangi.',
    'Verifikasi keamanan gagal. Silakan coba lagi': 'Verifikasi keamanan gagal. Silakan coba lagi.',
    'Gagal menghubungi layanan verifikasi keamanan': 'Gagal memverifikasi keamanan. Coba lagi beberapa saat.',
};

export function normalizePhone(phone) {
    return (phone || '').replace(/[^\d+]/g, '');
}

export function validateLoginForm(values) {
    const errors = {};
    const email = (values.email || '').trim();
    const password = values.password || '';

    if (!email) {
        errors.email = 'Email wajib diisi';
    } else if (!EMAIL_REGEX.test(email)) {
        errors.email = 'Format email tidak valid';
    }

    if (!password) {
        errors.password = 'Password wajib diisi';
    }

    return errors;
}

export function validateRegisterForm(values) {
    const errors = {};
    const name = (values.name || '').trim();
    const email = (values.email || '').trim();
    const phone = normalizePhone(values.phone || '');
    const password = values.password || '';

    if (!name) {
        errors.name = 'Nama wajib diisi';
    } else if (name.length < 2) {
        errors.name = 'Nama minimal 2 karakter';
    } else if (name.length > 100) {
        errors.name = 'Nama maksimal 100 karakter';
    }

    if (!email) {
        errors.email = 'Email wajib diisi';
    } else if (!EMAIL_REGEX.test(email)) {
        errors.email = 'Format email tidak valid';
    }

    if (!phone) {
        errors.phone = 'Nomor WhatsApp wajib diisi';
    } else if (!PHONE_REGEX.test(phone)) {
        errors.phone = 'Nomor WhatsApp tidak valid';
    }

    const passwordErrors = validateRegistrationPassword(password);
    if (passwordErrors.length > 0) {
        errors.password = passwordErrors[0];
    }

    return errors;
}

export function validateGooglePhone(phone) {
    const cleaned = normalizePhone(phone || '');
    if (!cleaned) return 'Nomor WhatsApp wajib diisi';
    if (!PHONE_REGEX.test(cleaned)) return 'Nomor WhatsApp tidak valid';
    return '';
}

function validateRegistrationPassword(password) {
    if (!password) return ['Password wajib diisi'];
    if (password.length < 8) return ['Password minimal 8 karakter'];

    const missing = [];
    if (!/[A-Z]/.test(password)) missing.push('huruf besar');
    if (!/[a-z]/.test(password)) missing.push('huruf kecil');
    if (!/\d/.test(password)) missing.push('angka');

    if (missing.length > 0) {
        return [`Password harus mengandung ${missing.join(', ')}`];
    }

    return [];
}

export function getAuthErrorMessage(error, fallbackMessage) {
    const status = error?.response?.status;
    const rawMessage = (error?.response?.data?.message || '').trim();

    if (status === 429) {
        return 'Terlalu banyak percobaan. Silakan coba lagi beberapa menit lagi.';
    }

    if (status >= 500) {
        return 'Server sedang bermasalah. Silakan coba lagi nanti.';
    }

    if (rawMessage && SERVER_MESSAGE_MAP[rawMessage]) {
        return SERVER_MESSAGE_MAP[rawMessage];
    }

    if (rawMessage === 'Validation failed') {
        return 'Data yang kamu kirim belum valid.';
    }

    return fallbackMessage;
}

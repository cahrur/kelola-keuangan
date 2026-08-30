import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { isNative } from '../../utils/platform';
import './GoogleAuthButton.css';

const WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Loaded on demand so the native plugin never reaches the web bundle that
// Docker builds and Coolify serves. Credential Manager only needs initialising
// once per app run, so the promise is cached.
let nativeGoogle = null;

// Resolves with the module, never the plugin object: a Capacitor plugin is a
// Proxy that turns any property access into a method call, so resolving a
// promise with one makes JavaScript probe `.then` and the plugin throws.
function loadNativeGoogle() {
    if (!nativeGoogle) {
        nativeGoogle = import('@capgo/capacitor-social-login').then(async (module) => {
            await module.SocialLogin.initialize({ google: { webClientId: WEB_CLIENT_ID } });
            return module;
        });
    }
    return nativeGoogle;
}

// Dismissing the account sheet is a normal user action, not an error to report.
function isDismissal(error) {
    return /cancel|dismiss|closed/i.test(error?.message || '');
}

function GoogleMark() {
    return (
        <svg className="google-auth-btn__mark" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
        </svg>
    );
}

/**
 * Google sign-in for both build targets.
 *
 * The web build uses Google Identity Services. That refuses to render inside a
 * WebView ("disallowed_useragent"), so the Android build goes through Credential
 * Manager instead — a native account picker. Both mint an ID token for the same
 * web client, so the audience check in backend/internal/handler/google_auth.go
 * accepts either one and needs no changes.
 */
export default function GoogleAuthButton({ mode = 'signin', width, onCredential, onError }) {
    const [loading, setLoading] = useState(false);

    if (!isNative) {
        return (
            <GoogleLogin
                onSuccess={(response) => onCredential(response.credential)}
                onError={() => onError(mode === 'signup' ? 'Daftar Google gagal' : 'Login Google gagal')}
                theme="outline"
                size="large"
                text={mode === 'signup' ? 'signup_with' : 'signin_with'}
                shape="rectangular"
                width={width}
                logo_alignment="center"
            />
        );
    }

    const handleClick = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const { SocialLogin } = await loadNativeGoogle();
            const { result } = await SocialLogin.login({ provider: 'google' });

            if (!result?.idToken) {
                throw new Error('Google tidak mengembalikan ID token');
            }
            onCredential(result.idToken);
        } catch (error) {
            if (!isDismissal(error)) {
                onError(mode === 'signup' ? 'Daftar Google gagal. Coba lagi.' : 'Login Google gagal. Coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            className="google-auth-btn"
            onClick={handleClick}
            disabled={loading}
        >
            <GoogleMark />
            <span>
                {loading
                    ? 'Menghubungkan...'
                    : mode === 'signup' ? 'Daftar dengan Google' : 'Masuk dengan Google'}
            </span>
        </button>
    );
}

import { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { isNative } from '../../utils/platform';
import './VoiceInputButton.css';

const LANGUAGE = 'id-ID';

// Loaded on demand so the native plugin stays out of the browser bundle.
let speechModule = null;

// Resolves with the module, never the plugin object: a Capacitor plugin is a
// Proxy that turns any property access into a method call, so resolving a
// promise with one makes JavaScript probe `.then` and the plugin throws.
function loadSpeechPlugin() {
    if (!speechModule) {
        speechModule = import('@capgo/capacitor-speech-recognition');
    }
    return speechModule;
}

function webRecognizer() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return Recognition ? new Recognition() : null;
}


// Denying the microphone or closing the recogniser is a normal user action.
function isDismissal(error) {
    return /abort|cancel|dismiss|no-speech|not-allowed|denied/i.test(error?.message || error?.error || '');
}

/**
 * Microphone button that returns what the user said, in Indonesian.
 *
 * The web build uses the browser Speech API. Android WebView does not implement
 * it — the same gap as the Notification API — so the app goes through
 * @capgo/capacitor-speech-recognition, which drives Android's own recogniser.
 *
 * This component only produces a transcript. Turning that sentence into a
 * transaction happens server-side, and the result is always shown to the user
 * for confirmation rather than saved directly.
 */
export default function VoiceInputButton({ onTranscript, onError, disabled }) {
    const [listening, setListening] = useState(false);

    const listenNative = async () => {
        const { SpeechRecognition } = await loadSpeechPlugin();

        const { speechRecognition } = await SpeechRecognition.requestPermissions();
        if (speechRecognition !== 'granted') {
            onError('Izin mikrofon ditolak. Aktifkan di pengaturan perangkat.');
            return null;
        }

        const { matches } = await SpeechRecognition.start({
            language: LANGUAGE,
            maxResults: 1,
        });
        return matches?.[0] || null;
    };

    const listenWeb = () =>
        new Promise((resolve, reject) => {
            const recognition = webRecognizer();
            if (!recognition) {
                reject(new Error('not-allowed'));
                return;
            }

            recognition.lang = LANGUAGE;
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => resolve(event.results[0][0].transcript);
            recognition.onerror = (event) => reject(new Error(event.error));
            recognition.onend = () => resolve(null);

            recognition.start();
        });

    const handleClick = async () => {
        if (listening || disabled) return;

        setListening(true);
        try {
            const transcript = isNative ? await listenNative() : await listenWeb();
            if (transcript) {
                onTranscript(transcript);
            }
        } catch (error) {
            if (!isDismissal(error)) {
                onError('Tidak bisa mendengar suara. Coba lagi.');
            }
        } finally {
            setListening(false);
        }
    };

    return (
        <button
            type="button"
            className={`voice-btn ${listening ? 'voice-btn--listening' : ''}`}
            onClick={handleClick}
            disabled={disabled}
            aria-label={listening ? 'Sedang mendengarkan' : 'Catat transaksi dengan suara'}
        >
            {listening ? <Square size={18} /> : <Mic size={18} />}
            <span>{listening ? 'Mendengarkan...' : 'Catat dengan Suara'}</span>
        </button>
    );
}

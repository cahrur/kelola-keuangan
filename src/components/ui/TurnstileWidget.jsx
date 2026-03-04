import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise = null;

function loadTurnstileScript() {
    if (typeof window === 'undefined') {
        return Promise.resolve();
    }

    if (window.turnstile) {
        return Promise.resolve();
    }

    if (scriptPromise) {
        return scriptPromise;
    }

    scriptPromise = new Promise((resolve, reject) => {
        let script = document.getElementById(TURNSTILE_SCRIPT_ID);

        if (!script) {
            script = document.createElement('script');
            script.id = TURNSTILE_SCRIPT_ID;
            script.src = TURNSTILE_SCRIPT_SRC;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        const onLoad = () => {
            if (window.turnstile) {
                resolve();
                return;
            }
            reject(new Error('Turnstile failed to initialize'));
        };

        const onError = () => {
            reject(new Error('Failed to load Turnstile script'));
        };

        script.addEventListener('load', onLoad, { once: true });
        script.addEventListener('error', onError, { once: true });
    });

    return scriptPromise;
}

const TurnstileWidget = forwardRef(function TurnstileWidget(
    {
        siteKey,
        onVerify,
        onExpire,
        onError,
        theme = 'light',
        action = 'auth_submit',
        size = 'flexible',
        appearance = 'always',
        execution = 'render',
    },
    ref
) {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const callbacksRef = useRef({ onVerify, onExpire, onError });
    useEffect(() => {
        callbacksRef.current = { onVerify, onExpire, onError };
    }, [onVerify, onExpire, onError]);

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (window.turnstile && widgetIdRef.current !== null) {
                window.turnstile.reset(widgetIdRef.current);
            }
        },
    }), []);

    useEffect(() => {
        if (!siteKey || typeof window === 'undefined') {
            return undefined;
        }

        let active = true;

        loadTurnstileScript()
            .then(() => {
                if (!active || !containerRef.current || !window.turnstile) {
                    return;
                }

                if (widgetIdRef.current !== null) {
                    window.turnstile.remove(widgetIdRef.current);
                    widgetIdRef.current = null;
                }

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    theme,
                    action,
                    size,
                    appearance,
                    execution,
                    callback: (token) => callbacksRef.current.onVerify?.(token),
                    'expired-callback': () => callbacksRef.current.onExpire?.(),
                    'error-callback': () => callbacksRef.current.onError?.(),
                });
            })
            .catch(() => {
                if (!active) return;
                callbacksRef.current.onError?.();
            });

        return () => {
            active = false;
            if (window.turnstile && widgetIdRef.current !== null) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [action, appearance, execution, siteKey, size, theme]);

    if (!siteKey) {
        return null;
    }

    return (
        <div className="auth-turnstile">
            <div ref={containerRef} />
        </div>
    );
});

export default TurnstileWidget;

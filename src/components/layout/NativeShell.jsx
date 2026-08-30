import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { App as CapacitorApp } from '@capacitor/app';
import { isNative } from '../../utils/platform';
import useSettingsStore from '../../stores/settingsStore';
import { requestNotificationPermission } from '../../utils/notification';

// Screens with nothing to go back to — back here leaves the app
const EXIT_ROUTES = ['/', '/login'];

/**
 * Native-only behaviour with no web equivalent. Renders nothing.
 *
 * Without this listener Android's back button closes the app from every screen,
 * instead of stepping back through the router the way the browser does.
 */
export default function NativeShell() {
    const navigate = useNavigate();
    const promptSeen = useSettingsStore((s) => s.notificationPromptSeen);
    const setPromptSeen = useSettingsStore((s) => s.setNotificationPromptSeen);
    const setNotificationEnabled = useSettingsStore((s) => s.setNotificationEnabled);

    // Ask for the notification permission once, on first launch, and switch the
    // daily reminder on when it is granted — the reminder is the reason the app
    // needs the permission at all, so a second opt-in would be busywork.
    useEffect(() => {
        if (!isNative || promptSeen) return;

        let cancelled = false;
        requestNotificationPermission().then((permission) => {
            if (cancelled) return;
            setPromptSeen(true);
            if (permission === 'granted') {
                setNotificationEnabled(true);
            }
        });

        return () => { cancelled = true; };
    }, [promptSeen, setPromptSeen, setNotificationEnabled]);

    useEffect(() => {
        if (!isNative) return undefined;

        let remove;
        let cancelled = false;

        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack && !EXIT_ROUTES.includes(window.location.pathname)) {
                navigate(-1);
            } else {
                CapacitorApp.exitApp();
            }
        }).then((handle) => {
            if (cancelled) handle.remove();
            else remove = () => handle.remove();
        });

        return () => {
            cancelled = true;
            if (remove) remove();
        };
    }, [navigate]);

    return null;
}

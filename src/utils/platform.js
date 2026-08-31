import { Capacitor } from '@capacitor/core';

/**
 * True inside the Capacitor shell (the Android app), false for the web/PWA build.
 *
 * Google Identity Services refuses to render inside an embedded WebView
 * ("disallowed_useragent"), so the Google sign-in button is web-only.
 */
export const isNative = Capacitor.isNativePlatform();

/** 'android' | 'ios' | 'web' */
export const platform = Capacitor.getPlatform();

/**
 * Apakah input suara tersedia di platform ini.
 *
 * Android WebView tidak mengimplementasikan Web Speech API, jadi build native
 * memakai plugin pengenal suara bawaan Android. Browser tanpa API itu tidak
 * menampilkan tombolnya sama sekali.
 */
export function isVoiceInputSupported() {
    return isNative || Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

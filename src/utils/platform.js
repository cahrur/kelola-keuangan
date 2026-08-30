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

/**
 * Stand-in for the Capacitor plugins in the web build.
 *
 * vite.config.js aliases every native-only plugin to this file for non-native
 * modes, so their Android code never reaches the browser bundle or the PWA
 * precache. Each is imported only behind an isNative check, which is false on
 * the web — reaching one of these throws would mean that guard was removed.
 */

function nativeOnly(name) {
    return () => {
        throw new Error(`${name} is native-only and has no web implementation.`);
    };
}

export const SocialLogin = {
    initialize: nativeOnly('SocialLogin'),
    login: nativeOnly('SocialLogin'),
};

export const LocalNotifications = {
    checkPermissions: nativeOnly('LocalNotifications'),
    requestPermissions: nativeOnly('LocalNotifications'),
    schedule: nativeOnly('LocalNotifications'),
    cancel: nativeOnly('LocalNotifications'),
};

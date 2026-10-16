import { auth } from '../firebase';
import { User } from 'firebase/auth';

export interface CachedAuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isAnonymous?: boolean;
}

export const IS_LOGGED_IN_KEY = 'joschool_is_logged_in';
export const CACHED_USER_KEY = 'joschool_auth_cached_user';

/**
 * Returns a cached User object synchronously on initial app render
 * to prevent any flash of the login page (AuthPage) when opening the app.
 */
export function getCachedAuthUser(): User | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    if (auth.currentUser) return auth.currentUser;

    try {
        const isLoggedIn = localStorage.getItem(IS_LOGGED_IN_KEY) === 'true';
        const cached = localStorage.getItem(CACHED_USER_KEY);
        if (isLoggedIn && cached) {
            const parsed = JSON.parse(cached) as CachedAuthUser;
            if (parsed && parsed.uid) {
                return createStubUser(parsed);
            }
        }

        // Also check if Firebase has persisted an authenticated user in localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('firebase:authUser') || key.includes('firebase:authUser'))) {
                const val = localStorage.getItem(key);
                if (val) {
                    const parsed = JSON.parse(val);
                    if (parsed && parsed.uid) {
                        return createStubUser({
                            uid: parsed.uid,
                            email: parsed.email || '',
                            displayName: parsed.displayName || '',
                            photoURL: parsed.photoURL || null,
                            isAnonymous: !!parsed.isAnonymous
                        });
                    }
                }
            }
        }
    } catch {
        // ignore
    }

    return null;
}

function createStubUser(data: CachedAuthUser): User {
    return {
        uid: data.uid,
        email: data.email || '',
        displayName: data.displayName || '',
        photoURL: data.photoURL || null,
        isAnonymous: !!data.isAnonymous,
        emailVerified: true,
        getIdToken: async () => auth.currentUser ? auth.currentUser.getIdToken() : '',
        getIdTokenResult: async () => auth.currentUser ? auth.currentUser.getIdTokenResult() : ({} as any),
        reload: async () => {},
        delete: async () => {},
    } as unknown as User;
}

/**
 * Saves authenticated user metadata to localStorage so subsequent opens load instantly
 */
export function saveCachedAuthUser(user: User | null): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        if (user && user.uid) {
            localStorage.setItem(IS_LOGGED_IN_KEY, 'true');
            const data: CachedAuthUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                isAnonymous: user.isAnonymous
            };
            localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data));
        } else {
            clearCachedAuthUser();
        }
    } catch {
        // ignore
    }
}

/**
 * Clears cached auth user metadata on logout or account deletion
 */
export function clearCachedAuthUser(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        localStorage.removeItem(IS_LOGGED_IN_KEY);
        localStorage.removeItem(CACHED_USER_KEY);
    } catch {
        // ignore
    }
}

/**
 * Checks whether the browser has a stored active session
 */
export function hasCachedAuthSession(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
        if (localStorage.getItem(IS_LOGGED_IN_KEY) === 'true') return true;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('firebase:authUser') || key.includes('firebase:authUser'))) {
                const val = localStorage.getItem(key);
                if (val && val !== 'null' && val !== '{}') return true;
            }
        }
    } catch {
        // ignore
    }
    return false;
}

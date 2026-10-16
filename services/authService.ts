import { 
    User, 
    deleteUser, 
    reauthenticateWithCredential, 
    reauthenticateWithPopup, 
    EmailAuthProvider 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { deleteUserFirestoreData } from './firestoreService';

/**
 * تحديد مزود المصادقة الخاص بالمستخدم (Google أو كلمة المرور أو غير ذلك)
 */
export function getUserAuthProvider(user: User | null): 'password' | 'google' | 'other' {
    if (!user) return 'other';
    const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
    if (isGoogle) return 'google';
    const isPassword = user.providerData.some(p => p.providerId === 'password');
    if (isPassword) return 'password';
    return 'other';
}

/**
 * ترجمة رسائل أخطاء Firebase Auth إلى رسائل عربية واضحة ومفهومة للطالب
 */
export function mapAuthErrorMessage(error: any): string {
    const code = error?.code || '';
    switch (code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/invalid-password':
            return 'كلمة المرور غير صحيحة. يرجى التأكد وإعادة المحاولة.';
        case 'auth/requires-recent-login':
            return 'انتهت صلاحية جلسة تسجيل الدخول الحالية لأسباب أمنية. يرجى تسجيل الخروج ثم إعادة تسجيل الدخول والمحاولة مجدداً.';
        case 'auth/network-request-failed':
            return 'فشل الاتصال بخوادم Firebase. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.';
        case 'auth/popup-closed-by-user':
            return 'تم إغلاق نافذة تسجيل الدخول عبر Google قبل إتمام العملية.';
        case 'auth/cancelled-popup-request':
            return 'تم إلغاء طلب المصادقة عبر Google.';
        case 'auth/popup-blocked':
            return 'تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة والمحاولة مرة أخرى.';
        case 'auth/too-many-requests':
            return 'تم إجراء محاولات متكررة غير صحيحة. يرجى الانتظار قليلاً ثم المحاولة مجدداً.';
        case 'auth/user-not-found':
            return 'لم يتم العثور على الحساب. قد يكون تم حذفه مسبقاً.';
        default:
            if (error?.message && typeof error.message === 'string') {
                if (error.message.includes('offline') || error.message.includes('network')) {
                    return 'فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.';
                }
            }
            return error?.message || 'حدث خطأ غير متوقع أثناء معالجة طلب حذف الحساب.';
    }
}

/**
 * دالة حذف الحساب وجميع البيانات المرتبطة به نهائياً
 * 1. إعادة مصادقة المستخدم (كلمة مرور أو نافذة Google)
 * 2. حذف مستندات المستخدم من Firestore أولاً (بينما لا يزال مسجلاً)
 * 3. حذف الحساب من Firebase Authentication
 */
export async function deleteUserAccount(password?: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('لا يوجد مستخدم مسجل الدخول حالياً.');
    }

    const provider = getUserAuthProvider(currentUser);

    // الخطوة 1: إعادة المصادقة الأمنية
    try {
        if (provider === 'password') {
            if (!password || !password.trim()) {
                throw new Error('يرجى إدخال كلمة المرور لتأكيد حذف الحساب.');
            }
            if (!currentUser.email) {
                throw new Error('لا يوجد بريد إلكتروني مرتبط بحسابك لإعادة المصادقة.');
            }
            const credential = EmailAuthProvider.credential(currentUser.email, password);
            await reauthenticateWithCredential(currentUser, credential);
        } else if (provider === 'google') {
            await reauthenticateWithPopup(currentUser, googleProvider);
        }
    } catch (authError: any) {
        console.error('[DeleteAccount] Re-authentication failed:', authError);
        throw new Error(mapAuthErrorMessage(authError), { cause: authError });
    }

    const uid = currentUser.uid;

    // الخطوة 2: حذف جميع مستندات وبيانات المستخدم من Firestore
    // نقوم بذلك أولاً لأن قواعد أمان Firestore تشترط auth.uid == userId
    try {
        await deleteUserFirestoreData(uid);
        console.log(`[DeleteAccount] Deleted Firestore user document: users/${uid}`);
    } catch (firestoreError: any) {
        console.error('[DeleteAccount] Firestore deletion failed:', firestoreError);
        // حتى لو فشل Firestore (مثلاً المستند غير موجود أصلاً)، نتابع بحذر أو نعلم المستخدم
        // إذا كان الخطأ متعلقاً بقواعد الأمان أو الاتصال نلقي خطأ واضحاً
        if (firestoreError?.message?.includes('permission-denied') || firestoreError?.message?.includes('PERMISSION_DENIED')) {
            throw new Error('فشل حذف بيانات الحساب من قاعدة البيانات بسبب صلاحيات الأمان.', { cause: firestoreError });
        }
    }

    // الخطوة 3: حذف حساب المستخدم من Firebase Authentication
    try {
        await deleteUser(currentUser);
        console.log(`[DeleteAccount] Successfully deleted Firebase Auth user: ${uid}`);
    } catch (deleteError: any) {
        console.error('[DeleteAccount] Firebase Auth deleteUser failed:', deleteError);
        throw new Error(mapAuthErrorMessage(deleteError), { cause: deleteError });
    }

    // الخطوة 4: تنظيف التخزين المحلي للمتصفح
    try {
        const keysToRemove = [
            `joschool_${uid}_app_state`,
            `joschool_${uid}_user_progress`,
            `joschool_${uid}_progress`,
            `joschool_${uid}_completed_lessons`,
            `joschool_${uid}_quiz_results`,
            `joschool_${uid}_favorite_questions`,
            `joschool_${uid}_has_seen_welcome`,
            'joschool_current_user_id',
            'joschool_app_state',
            'joschool_has_seen_welcome',
            'joschool_is_logged_in',
            'joschool_auth_cached_user'
        ];
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
        // Ignore localStorage error
    }
}

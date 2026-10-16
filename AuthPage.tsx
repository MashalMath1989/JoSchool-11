import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from './firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile, 
    signInWithRedirect, 
    getRedirectResult, 
    signInWithPopup,
    sendPasswordResetEmail 
} from 'firebase/auth';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LOGO_DATA_URI } from './logoDataUri';
import { saveCachedAuthUser } from './services/authStorage';

interface AuthPageProps {
    initialSuccessMessage?: string;
}

const AuthPage: React.FC<AuthPageProps> = ({ initialSuccessMessage }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState<string>(() => {
        if (initialSuccessMessage) return initialSuccessMessage;
        try {
            if (sessionStorage.getItem('joschool_account_deleted_notice') === 'true') {
                sessionStorage.removeItem('joschool_account_deleted_notice');
                return 'تم حذف حسابك وجميع بياناتك بنجاح';
            }
        } catch (e) {
            // Ignore storage error
        }
        return '';
    });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(true); // default true for initial redirect check
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    const loginInProgressRef = useRef(false);

    useEffect(() => {
        const handleRedirectCheck = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    console.log("Logged in successfully via redirect on page load:", result.user.email);
                    saveCachedAuthUser(result.user);
                }
            } catch (err: any) {
                console.warn("Redirect check notice:", err?.code || err);
                // Suppress temporary redirect errors or custom domain restrictions gracefully without crashing/blocking
                if (
                    err.code !== 'auth/unauthorized-domain' && 
                    err.code !== 'auth/auth-domain-config-required' &&
                    err.code !== 'auth/popup-closed-by-user' && 
                    err.code !== 'auth/cancelled-popup-request' &&
                    err.code !== 'auth/invalid-continue-uri'
                ) {
                    setError(`خطأ أثناء تسجيل الدخول: ${err.message || 'فشل الاتصال.'}`);
                }
            } finally {
                setGoogleLoading(false);
            }
        };
        handleRedirectCheck();
    }, []);

    const handleGoogleLogin = async () => {
        if (loginInProgressRef.current || googleLoading || loading) return;
        loginInProgressRef.current = true;
        setGoogleLoading(true);
        setError('');
        
        try {
            console.log("Initiating Google sign-in with popup...");
            const res = await signInWithPopup(auth, googleProvider);
            if (res?.user) {
                saveCachedAuthUser(res.user);
            }
            return;
        } catch (popupErr: any) {
            if (popupErr.code === 'auth/popup-closed-by-user' || popupErr.code === 'auth/cancelled-popup-request') {
                console.warn("Google popup closed by user.");
                setGoogleLoading(false);
                loginInProgressRef.current = false;
                return;
            }

            console.warn("Popup sign-in notice. Attempting redirect sign-in as fallback:", popupErr?.code || popupErr);
            
            let isRedirecting = false;
            try {
                console.log("Initiating Google sign-in with redirect...");
                isRedirecting = true;
                await signInWithRedirect(auth, googleProvider);
                return;
            } catch (err: any) {
                console.warn("Google Login notice:", err?.code || err);
                
                if (err.code === 'auth/network-request-failed') {
                    setError('فشل في الاتصال. يرجى التحقق من اتصال الإنترنت الخاص بك.');
                } else if (err.code === 'auth/internal-error') {
                    let detailedMessage = '';
                    try {
                        if (err.message && err.message.includes('{')) {
                            const startIdx = err.message.indexOf('{');
                            const endIdx = err.message.lastIndexOf('}') + 1;
                            if (startIdx !== -1 && endIdx > startIdx) {
                                const parsed = JSON.parse(err.message.substring(startIdx, endIdx));
                                if (parsed.error && parsed.error.message) {
                                    detailedMessage = parsed.error.message;
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("Error parsing internal error payload:", e);
                    }
                    
                    if (detailedMessage) {
                        setError(`خطأ داخلي في Firebase: ${detailedMessage}. يرجى التحقق من إعدادات مشروع Firebase الخاص بك.`);
                    } else {
                        setError(`خطأ داخلي: فشل الاتصال بخدمة تسجيل الدخول. يرجى التأكد من صلاحية الإعدادات.`);
                    }
                } else if (
                    err.code !== 'auth/unauthorized-domain' && 
                    err.code !== 'auth/auth-domain-config-required' &&
                    err.code !== 'auth/invalid-continue-uri'
                ) {
                    setError(`خطأ: ${err.message || 'فشل تسجيل الدخول. حاول مجدداً.'}`);
                }
            } finally {
                if (!isRedirecting) {
                    setGoogleLoading(false);
                    loginInProgressRef.current = false;
                }
            }
        }
    };

    const handleForgotPassword = async () => {
        const cleanEmail = email.trim();
        if (!cleanEmail) {
            setError('يرجى كتابة بريدك الإلكتروني في الحقل أولاً لإرسال رابط استعادة كلمة المرور.');
            return;
        }

        setIsResettingPassword(true);
        setError('');
        try {
            await sendPasswordResetEmail(auth, cleanEmail);
            setSuccessMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح. تفقد صندوق الوارد.');
        } catch (err: any) {
            console.warn('Password reset notice:', err?.code);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('لم يتم العثور على حساب مسجل بهذا البريد. إذا كنت تسجل بجوجل اضغط على زر جوجل أدناه، أو اضغط «سجل الآن».');
            } else if (err.code === 'auth/invalid-email') {
                setError('صيغة البريد الإلكتروني غير صالحة.');
            } else {
                setError('تعذر إرسال رابط الاستعادة حالياً. يمكنك تجربة تسجيل الدخول بجوجل.');
            }
        } finally {
            setIsResettingPassword(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password;

        if (!cleanEmail) {
            setError('يرجى إدخال البريد الإلكتروني.');
            return;
        }

        if (cleanPassword.length < 6) {
            setError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
                if (cred?.user) {
                    saveCachedAuthUser(cred.user);
                }
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
                if (name.trim()) {
                    await updateProfile(userCredential.user, { displayName: name.trim() });
                }
                if (userCredential?.user) {
                    saveCachedAuthUser(userCredential.user);
                }
            }
        } catch (err: any) {
            console.warn("Auth check notice:", err?.code || err?.message);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                if (isLogin) {
                    setError('البريد الإلكتروني أو كلمة المرور غير صحيحة. إذا كنت مسجلاً بحساب Google، اضغط على زر جوجل أدناه، أو اضغط «سجل الآن» بالأسفل لإنشاء حساب.');
                } else {
                    setError('تعذر إنشاء الحساب بهذه البيانات. يرجى التأكد من البريد وكلمة المرور.');
                }
            } else if (err.code === 'auth/email-already-in-use') {
                setError('البريد الإلكتروني مسجل مسبقاً. اضغط على «سجل دخول» في الأسفل.');
            } else if (err.code === 'auth/invalid-email') {
                setError('صيغة البريد الإلكتروني غير صحيحة. يرجى التأكد من كتابته بشكل سليم.');
            } else if (err.code === 'auth/weak-password') {
                setError('كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('تم حظر المحاولات مؤقتاً بسبب تكرار إدخال كلمة المرور بشكل خاطئ. يرجى الانتظار قليلاً أو الدخول بحساب Google.');
            } else if (err.code === 'auth/operation-not-allowed') {
                setError('تسجيل الدخول بالبريد الإلكتروني غير مفعّل حالياً. يرجى استخدام تسجيل الدخول بجوجل أدناه.');
            } else if (err.code === 'auth/network-request-failed') {
                setError('فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.');
            } else {
                setError(err?.message || 'حدث خطأ. يرجى التحقق من البيانات والمحاولة مرة أخرى.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#e5d5c5] flex items-center justify-center p-4 font-naskh" dir="rtl">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-[440px] rounded-xl border border-slate-900 p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(45,58,75,0.1)]"
            >
                <div className="text-center mb-4 flex flex-col items-center">
                    <div className="w-20 h-20 mb-2 mt-0 flex items-center justify-center border border-slate-900 rounded-2xl p-2 bg-white shadow-sm">
                        <img 
                            src={LOGO_DATA_URI} 
                            alt="JoSchool 11" 
                            className="w-full h-auto object-contain"
                        />
                    </div>
                    <p className="text-slate-400 font-bold text-[10px]">المسار الأكاديمي 11 . جيل 2010</p>
                    <p className="text-slate-400 font-bold text-[10px] mt-0.5">منهاج 2027/2026</p>
                </div>

                {successMessage && (
                    <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-800 p-3 rounded-xl mb-3 flex items-center gap-2.5 shadow-xs animate-fadeIn">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-black leading-tight">{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-600 p-2 rounded-lg mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="text-[10px] font-bold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-2">
                    {!isLogin && (
                        <div className="space-y-0.5 text-right">
                            <label className="block text-slate-400 font-black mr-2 text-[10px]">الاسم الكامل</label>
                            <input 
                                type="text"
                                placeholder="أدخل اسمك"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white border border-slate-900 rounded-lg py-2 px-4 outline-none transition-all font-bold text-sm text-[#2d3a4b] placeholder-[#94a3b8] focus:shadow-[4px_4px_0px_0px_rgba(29,91,252,0.2)]"
                                required={!isLogin}
                            />
                        </div>
                    )}
                    
                    <div className="space-y-0.5 text-right">
                        <label className="block text-slate-400 font-black mr-2 text-[10px]">البريد الإلكتروني</label>
                        <input 
                            type="email"
                            placeholder="example@mail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white border border-slate-900 rounded-lg py-2 px-4 outline-none transition-all font-bold text-sm text-[#2d3a4b] placeholder-[#94a3b8] focus:shadow-[4px_4px_0px_0px_rgba(29,91,252,0.2)]"
                            required
                        />
                    </div>

                    <div className="space-y-0.5 text-right">
                        <div className="flex items-center justify-between mr-2">
                            <label className="block text-slate-400 font-black text-[10px]">كلمة المرور</label>
                            {isLogin && (
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    disabled={isResettingPassword}
                                    className="text-[10px] font-bold text-[#1d5bfc] hover:underline cursor-pointer disabled:opacity-50"
                                >
                                    {isResettingPassword ? 'جاري الإرسال...' : 'نسيت كلمة المرور؟'}
                                </button>
                            )}
                        </div>
                        <input 
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white border border-slate-900 rounded-lg py-2 px-4 outline-none transition-all font-bold text-sm text-[#2d3a4b] placeholder-[#94a3b8] focus:shadow-[4px_4px_0px_0px_rgba(29,91,252,0.2)]"
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit"
                            disabled={loading || googleLoading}
                            className="w-full bg-[#1d5bfc] hover:bg-[#1648d1] text-white py-3 rounded-lg font-black text-lg shadow-[0px_4px_0px_0px_rgba(0,0,0,0.15)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50 border border-slate-900"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="relative w-5 h-5">
                                        <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
                                        <motion.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            className="absolute inset-0 border-2 border-white border-t-transparent rounded-full"
                                        />
                                    </div>
                                    <span>جاري التحميل...</span>
                                </div>
                            ) : (isLogin ? 'دخول' : 'تسجيل')}
                        </button>
                    </div>
                </form>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-[1.5px] border-[#2d3a4b]"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-3 text-[#2d3a4b] font-black text-sm">أو من خلال</span>
                    </div>
                </div>

                <button 
                    onClick={handleGoogleLogin}
                    disabled={loading || googleLoading}
                    className="w-full bg-white border border-slate-900 py-2.5 rounded-xl font-black flex items-center justify-center gap-4 transition-all hover:bg-slate-50 active:translate-y-1 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.05)] disabled:opacity-50"
                >
                    {googleLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="relative w-5 h-5">
                                <div className="absolute inset-0 border-2 border-slate-100 rounded-full"></div>
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="absolute inset-0 border-2 border-[#1d5bfc] border-t-transparent rounded-full"
                                />
                            </div>
                            <span className="text-base text-[#2d3a4b]">جاري الاتصال...</span>
                        </div>
                    ) : (
                        <>
                            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                            <span className="text-base text-[#2d3a4b]">تسجيل الدخول بجوجل</span>
                        </>
                    )}
                </button>

                <div className="mt-4 text-center">
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[#1d5bfc] font-black text-sm hover:underline"
                    >
                        {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخول'}
                    </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                    <Link
                        to="/delete-account-info"
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5"
                    >
                        <span>دليل وسياسة حذف الحساب (متجر Google Play)</span>
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPage;

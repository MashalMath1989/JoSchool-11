import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithRedirect, getRedirectResult, signInWithPopup } from 'firebase/auth';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(true); // default true for initial redirect check

    const loginInProgressRef = useRef(false);

    useEffect(() => {
        const handleRedirectCheck = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    console.log("Logged in successfully via redirect on page load:", result.user.email);
                }
            } catch (err: any) {
                console.error("Redirect check error:", err);
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
            await signInWithPopup(auth, googleProvider);
            return;
        } catch (popupErr: any) {
            console.warn("Popup sign-in failed/blocked. Attempting redirect sign-in as fallback:", popupErr);
            
            let isRedirecting = false;
            try {
                console.log("Initiating Google sign-in with redirect...");
                isRedirecting = true;
                await signInWithRedirect(auth, googleProvider);
                return;
            } catch (err: any) {
                console.error("Google Login Error:", err);
                
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
                        console.error("Error parsing internal error payload:", e);
                    }
                    
                    if (detailedMessage) {
                        setError(`خطأ داخلي في Firebase: ${detailedMessage}. يرجى التحقق من إعدادات مشروع Firebase الخاص بك (مثل صحة مفتاح الـ API Key).`);
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

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password.length < 6) {
            setError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (name) {
                    await updateProfile(userCredential.user, { displayName: name });
                }
            }
        } catch (err: any) {
            console.error("Auth Error:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('البريد الإلكتروني مستخدم بالفعل.');
            } else if (err.code === 'auth/weak-password') {
                setError('كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل.');
            } else if (err.code === 'auth/network-request-failed') {
                setError('فشل الاتصال بالشبكة. يرجى التحقق من الإنترنت.');
            } else {
                setError('حدث خطأ. يرجى التحقق من البيانات والمحاولة مرة أخرى.');
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
                            src="https://i.postimg.cc/y8GJVJ52/1777447368581.png" 
                            alt="JoSchool 11" 
                            className="w-full h-auto object-contain"
                        />
                    </div>
                    <p className="text-slate-400 font-bold text-[10px]">المسار الأكاديمي 11 . جيل 2009</p>
                </div>

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
                        <label className="block text-slate-400 font-black mr-2 text-[10px]">كلمة المرور</label>
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
            </motion.div>
        </div>
    );
};

export default AuthPage;

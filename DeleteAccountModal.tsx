import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertTriangle, 
    Trash2, 
    X, 
    Loader2, 
    Lock, 
    Eye, 
    EyeOff, 
    ShieldAlert, 
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getUserAuthProvider, deleteUserAccount } from './services/authService';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSuccess: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
    isOpen,
    onClose,
    user,
    onSuccess
}) => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const provider = getUserAuthProvider(user);

    const handleConfirmDelete = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isLoading) return;

        setErrorMessage('');
        setIsLoading(true);

        try {
            await deleteUserAccount(password);
            // حفظ علامة تأكيد الحذف بنجاح لعرضها على شاشة تسجيل الدخول
            try {
                sessionStorage.setItem('joschool_account_deleted_notice', 'true');
            } catch (e) {
                // Ignore storage error
            }
            onClose();
            onSuccess();
            // التوجيه التلقائي إلى شاشة تسجيل الدخول باستخدام React Router
            try {
                navigate('/login');
            } catch (e) {
                window.history.pushState({}, '', '/login');
            }
        } catch (err: any) {
            console.error('Delete account modal error:', err);
            setErrorMessage(err.message || 'حدث خطأ أثناء محاولة حذف الحساب.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseModal = () => {
        if (isLoading) return;
        setPassword('');
        setErrorMessage('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="delete-account-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
                    onClick={handleCloseModal}
                    dir="rtl"
                >
                    <motion.div
                        key="delete-account-modal-card"
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-white w-full max-w-lg rounded-3xl border-2 border-red-500 shadow-2xl p-6 sm:p-7 text-right relative overflow-hidden my-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* الخلفية التزيينية العلوية */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
                        
                        {/* زر الإغلاق */}
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            disabled={isLoading}
                            className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
                            title="إغلاق"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* رأس النافذة */}
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
                                <Trash2 className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 leading-tight">
                                    حذف الحساب نهائياً
                                </h3>
                                <p className="text-xs text-red-600 font-bold mt-0.5 flex items-center gap-1">
                                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                    <span>تحذير: هذا الإجراء دائم ولا يمكن التراجع عنه</span>
                                </p>
                            </div>
                        </div>

                        {/* صندوق تفاصيل الحذف والتحذير */}
                        <div className="bg-red-50/70 border border-red-200/90 rounded-2xl p-4 mb-4 text-xs font-bold text-red-900 space-y-2 leading-relaxed">
                            <p className="font-black text-red-950 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                <span>عند تأكيد حذف الحساب، سيتم فوراً مسح التالي:</span>
                            </p>
                            <ul className="list-disc list-inside pr-1 space-y-1 text-slate-700 font-bold">
                                <li>حساب تسجيل الدخول الخاص بك (Firebase Authentication).</li>
                                <li>جميع بيانات التقدم الدراسي وسجلات الامتحانات والدرجات المرتبطة بمعرّفك في Firestore.</li>
                                <li>بنك الأسئلة المفضلة والملاحظات والبيانات الشخصية المخزنة.</li>
                            </ul>
                        </div>

                        {/* عرض رسالة الخطأ إن وجدت */}
                        {errorMessage && (
                            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-bold flex items-start gap-2 animate-shake">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <span className="flex-1 leading-relaxed">{errorMessage}</span>
                            </div>
                        )}

                        {/* نموذج التحقق وإعادة المصادقة */}
                        {provider === 'password' ? (
                            <form onSubmit={handleConfirmDelete} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                                        يرجى إدخال كلمة المرور لتأكيد هويتك:
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="delete-account-password-input"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="أدخل كلمة المرور الحالية هنا"
                                            required
                                            disabled={isLoading}
                                            className="w-full px-4 py-3 pr-10 pl-10 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white transition-all text-right"
                                            autoFocus
                                        />
                                        <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-bold mt-1.5">
                                        الحساب المسجل: {user?.email || 'حسابك'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={isLoading}
                                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        إلغاء والاحتفاظ بالحساب
                                    </button>
                                    <button
                                        id="confirm-delete-account-btn"
                                        type="submit"
                                        disabled={isLoading || !password.trim()}
                                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>جاري الحذف...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                <span>تأكيد الحذف نهائياً</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : provider === 'google' ? (
                            <div className="space-y-4">
                                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 leading-relaxed flex items-start gap-2.5">
                                    <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="font-black text-blue-950 mb-0.5">تسجيل الدخول عبر Google</p>
                                        <p className="text-[11px] text-blue-800">
                                            حسابك مسجل باستخدام Google ({user?.email}). ستفتح نافذة منبثقة للتحقق من هويتك وتأكيد حذف الحساب نهائياً.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={isLoading}
                                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        إلغاء والاحتفاظ بالحساب
                                    </button>
                                    <button
                                        id="confirm-delete-account-google-btn"
                                        type="button"
                                        onClick={() => handleConfirmDelete()}
                                        disabled={isLoading}
                                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>جاري التحقق والحذف...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                <span>المتابعة بـ Google وحذف الحساب</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={isLoading}
                                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        id="confirm-delete-account-general-btn"
                                        type="button"
                                        onClick={() => handleConfirmDelete()}
                                        disabled={isLoading}
                                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>جاري الحذف...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                <span>تأكيد الحذف نهائياً</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* رابط دليل حذف الحساب وسياسة البيانات */}
                        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                            <a
                                href="/delete-account-info"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5"
                            >
                                <span>دليل وسياسة حذف الحساب لمتجر Google Play</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DeleteAccountModal;

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, GraduationCap, Target, BookOpen, Trophy, ArrowLeft, CheckCircle2, Zap } from 'lucide-react';
import { LOGO_DATA_URI } from './logoDataUri';

interface WelcomePageProps {
    onStart: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onStart }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden font-sans" dir="rtl">
            {/* Background Decorative Blur Gradients */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header / Top Badge */}
            <header className="w-full max-w-2xl flex items-center justify-between pt-2 relative z-10">
                <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-sky-500/30 shadow-lg">
                    <GraduationCap className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-black text-sky-300">منصة التوجيهي الشاملة</span>
                </div>
                <div className="bg-amber-500/20 text-amber-300 px-3.5 py-1.5 rounded-full border border-amber-500/40 text-xs font-black flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>جيل 2010</span>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="w-full max-w-xl flex flex-col items-center text-center my-auto py-8 relative z-10">
                {/* Logo with Glow Ring */}
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative mb-6 group"
                >
                    <div className="absolute -inset-2 bg-gradient-to-r from-sky-500 via-amber-400 to-indigo-500 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse" />
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-white rounded-3xl p-3 shadow-2xl border-2 border-slate-900 flex items-center justify-center overflow-hidden">
                        <img 
                            src={LOGO_DATA_URI} 
                            alt="JoSchool11" 
                            className="w-full h-full object-contain"
                        />
                    </div>
                </motion.div>

                {/* Badge: Welcome Generation 2010 */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-indigo-500/20 border border-amber-400/30 text-amber-300 font-extrabold text-sm mb-4 shadow-sm"
                >
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>أهلاً أبطال جيل 2010 ✨</span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight text-white mb-4"
                >
                    مرحباً بك في <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-amber-300 to-sky-200">JoSchool11</span> 🎓
                </motion.h1>

                {/* Encouraging Welcome Message */}
                <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="text-base sm:text-lg text-slate-300 font-bold leading-relaxed max-w-lg mb-8 px-2"
                >
                    طريقك إلى التفوق والتميز في التوجيهي يبدأ من هنا! صُممت منصتنا خصيصاً لتزودك بأحدث بنوك الأسئلة، الاختبارات الإلكترونية التفاعلية، والملخصات الشاملة وفق المنهاج الأردني الجديد.
                </motion.p>

                {/* Features Highlights Grid */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                    className="grid grid-cols-2 gap-3 w-full max-w-md mb-8 text-right"
                >
                    <div className="bg-slate-800/70 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3 backdrop-blur-sm shadow-md">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-black text-white">امتحانات تفاعلية</h4>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold">بنوك أسئلة شاملة</p>
                        </div>
                    </div>

                    <div className="bg-slate-800/70 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3 backdrop-blur-sm shadow-md">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-black text-white">فهارس وملخصات</h4>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold">منهاج 2026/2027 الجديد</p>
                        </div>
                    </div>

                    <div className="bg-slate-800/70 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3 backdrop-blur-sm shadow-md">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-black text-white">تتبع التقدم</h4>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold">نتائج وتحليلات</p>
                        </div>
                    </div>

                    <div className="bg-slate-800/70 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3 backdrop-blur-sm shadow-md">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-black text-white">تحديثات فورية</h4>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold">مباشر ومزامن</p>
                        </div>
                    </div>
                </motion.div>

                {/* Primary CTA Button */}
                <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.55, duration: 0.5 }}
                    onClick={onStart}
                    className="w-full max-w-sm py-4 px-8 bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-600 hover:from-sky-300 hover:to-indigo-500 text-slate-950 font-black text-lg sm:text-xl rounded-2xl shadow-xl shadow-sky-500/25 border-2 border-sky-300 flex items-center justify-center gap-3 active:scale-95 transition-all group cursor-pointer"
                >
                    <span>ابدأ رحلتك الآن</span>
                    <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
                </motion.button>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-xl text-center pt-4 border-t border-slate-800/60 relative z-10">
                <p className="text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>تطبيق JoSchool11 — رفيقك نحو العلامة الكاملة 💯</span>
                </p>
            </footer>
        </div>
    );
};

export default WelcomePage;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Semester, Subject, SubjectName } from './types';
import { SparklesIcon, MenuIcon, UserIcon, CalendarIcon, InfoIcon, LogOutIcon, XIcon, BookOpenIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from './data/Icons';
import { User } from 'firebase/auth';

interface LandingPageProps {
    subjectsData: Subject[];
    subjectIndexData: { [key: string]: any[] };
    userProgress: any;
    navigateTo: (view: any, subject?: Subject, title?: string) => void;
    View: any;
    user: User | null;
    handleLogout: (skipConfirm?: boolean) => void;
}

const SubjectGrid = React.memo(({ 
    subjects, 
    title, 
    navigateTo, 
    View, 
    showAchievements,
    subjectIndexData,
    userProgress
}: { 
    subjects: Subject[], 
    title: string, 
    navigateTo: any, 
    View: any, 
    showAchievements?: boolean,
    subjectIndexData: { [key: string]: any[] },
    userProgress: any
}) => {
    const [showSchedule, setShowSchedule] = React.useState(false);

    const calculateProgress = (subject: Subject) => {
        const semesterKey = `${subject.id}-${subject.semester}`;
        const units = subjectIndexData[semesterKey] || subjectIndexData[subject.id] || [];
        
        let totalExams = 0;
        let completedExams = 0;

        const results = userProgress.quizResults || [];

        units.forEach(unit => {
            if (subject.id === SubjectName.Arabic || subject.id === SubjectName.English) {
                // Each lesson is one exam
                totalExams += unit.lessons.length;
                unit.lessons.forEach((lesson: any) => {
                    const isPassed = results.some((r: any) => 
                        r.subjectId === subject.id && 
                        r.lessonTitle === lesson.title &&
                        r.score >= 20
                    );
                    if (isPassed) completedExams++;
                });
            } else {
                // Lessons have chunks (default 5 if not found) + 1 unit exam
                unit.lessons.forEach((lesson: any) => {
                    const chunks = 5; // Simplified for landing page or we could import getLessonChunksCount
                    totalExams += chunks;
                    for (let i = 1; i <= chunks; i++) {
                        const examLabel = `امتحان (${i})`;
                        const fullTitle = `${lesson.title} - ${examLabel}`;
                        const isPassed = results.some((r: any) => 
                            r.subjectId === subject.id && 
                            r.lessonTitle === fullTitle &&
                            r.score >= 20
                        );
                        if (isPassed) completedExams++;
                    }
                });
                
                // Unit exam
                totalExams += 1;
                const unitOrdinal = unit.title.split(':')[0];
                const unitExamTitle = `${unitOrdinal} - امتحان (1)`;
                if (results.some((r: any) => r.subjectId === subject.id && r.lessonTitle === unitExamTitle && r.score >= 20)) {
                    completedExams++;
                }
            }
        });

        return totalExams > 0 ? (completedExams / totalExams) * 100 : 0;
    };

    const CountdownTimer = () => {
        // Thursday 23-7-2026 at 10:00 AM
        const targetDate = new Date('2026-07-23T10:00:00').getTime();
        const [timeLeft, setTimeLeft] = React.useState(targetDate - Date.now());

        React.useEffect(() => {
            const interval = setInterval(() => {
                const now = Date.now();
                setTimeLeft(targetDate - now);
            }, 1000);
            return () => clearInterval(interval);
        }, [targetDate]);

        if (timeLeft <= 0) return null;

        const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((timeLeft % (1000 * 60)) / 1000);

        return (
            <>
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowSchedule(true)}
                    className="flex-1 flex flex-col items-center justify-center bg-yellow-100 rounded-lg h-10 border border-slate-900 shadow-sm mx-2 overflow-hidden py-0.5 cursor-pointer active:bg-yellow-200 transition-colors"
                >
                    <span className="text-[6px] font-black text-slate-400 mb-0.5">موعد امتحانات الوزارة</span>
                    <div className="flex items-center justify-around w-full px-1">
                        <div className="flex flex-col items-center justify-center min-w-[24px]">
                            <span className="text-[10px] font-black text-slate-700 leading-none mb-0.5">{s}</span>
                            <span className="text-[6px] font-bold text-slate-500 italic leading-none">ثانية</span>
                        </div>
                        <div className="text-yellow-400 font-black text-[8px] pb-2">:</div>
                        <div className="flex flex-col items-center justify-center min-w-[24px]">
                            <span className="text-[10px] font-black text-slate-700 leading-none mb-0.5">{m}</span>
                            <span className="text-[6px] font-bold text-slate-500 italic leading-none">دقيقة</span>
                        </div>
                        <div className="text-yellow-400 font-black text-[8px] pb-2">:</div>
                        <div className="flex flex-col items-center justify-center min-w-[24px]">
                            <span className="text-[10px] font-black text-slate-700 leading-none mb-0.5">{h}</span>
                            <span className="text-[6px] font-bold text-slate-500 italic leading-none">ساعة</span>
                        </div>
                        <div className="text-yellow-400 font-black text-[8px] pb-2">:</div>
                        <div className="flex flex-col items-center justify-center min-w-[24px]">
                            <span className="text-[10px] font-black text-slate-800 leading-none mb-0.5">{d}</span>
                            <span className="text-[6px] font-bold text-slate-600 italic leading-none">يوم</span>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {showSchedule && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[999] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
                            onClick={() => setShowSchedule(false)}
                        >
                            <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-2xl z-[1000] border-2 border-slate-900"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSchedule(false);
                                }}
                            >
                                <XIcon className="w-6 h-6 stroke-[3px]" />
                            </motion.button>

                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative max-w-full max-h-[90vh] bg-white p-1 rounded-2xl border-4 border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img 
                                    src="https://i.postimg.cc/7YxNQpbk/FB-IMG-1778071583057.jpg" 
                                    alt="Exam Schedule" 
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                    referrerPolicy="no-referrer"
                                />
                            </motion.div>
                            
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 text-white font-black text-lg text-center"
                            >
                                جدول امتحانات الوزارة ٢٠٢٦
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        );
    };

    return (
        <div className="mb-1">
            <div className="flex items-center justify-between mb-0.5 px-2 text-right gap-2">
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-2 h-6 bg-yellow-400 rounded-full"></div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">{title}</h2>
                </div>
                
                {showAchievements && <CountdownTimer />}

                {showAchievements && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigateTo(View.Progress)}
                        className="w-10 h-10 bg-white border border-slate-900 rounded-lg shadow-sm flex items-center justify-center active:scale-95 transition-all hover:bg-slate-50"
                    >
                        <span className="text-xl">📊</span>
                    </motion.button>
                )}
            </div>

            <div className="bg-gradient-to-br from-sky-400 to-slate-800 p-1.5 sm:p-2.5 rounded-xl shadow-2xl border border-slate-900">
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
                    {subjects.map((subject) => {
                        const isAvailable = 
                            subject.id === SubjectName.JordanHistory || 
                            subject.id === SubjectName.IslamicEducation || 
                            subject.id === SubjectName.English ||
                            (subject.semester === Semester.First && subject.id === SubjectName.Arabic);
                        
                        const progress = calculateProgress(subject);
                        
                        return (
                            <motion.div
                                key={`${subject.id}-${subject.semester}`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigateTo(View.SubjectIndex, subject)}
                                className="bg-white rounded-lg p-1 sm:p-1.5 shadow-lg border border-slate-900 cursor-pointer flex flex-col transition-all hover:shadow-xl group relative overflow-hidden h-[74px] sm:h-[88px]"
                            >
                                <div className="flex flex-row items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                    <div className="w-9 h-11 sm:w-12 sm:h-15 rounded-lg overflow-hidden shadow-sm shrink-0 z-10 border border-slate-100">
                                        <img 
                                            src={subject.coverImage} 
                                            alt={subject.id} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            referrerPolicy="no-referrer" 
                                        />
                                    </div>
                                    <div className="flex-1 text-right z-10 min-w-0">
                                        <h3 className={`text-[9.5px] sm:text-[18.5px] tracking-tighter font-black text-slate-800 mb-0.5 sm:mb-1 whitespace-nowrap ${subject.fontClass}`}>{subject.id}</h3>
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <span className={`text-[8px] sm:text-[11px] font-bold ${isAvailable ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {isAvailable ? 'متاح' : 'قريباً'}
                                            </span>
                                            {isAvailable && (
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {isAvailable && progress > 0 && (
                                    <div className="w-full mt-1 flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className="h-full bg-emerald-500"
                                            />
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-black text-emerald-600 shrink-0">{Math.round(progress)}%</span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

const LandingPage: React.FC<LandingPageProps> = React.memo(({
    subjectsData,
    subjectIndexData,
    userProgress,
    navigateTo,
    View,
    user,
    handleLogout
}) => {
    const [showInfoModal, setShowInfoModal] = React.useState(false);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
    const [showScheduleModal, setShowScheduleModal] = React.useState(false);
    const [showScannerModal, setShowScannerModal] = React.useState(false);
    const [scannerImageIndex, setScannerImageIndex] = React.useState(0);

    const scannerImages = [
        "https://i.postimg.cc/nzLXGr42/1778778150663.png",
        "https://i.postimg.cc/6pY4PF9r/FB-IMG-1778776954923.jpg",
        "https://i.postimg.cc/dQrkFhsT/FB-IMG-1778776964544.jpg",
        "https://i.postimg.cc/G2Y2bfCL/FB-IMG-1778776967553.jpg",
        "https://i.postimg.cc/QdtdFC3b/FB-IMG-1778776972054.jpg",
        "https://i.postimg.cc/Y9w7zq5C/FB-IMG-1778776980210.jpg",
        "https://i.postimg.cc/D0ytxWBV/1778778158457.png",
        "https://i.postimg.cc/fLbKFxnm/nmwdhj-alajabt-wrqt-alqary-almash-aldwyy-farght.jpg"
    ];

    const firstSemesterSubjects = subjectsData.filter(s => s.semester === Semester.First);
    const secondSemesterSubjects = subjectsData.filter(s => s.semester === Semester.Second);

    const menuItems = [
        { 
            id: 'profile', 
            label: 'ملفي', 
            icon: <UserIcon className="w-5 h-5" />, 
            action: () => navigateTo(View.Progress) 
        },
        { 
            id: 'schedule', 
            label: 'جدول امتحانات الوزارة', 
            icon: <CalendarIcon className="w-5 h-5" />, 
            action: () => setShowScheduleModal(true) 
        },
        { 
            id: 'scanner', 
            label: 'تعليمات الماسح الضوئي', 
            icon: <BookOpenIcon className="w-5 h-5" />, 
            action: () => setShowScannerModal(true) 
        },
        { 
            id: 'logout', 
            label: 'تسجيل الخروج', 
            icon: <LogOutIcon className="w-5 h-5 text-red-500" />, 
            action: () => setShowLogoutConfirm(true),
            className: 'text-red-500'
        },
    ];

    return (
        <div className="container mx-auto p-4 max-w-2xl text-right" dir="rtl">
            {/* Header - Non-sticky */}
            <div className="mb-4 mt-1">
                <div className="relative flex items-center justify-between min-h-[64px]">
                    {/* Menu Button (Right side in RTL) */}
                    {user && (
                        <div className="relative z-50">
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="w-10 h-10 bg-white border border-slate-900 rounded-lg shadow-sm flex items-center justify-center text-slate-800 hover:bg-slate-50 transition-all active:scale-95 shrink-0"
                                title="القائمة"
                            >
                                <MenuIcon className="w-6 h-6" />
                            </button>

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <>
                                        {/* Overlay to close menu */}
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 bg-transparent"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-56 bg-white border-2 border-slate-900 rounded-2xl shadow-2xl overflow-hidden py-1"
                                        >
                                            {menuItems.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        item.action();
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-right font-black text-sm border-b border-slate-100 last:border-0 ${item.className || 'text-slate-700'}`}
                                                >
                                                    <span className="shrink-0">{item.icon}</span>
                                                    <span className="flex-1">{item.label}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Logo Area (Centered Exactly) */}
                    <div 
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
                        onClick={() => setShowInfoModal(true)}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-14 h-14 flex items-center justify-center border border-slate-900 rounded-xl p-1 bg-white shadow-sm group-hover:border-primary transition-colors"
                        >
                            <img 
                                src="https://i.postimg.cc/y8GJVJ52/1777447368581.png" 
                                alt="App Logo" 
                                className="w-full h-auto object-contain"
                            />
                        </motion.div>
                        <p className="font-bold text-slate-400 text-[9px] mt-1 whitespace-nowrap group-hover:text-primary transition-colors">المسار الأكاديمي 11 . جيل 2009</p>
                    </div>

                    <AnimatePresence>
                        {showInfoModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6"
                                onClick={() => setShowInfoModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border-2 border-slate-900 relative overflow-hidden text-center"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    
                                    <button 
                                        onClick={() => setShowInfoModal(false)}
                                        className="absolute top-4 left-4 p-2 bg-slate-50 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors z-10"
                                    >
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>

                                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 border-2 border-slate-900 overflow-hidden shadow-sm">
                                        <img 
                                            src="https://i.postimg.cc/y8GJVJ52/1777447368581.png" 
                                            alt="App Logo" 
                                            className="w-12 h-12 object-contain"
                                        />
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-800 mb-4 leading-tight font-jordan">تطبيق الشامل التعليمي</h3>
                                    
                                    <div className="space-y-4 text-slate-600 font-bold leading-relaxed">
                                        <p>تطبيق تعليمي مخصص لطلاب الصف الحادي عشر الأكاديمي (جيل 2009) في المواد الوزارية الأربعة:</p>
                                        
                                        <div className="flex flex-wrap justify-center gap-2 py-2">
                                            {['تاريخ الأردن', 'التربية الإسلامية', 'اللغة العربية', 'اللغة الإنجليزية'].map((sub, i) => (
                                                <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-primary font-black">
                                                    {sub}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-sm">
                                            صمم التطبيق ليكون بمثابة <span className="text-slate-900 underline decoration-yellow-400 decoration-2">بنك أسئلة ضخم</span> يضم آلاف الأسئلة المتوقعة بنظام 'ضع دائرة' التي تحاكي امتحانات الوزارة بشكل كبير، لضمان أفضل تحضير وتفوق لطلابنا الأعزاء.
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => setShowInfoModal(false)}
                                        className="mt-8 w-full py-4 bg-slate-900 text-white rounded-xl font-black shadow-lg active:scale-95 transition-transform"
                                    >
                                        حسناً، فهمت
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* User Profile (Left side in RTL) */}
                    {user && (
                        <div className="flex items-center gap-1.5 shrink-0 ml-1 z-10">
                            <span className="text-[10px] font-black text-slate-900 leading-[1.1] select-none max-w-[65px] text-right break-words py-0.5">
                                {(() => {
                                    if (!user.displayName) return 'مستخدم';
                                    const firstName = user.displayName.split(' ')[0];
                                    return firstName;
                                })()}
                            </span>
                            <div className="w-10 h-10 rounded-full border-2 border-slate-900 overflow-hidden shadow-sm bg-white shrink-0">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName || 'Profile'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black text-lg">
                                        {user.displayName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <SubjectGrid 
                subjects={firstSemesterSubjects} 
                title="الفصل الأول" 
                navigateTo={navigateTo} 
                View={View} 
                showAchievements={true} 
                subjectIndexData={subjectIndexData}
                userProgress={userProgress}
            />
            <SubjectGrid 
                subjects={secondSemesterSubjects} 
                title="الفصل الثاني" 
                navigateTo={navigateTo} 
                View={View} 
                subjectIndexData={subjectIndexData}
                userProgress={userProgress}
            />

            {/* Additional Sessions Section */}
            <div className="grid grid-cols-2 gap-4 mt-4">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateTo(View.SessionSubjects, undefined, 'الدورة التجريبية')}
                    className="bg-white rounded-lg p-4 shadow-lg border-r-4 border-yellow-400 flex items-center justify-center cursor-pointer transition-all hover:shadow-xl h-16 border border-slate-900"
                >
                    <span className="font-black text-slate-800 text-sm">دورة تجريبية</span>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateTo(View.SessionSubjects, undefined, 'دورة 2008')}
                    className="bg-white rounded-lg p-4 shadow-lg border-r-4 border-sky-400 flex items-center justify-center cursor-pointer transition-all hover:shadow-xl h-16 border border-slate-900"
                >
                    <span className="font-black text-slate-800 text-sm">دورة 2008</span>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateTo(View.SessionSubjects, undefined, 'الدوسيات')}
                    className="bg-white rounded-lg p-4 shadow-lg border-r-4 border-yellow-400 flex items-center justify-center cursor-pointer transition-all hover:shadow-xl h-16 border border-slate-900"
                >
                    <span className="font-black text-slate-800 text-sm">الدوسيات</span>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateTo(View.SessionSubjects, undefined, 'دورة 2008 تكميلي')}
                    className="bg-white rounded-lg p-4 shadow-lg border-r-4 border-sky-400 flex items-center justify-center cursor-pointer transition-all hover:shadow-xl h-16 border border-slate-900"
                >
                    <span className="font-black text-slate-800 text-sm">دورة 2008 تكميلي</span>
                </motion.div>
            </div>

            {/* Additional Modals */}
            <AnimatePresence>
                {/* Logout Confirmation */}
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl border-2 border-slate-900 text-center"
                        >
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500 border border-red-200">
                                <LogOutIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2 font-jordan">تسجيل الخروج</h3>
                            <p className="text-slate-500 font-bold text-sm mb-6">هل أنت متأكد من رغبتك في الخروج من التطبيق؟</p>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => handleLogout(true)}
                                    className="w-full py-3 bg-red-500 text-white rounded-xl font-black shadow-lg border-b-4 border-red-700 active:translate-y-1 active:border-b-0 transition-all font-jordan"
                                >
                                    نعم، خروج
                                </button>
                                <button 
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-200 transition-colors font-jordan"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Exam Schedule Modal */}
                {showScheduleModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
                        onClick={() => setShowScheduleModal(false)}
                    >
                        <motion.button
                            className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-2xl z-[2001] border-2 border-slate-900"
                            onClick={() => setShowScheduleModal(false)}
                        >
                            <XIcon className="w-6 h-6" />
                        </motion.button>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative max-w-full max-h-[90vh] bg-white p-1 rounded-2xl border-4 border-slate-900 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img 
                                src="https://i.postimg.cc/7YxNQpbk/FB-IMG-1778071583057.jpg" 
                                alt="Exam Schedule" 
                                className="max-w-full max-h-full object-contain"
                                referrerPolicy="no-referrer"
                            />
                        </motion.div>
                        <p className="mt-4 text-white font-black text-lg font-jordan">جدول امتحانات الوزارة ٢٠٢٦</p>
                    </motion.div>
                )}

                {/* Scanner Instructions Modal */}
                {showScannerModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4"
                        onClick={() => setShowScannerModal(false)}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-4xl h-[95vh] rounded-[2rem] shadow-2xl border-4 border-slate-900 relative flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header - Fixed */}
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-slate-100 shrink-0 bg-white z-10">
                                <button 
                                    onClick={() => setShowScannerModal(false)}
                                    className="p-2 bg-slate-100 rounded-full border-2 border-slate-900 hover:bg-slate-200 transition-colors"
                                >
                                    <XIcon className="w-5 h-5 text-slate-900" />
                                </button>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-800 font-jordan">تعليمات الماسح الضوئي</h3>
                                <div className="w-10"></div>
                            </div>

                            {/* Scrollable Images Container */}
                            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 custom-scrollbar bg-slate-100">
                                {scannerImages.map((src, index) => (
                                    <div key={index} className="relative w-full rounded-2xl border-2 border-slate-200 overflow-hidden bg-white shadow-sm flex flex-col">
                                        <img 
                                            src={src} 
                                            alt={`Instruction ${index + 1}`}
                                            className="w-full h-auto object-contain"
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                        />
                                        
                                        {/* Download button only for the last image (Image 8) */}
                                        {index === scannerImages.length - 1 && (
                                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                                                <button
                                                    onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = src;
                                                        link.download = 'answer_sheet.jpg';
                                                        link.target = '_blank';
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                    }}
                                                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-lg border-2 border-slate-900 hover:bg-blue-700 transition-all active:scale-95"
                                                >
                                                    <DownloadIcon className="w-6 h-6" />
                                                    <span className="text-lg">تحميل مسودة الإجابة</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                
                                <div className="py-12 text-center">
                                    <button 
                                        onClick={() => setShowScannerModal(false)}
                                        className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg font-jordan transition-transform active:scale-[0.98] text-lg"
                                    >
                                        تمت القراءة وإغلاق
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default LandingPage;

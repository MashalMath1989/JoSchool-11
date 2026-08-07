import React, { useState } from 'react';
import { ClockIcon, TrophyIcon, CheckCircleIcon, CheckIcon, StarIcon, BookmarkIcon, UserIcon } from './data/Icons';
import { UserProgress } from './types';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine
} from 'recharts';

interface ProgressDashboardProps {
    userProgress: UserProgress;
    setUserProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
    goBack?: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-right text-xs font-bold leading-relaxed" dir="rtl">
                <p className="font-extrabold text-[#3b82f6] mb-1.5">{label}</p>
                <div className="space-y-1">
                    {payload.map((p: any, i: number) => {
                        if (p.value === 0) return null;
                        return (
                            <p key={i} className="flex items-center justify-between gap-4">
                                <span className="opacity-80 font-bold">{p.name}:</span>
                                <span className="font-black" style={{ color: p.color || p.fill }}>{p.value} سؤال</span>
                            </p>
                        );
                    })}
                    <div className="h-px bg-slate-700 my-1"></div>
                    <p className="flex items-center justify-between gap-4 font-black text-white">
                        <span>المجموع:</span>
                        <span>
                            {payload.reduce((sum: number, p: any) => sum + (typeof p.value === 'number' ? p.value : 0), 0)} سؤال
                        </span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
    userProgress,
    setUserProgress
}) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'achievements'>('profile');

    // Retrieve initial student profile fields, defaulting to empty strings
    const profile = userProgress.studentProfile || {};
    const [name, setName] = useState(profile.name || '');
    const [seatNumber, setSeatNumber] = useState(profile.seatNumber || '');
    const [email, setEmail] = useState(profile.email || '');
    const [age, setAge] = useState(profile.age || '');
    const [gender, setGender] = useState(profile.gender || '');
    const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');
    const [useDemoData, setUseDemoData] = useState<boolean>(() => {
        return !userProgress.quizResults || userProgress.quizResults.length === 0;
    });

    const getWeeklyChartData = () => {
        const last7Days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            last7Days.push(d);
        }

        const weekdaysArabic = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        
        if (useDemoData) {
            const mockValues = [
                { "تاريخ الأردن": 12, "التربية الإسلامية": 8, "اللغة العربية": 5, "الرياضيات": 10 },
                { "تاريخ الأردن": 5, "التربية الإسلامية": 15, "اللغة العربية": 12, "الرياضيات": 8 },
                { "تاريخ الأردن": 18, "التربية الإسلامية": 0, "اللغة العربية": 15, "الرياضيات": 5 },
                { "تاريخ الأردن": 0, "التربية الإسلامية": 20, "اللغة العربية": 8, "الرياضيات": 12 },
                { "تاريخ الأردن": 10, "التربية الإسلامية": 12, "اللغة العربية": 18, "الرياضيات": 15 },
                { "تاريخ الأردن": 15, "التربية الإسلامية": 10, "اللغة العربية": 22, "الرياضيات": 20 },
                { "تاريخ الأردن": 20, "التربية الإسلامية": 14, "اللغة العربية": 10, "الرياضيات": 25 },
            ];

            return last7Days.map((date, idx) => {
                const dayName = weekdaysArabic[date.getDay()];
                const label = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;
                const mock = mockValues[idx];
                const total = mock["تاريخ الأردن"] + mock["التربية الإسلامية"] + mock["اللغة العربية"] + mock["الرياضيات"];
                return {
                    name: label,
                    dateObj: date,
                    ...mock,
                    "المجموع الكلي": total
                };
            });
        }

        return last7Days.map((date) => {
            const dayName = weekdaysArabic[date.getDay()];
            const label = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;
            
            const resultsOnDay = userProgress.quizResults.filter(r => {
                if (!r.date) return false;
                const rDate = new Date(r.date);
                return rDate.getFullYear() === date.getFullYear() &&
                       rDate.getMonth() === date.getMonth() &&
                       rDate.getDate() === date.getDate();
            });

            let jordanHistory = 0;
            let islamicEducation = 0;
            let arabic = 0;
            let math = 0;

            resultsOnDay.forEach(r => {
                const sub = r.subjectId;
                const qCount = r.totalQuestions || 0;
                
                if (sub === "تاريخ الأردن") {
                    jordanHistory += qCount;
                } else if (sub === "التربية الإسلامية") {
                    islamicEducation += qCount;
                } else if (sub === "اللغة العربية") {
                    arabic += qCount;
                } else if (sub === "الرياضيات") {
                    math += qCount;
                } else {
                    const cleanSub = String(sub).toLowerCase();
                    if (cleanSub.includes('history') || cleanSub.includes('تاريخ')) {
                        jordanHistory += qCount;
                    } else if (cleanSub.includes('islamic') || cleanSub.includes('إسلام')) {
                        islamicEducation += qCount;
                    } else if (cleanSub.includes('arabic') || cleanSub.includes('عرب')) {
                        arabic += qCount;
                    } else if (cleanSub.includes('math') || cleanSub.includes('رياض')) {
                        math += qCount;
                    } else {
                        jordanHistory += qCount;
                    }
                }
            });

            const total = jordanHistory + islamicEducation + arabic + math;

            return {
                name: label,
                dateObj: date,
                "تاريخ الأردن": jordanHistory,
                "التربية الإسلامية": islamicEducation,
                "اللغة العربية": arabic,
                "الرياضيات": math,
                "المجموع الكلي": total
            };
        });
    };

    const chartData = getWeeklyChartData();
    const totalWeeklySolved = chartData.reduce((acc, curr) => acc + curr["المجموع الكلي"], 0);

    // Reminder preferences loaded from local storage
    const [reminderEnabled, setReminderEnabled] = useState<boolean>(() => {
        try {
            return localStorage.getItem('joschool_study_reminder_enabled') === 'true';
        } catch {
            return false;
        }
    });
    const [reminderTime, setReminderTime] = useState<string>(() => {
        try {
            return localStorage.getItem('joschool_study_reminder_time') || '18:00';
        } catch {
            return '18:00';
        }
    });
    const [reminderTone, setReminderTone] = useState<string>(() => {
        try {
            return localStorage.getItem('joschool_study_reminder_tone') || 'motivational';
        } catch {
            return 'motivational';
        }
    });

    const [testNotificationText, setTestNotificationText] = useState('');
    const [showTestBanner, setShowTestBanner] = useState(false);

    const handleToggleReminder = async (checked: boolean) => {
        setReminderEnabled(checked);
        try {
            localStorage.setItem('joschool_study_reminder_enabled', String(checked));
        } catch (e) {
            console.warn('LocalStorage error:', e);
        }
        
        try {
            if (checked && 'Notification' in window) {
                if (Notification.permission === 'default') {
                    await Notification.requestPermission();
                }
            }
        } catch (e) {
            console.log('Notification permission request or access not allowed inside sandboxed template:', e);
        }
    };

    const handleTestReminder = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const message = reminderTone === 'motivational'
            ? '💪 بطلنا المستقبل ينتظرك! حان وقت المذاكرة ومراجعة دروسك اليوم لتحقيق أحلامك وتفوقك! ✨'
            : reminderTone === 'challenging'
            ? '🔥 تحدي اليوم قد بدأ! ربع ساعة من التركيز تصنع فارقاً عظيماً في نتيجتك النهائية. أثبت لنفسك قوتك! 🎯'
            : '📚 تفوقك غايتنا. خذ نفساً عميقاً، وابدأ بالاطلاع على دروسك اليوم بخطوات واثقة وهادئة. 🌸';

        setTestNotificationText(message);
        setShowTestBanner(true);

        // Standard notification if permission was allowed
        try {
            if ('Notification' in window) {
                const perm = Notification.permission;
                if (perm === 'granted') {
                    new Notification('تذكير الدراسة اليومي 🎓', {
                        body: message,
                        referrerPolicy: 'no-referrer'
                    });
                } else if (perm !== 'denied') {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        new Notification('تذكير الدراسة اليومي 🎓', {
                            body: message,
                            referrerPolicy: 'no-referrer'
                        });
                    }
                }
            }
        } catch (err) {
            console.log('Direct desktop Notification blocked in iframe, fallback to UI banner is active.', err);
        }
    };

    const totalLessons = userProgress.completedLessons.length;
    const allQuizResults = userProgress.quizResults;
    const totalQuizzes = allQuizResults.length;
    
    // Calculate average percentage instead of raw score to handle different max marks
    const averagePercentage = totalQuizzes > 0 
        ? Math.round(allQuizResults.reduce((acc, r) => {
            const ratio = r.totalQuestions > 0 ? (r.score / r.totalQuestions) : 0;
            return acc + (ratio > 1 ? 100 : ratio * 100);
        }, 0) / totalQuizzes)
        : 0;
    
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h} ساعة و ${m} دقيقة`;
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage('');
        
        try {
            localStorage.setItem('joschool_study_reminder_enabled', String(reminderEnabled));
            localStorage.setItem('joschool_study_reminder_time', reminderTime);
            localStorage.setItem('joschool_study_reminder_tone', reminderTone);
        } catch (err) {
            console.error('Failed to save reminder preferences to localStorage', err);
        }

        setTimeout(() => {
            setUserProgress(prev => ({
                ...prev,
                studentProfile: {
                    name,
                    seatNumber,
                    email,
                    age,
                    gender,
                    phoneNumber
                }
            }));
            setIsSaving(false);
            setSaveMessage('تم حفظ إعدادات الدراسة والبيانات بنجاح! ✨');
            
            // Clear message after 3 seconds
            setTimeout(() => {
                setSaveMessage('');
            }, 3000);
        }, 800);
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl pt-2 text-right animate-fade-in" dir="rtl">
            {/* Title Block */}
            <div className="text-right mb-6 px-2 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-text-main flex items-center gap-3">
                        <div className="w-2 h-10 bg-primary rounded-full"></div>
                        لوحة الطالب الدراسية
                    </h3>
                    <p className="text-text-sub font-bold text-[9px] mt-1">إدخال البيانات ومتابعة الإنجاز والتقدم</p>
                </div>
            </div>

            {/* Custom Tab Switcher */}
            <div className="flex bg-[#ededee] p-1.5 rounded-xl mb-6 border border-slate-900 shadow-inner">
                <button
                    id="tab-profile-btn"
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-3 text-center text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'profile'
                            ? 'bg-primary text-white shadow-md border border-slate-900 scale-[1.02]'
                            : 'text-slate-600 hover:text-slate-800'
                    }`}
                >
                    <UserIcon className="w-4 h-4" />
                    الملف الشخصي
                </button>
                <button
                    id="tab-achievements-btn"
                    onClick={() => setActiveTab('achievements')}
                    className={`flex-1 py-3 text-center text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'achievements'
                            ? 'bg-primary text-white shadow-md border border-slate-900 scale-[1.02]'
                            : 'text-slate-600 hover:text-slate-800'
                    }`}
                >
                    <TrophyIcon className="w-4 h-4" />
                    لوحة الإنجازات
                </button>
            </div>

            {activeTab === 'profile' ? (
                /* Profile Tab */
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-900">
                    <h3 className="text-base font-black text-text-main mb-6 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-primary" />
                        البيانات الشخصية للطالب
                    </h3>

                    {saveMessage && (
                        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-bold mb-5 border border-emerald-200 text-center animate-pulse">
                            {saveMessage}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-4 text-right">
                        {/* الاسم كامل */}
                        <div>
                            <label className="block text-xs font-black text-text-sub mb-1">الاسم كامل</label>
                            <input
                                id="profile-name-input"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="أدخل اسمك الكامل هنا"
                                className="w-full px-4 py-2.5 bg-app-bg/50 border border-slate-900 rounded-lg text-sm text-text-main font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                            />
                        </div>

                        {/* رقم الجلوس والبريد الإلكتروني */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-text-sub mb-1">رقم الجلوس</label>
                                <input
                                    id="profile-seat-input"
                                    type="text"
                                    value={seatNumber}
                                    onChange={(e) => setSeatNumber(e.target.value)}
                                    placeholder="أدخل رقم الجلوس"
                                    className="w-full px-4 py-2.5 bg-app-bg/50 border border-slate-900 rounded-lg text-sm text-text-main font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-text-sub mb-1 text-right">البريد الإلكتروني (الايميل)</label>
                                <input
                                    id="profile-email-input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    className="w-full px-4 py-2.5 bg-app-bg/50 border border-slate-900 rounded-lg text-sm text-text-main font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left ltr"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* العمر والجنس */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-text-sub mb-1">العمر</label>
                                <input
                                    id="profile-age-input"
                                    type="text"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    placeholder="العمر بالسنوات"
                                    className="w-full px-4 py-2.5 bg-app-bg/50 border border-slate-900 rounded-lg text-sm text-text-main font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-text-sub mb-1">الجنس</label>
                                <div className="flex bg-[#f3f4f6] p-1 rounded-lg border border-slate-900 shadow-inner h-[46px] items-center">
                                    <button
                                        id="gender-male-btn"
                                        type="button"
                                        onClick={() => setGender('ذكر')}
                                        className={`flex-1 h-full text-xs font-black rounded-md transition-all ${
                                            gender === 'ذكر'
                                                ? 'bg-primary text-white border border-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        ذكر
                                    </button>
                                    <button
                                        id="gender-female-btn"
                                        type="button"
                                        onClick={() => setGender('أنثى')}
                                        className={`flex-1 h-full text-xs font-black rounded-md transition-all ${
                                            gender === 'أنثى'
                                                ? 'bg-primary text-white border border-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        أنثى
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* رقم الهاتف */}
                        <div>
                            <label className="block text-xs font-black text-text-sub mb-1">رقم الهاتف</label>
                            <input
                                id="profile-phone-input"
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="07xxxxxxxx"
                                className="w-full px-4 py-2.5 bg-app-bg/50 border border-slate-900 rounded-lg text-sm text-text-main font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left ltr"
                                dir="ltr"
                            />
                        </div>

                        {/* إعدادات تذكير الدراسة (الأجهزة والتنبيهات) */}
                        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-900 space-y-4 text-right pt-4 mt-6">
                            <h4 className="text-xs font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-200">
                                <span className="text-lg leading-none select-none">🔔</span>
                                إعدادات التنبيهات وتذكير الدراسة اليومي
                            </h4>

                            {showTestBanner && (
                                <div className="bg-[#f0f9ff] border-r-4 border-primary p-3 rounded-lg text-right text-xs font-bold text-slate-800 animate-pulse relative border border-slate-200">
                                    <div className="font-extrabold text-primary mb-1">🔔 تنبيه تجريبي للمذاكرة:</div>
                                    {testNotificationText}
                                    <button 
                                        type="button" 
                                        onClick={() => setShowTestBanner(false)}
                                        className="absolute top-2 left-2 text-slate-600 hover:text-slate-900 font-extrabold"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-4 py-2 bg-white px-3.5 py-3 rounded-lg border border-slate-900 shadow-sm">
                                <div className="text-right">
                                    <span className="block text-xs font-black text-text-main">تفعيل منبه المذاكرة</span>
                                    <span className="block text-[9px] font-bold text-text-sub mt-0.5">ستتلقى تذكيرًا يوميًا لمراجعة دروسك</span>
                                </div>
                                <button
                                    id="reminder-toggle-btn"
                                    type="button"
                                    onClick={() => handleToggleReminder(!reminderEnabled)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-slate-900 transition-colors duration-200 ease-in-out focus:outline-none ${
                                        reminderEnabled ? 'bg-primary' : 'bg-slate-300'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md border border-slate-900 ring-0 transition duration-200 ease-in-out ${
                                            reminderEnabled ? '-translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            {reminderEnabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in duration-200">
                                    <div>
                                        <label className="block text-xs font-black text-text-sub mb-1">وقت التنبيه المفضل</label>
                                        <input
                                            id="reminder-time-input"
                                            type="time"
                                            value={reminderTime}
                                            onChange={(e) => setReminderTime(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-slate-900 rounded-lg text-sm text-text-main font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-text-sub mb-1">أسلوب رسالة التذكير</label>
                                        <select
                                            id="reminder-tone-select"
                                            value={reminderTone}
                                            onChange={(e) => setReminderTone(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-900 rounded-lg text-xs text-text-main font-black focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                                        >
                                            <option value="motivational" className="font-bold">💪 حماسي وتشجيعي</option>
                                            <option value="challenging" className="font-bold">🎯 تحدي ومثابرة</option>
                                            <option value="calm" className="font-bold">🌸 هادئ ومتزن</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {reminderEnabled && (
                                <div className="flex gap-2 justify-end pt-1">
                                    <button
                                        id="test-reminder-btn"
                                        type="button"
                                        onClick={(e) => handleTestReminder(e)}
                                        className="text-[10px] font-black text-slate-800 bg-white border border-slate-900 rounded-lg px-3.5 py-2 shadow-sm hover:bg-slate-100 transition-all active:scale-[0.98] inline-flex items-center gap-1.5"
                                    >
                                        <span>📢 تجربة التنبيه الآن</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* زر الحفظ */}
                        <div className="pt-4">
                            <button
                                id="profile-save-btn"
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-3 bg-primary text-white font-black text-sm rounded-lg shadow-md border border-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        جاري حفظ البيانات...
                                    </>
                                ) : (
                                    <>
                                        <span>حفظ البيانات</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* Achievements Tab (Original Progress Dashboard) */
                <>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-8">
                        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-md border-b-4 border-primary text-center border border-slate-900 flex flex-col justify-between">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                                <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 leading-tight break-all">{formatTime(userProgress.totalTimeSpent)}</div>
                            <div className="text-[8px] sm:text-[9px] font-bold text-text-sub mt-1">وقت التعلم الكلي</div>
                        </div>
                        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-md border-b-4 border-accent text-center border border-slate-900 flex flex-col justify-between">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 text-accent rounded-lg flex items-center justify-center mx-auto mb-3">
                                <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 leading-tight">{averagePercentage}%</div>
                            <div className="text-[8px] sm:text-[9px] font-bold text-text-sub mt-1">معدل الإنجاز</div>
                        </div>
                    </div>

                    {/* قسم الإحصائيات الرسم البياني للأسبوع الماضي */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-900 mb-6 text-right select-none">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    <span className="text-base leading-none select-none">📈</span>
                                    تحليل وإحصائيات المذاكرة الأسبوعية
                                </h3>
                                <p className="text-[9px] font-bold text-slate-500 mt-1">تتبع عدد الأسئلة التي قمت بحلها في كل مادة خلال الأيام الـ 7 الماضية</p>
                            </div>
                            
                            {/* زر تبديل محاكاة البيانات */}
                            <button
                                type="button"
                                onClick={() => setUseDemoData(!useDemoData)}
                                className={`text-[9px] font-black px-3 py-1.5 rounded-full border border-slate-900 shadow-sm transition-all active:scale-[0.98] flex items-center gap-1.5 ${
                                    useDemoData 
                                        ? 'bg-amber-100 text-amber-800 font-extrabold' 
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold'
                                }`}
                            >
                                <span>{useDemoData ? '💡 وضع المعاينة بالتوضيح' : '🌐 وضع بياناتك الحقيقية'}</span>
                            </button>
                        </div>

                        {/* أزرار تبديل نمط الرسم البياني */}
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mb-6 max-w-[280px] mr-auto">
                            <button
                                type="button"
                                onClick={() => setChartMode('area')}
                                className={`flex-1 py-1 px-2.5 text-center text-[10px] font-black rounded-md transition-all ${
                                    chartMode === 'area'
                                        ? 'bg-primary text-white shadow-sm border border-slate-900/10'
                                        : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                📈 التقدم الزمني
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode('bar')}
                                className={`flex-1 py-1 px-2.5 text-center text-[10px] font-black rounded-md transition-all ${
                                    chartMode === 'bar'
                                        ? 'bg-primary text-white shadow-sm border border-slate-900/10'
                                        : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                📊 توزيع المواد
                            </button>
                        </div>

                        {/* مساحة الرسم البياني */}
                        <div className="w-full h-60 relative my-2 pr-1" dir="ltr">
                            {chartMode === 'area' ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#64748b" 
                                            fontSize={8} 
                                            fontWeight="900"
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            stroke="#64748b" 
                                            fontSize={8} 
                                            fontWeight="900"
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area 
                                            name="الأسئلة المحلولة" 
                                            type="monotone" 
                                            dataKey="المجموع الكلي" 
                                            stroke="#3b82f6" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorTotal)" 
                                        />
                                        {/* خط مرجعي مستهدف ومميز */}
                                        <ReferenceLine 
                                            y={15} 
                                            stroke="#ef4444" 
                                            strokeDasharray="4 4" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#64748b" 
                                            fontSize={8} 
                                            fontWeight="900"
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            stroke="#64748b" 
                                            fontSize={8} 
                                            fontWeight="900"
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend 
                                            verticalAlign="top" 
                                            height={32} 
                                            iconSize={6}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: 8, fontWeight: '900', direction: 'rtl' }}
                                        />
                                        <Bar name="تاريخ الأردن" dataKey="تاريخ الأردن" stackId="sub" fill="#f59e0b" />
                                        <Bar name="التربية الإسلامية" dataKey="التربية الإسلامية" stackId="sub" fill="#0ea5e9" />
                                        <Bar name="اللغة العربية" dataKey="اللغة العربية" stackId="sub" fill="#10b981" />
                                        <Bar name="الرياضيات" dataKey="الرياضيات" stackId="sub" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* ملخص إرشاد ذكي */}
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-4 flex items-start gap-3">
                            <span className="text-sm select-none">💡</span>
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-800">تحليل الأداء للأسبوع الماضي</h4>
                                <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                                    لقد قمت بحل ما مجموعه <span className="text-primary font-black">{totalWeeklySolved} سؤالاً</span> في مختلف المواد خلال الأيام السبعة الماضية.
                                    {totalWeeklySolved > 100 ? (
                                        <span> رائع جداً! استمر بهذا الجهد والتركيز العالي، أنت على الطريق الصحيح للتميز والتفوق التام في الثانوية العامة! 🚀</span>
                                    ) : totalWeeklySolved > 40 ? (
                                        <span> عمل ممتاز! أنت تحقق تقدماً ثابتاً وملحوظاً، حاول زيادة جهودك اليومية قليلاً للاستحواذ على كامل المادة. ⭐️</span>
                                    ) : (
                                        <span> التفوق يأتي بالاستمرارية والتنظيم؛ حدد وقتاً ثابتاً للدراسة يومياً وحافظ على حل الأسئلة والامتحانات المتاحة لكل درس. 🌱</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-900">
                            <h3 className="text-xs font-black text-text-main mb-4 flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                الدروس المكتملة ({totalLessons})
                            </h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {userProgress.completedLessons.length > 0 ? (
                                    [...userProgress.completedLessons].reverse().map((l, i) => (
                                        <div key={i} className="bg-app-bg/50 p-3 rounded-xl text-sm font-bold text-text-main border-r-4 border-emerald-500 flex items-center justify-between border border-slate-900">
                                            <span>{l}</span>
                                            <CheckIcon className="w-4 h-4 text-emerald-500" />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-text-sub italic text-center py-4">لم تكتمل أي دروس بعد</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-900">
                            <h3 className="text-base font-black text-text-main mb-4 flex items-center gap-2">
                                <StarIcon className="w-5 h-5 text-amber-500" />
                                سجل الامتحانات ({totalQuizzes})
                            </h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {totalQuizzes > 0 ? (
                                    [...allQuizResults].reverse().map((r, i) => {
                                        const ratio = r.totalQuestions > 0 ? (r.score / r.totalQuestions) : 0;
                                        const isAlreadyScaled = ratio > 1;
                                        const displayPercentage = isAlreadyScaled ? Math.min(r.score, 100) : Math.round(ratio * 100);
                                        const isPassed = displayPercentage >= 50;

                                        return (
                                            <div key={i} className="bg-app-bg/50 p-4 rounded-lg flex items-center justify-between border-r-4 border-primary shadow-sm border border-slate-900">
                                                <div className="text-right">
                                                    <div className="font-black text-text-main text-sm leading-tight mb-1">{r.lessonTitle}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-bold text-text-sub bg-white px-2 py-0.5 rounded-full border border-primary/10">{r.subjectId}</span>
                                                        <span className="text-[8px] font-bold text-text-sub opacity-60">{new Date(r.date).toLocaleDateString('ar-EG')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className={`text-sm font-black ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {displayPercentage}%
                                                    </div>
                                                    <div className="w-16 h-1 bg-app-bg rounded-full overflow-hidden mt-1">
                                                        <div className={`h-full ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${displayPercentage}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-text-sub italic text-center py-4">لا توجد نتائج امتحانات بعد</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-900">
                            <h3 className="text-base font-black text-text-main mb-4 flex items-center gap-2">
                                <BookmarkIcon className="w-5 h-5 text-amber-500" />
                                الأسئلة المفضلة ({userProgress.favoriteQuestions.length})
                            </h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {userProgress.favoriteQuestions.length > 0 ? (
                                    [...userProgress.favoriteQuestions].reverse().map((q, i) => (
                                        <div key={i} className="bg-app-bg/50 p-4 rounded-lg border-r-4 border-amber-500 shadow-sm border border-slate-900">
                                            <div className="text-right">
                                                <div className="font-black text-text-main text-xs leading-relaxed mb-2">{q.question}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-bold text-text-sub bg-white px-2 py-0.5 rounded-full border border-amber-500/20">{q.subjectId}</span>
                                                    <span className="text-[8px] font-bold text-text-sub opacity-60">{q.lessonTitle} {q.semester ? `(${q.semester})` : ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-text-sub italic text-center py-4">لا توجد أسئلة مفضلة بعد</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProgressDashboard;

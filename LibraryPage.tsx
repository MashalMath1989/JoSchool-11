import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Subject, LessonResource, Semester } from './types';
import { ArrowRightIcon } from './data/Icons';
import { ResourceViewerModal } from './ResourceViewerModal';
import { 
    RefreshCw, 
    FileText, 
    ImageIcon, 
    PlayCircle, 
    ExternalLink,
    Download,
    CheckCircle2
} from 'lucide-react';
import { 
    RawLibraryGroup, 
    ValidLibraryItem, 
    loadCachedLibraryData, 
    fetchRemoteLibraryData, 
    extractValidLibraryItems, 
    countValidItemsInCategory,
    inferResourceType
} from './services/libraryService';

interface LibraryPageProps {
    subjectsData: Subject[];
    navigateTo: (view: View, subject?: any, title?: string) => void;
    onBack: () => void;
}

// 1. المواد الدراسية (لجيل 2010)
const LIBRARY_SUBJECTS = [
    { 
        label: "الرياضيات", 
        coverImage: 'https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/Math11_S1_Cover.png',
        fontClass: 'font-sans'
    },
    { 
        label: "تاريخ الأردن", 
        coverImage: 'https://i.postimg.cc/PfB5Smtw/1760536062333-tarykh-alardn.jpg',
        fontClass: 'font-naskh'
    },
    { 
        label: "اللغة العربية", 
        coverImage: 'https://i.postimg.cc/J79zpb1X/1760540922343-g11.png',
        fontClass: 'font-naskh'
    },
    { 
        label: "التربية الإسلامية", 
        coverImage: 'https://i.postimg.cc/gcf2gvY8/1760541071199-aslamyt-11.png',
        fontClass: 'font-naskh'
    },
];

// 2. خيارات الفصل الدراسي
const SEMESTER_OPTIONS = [
    { id: Semester.First, label: "الفصل الأول" },
    { id: Semester.Second, label: "الفصل الثاني" },
    { id: "both", label: "كلا الفصلين" }
];

// 3. التصنيفات المطلوبة مع نفس الأيقونات والترتيب الأصلي
const CATEGORIES_LIST = [
    { label: "الكتب المدرسية", icon: "📖" },
    { label: "الدوسيات", icon: "📚" },
    { label: "ملخصات", icon: "📝" },
    { label: "امتحانات", icon: "📋" },
    { label: "أوراق عمل", icon: "📑" },
    { label: "البطاقات", icon: "🎴" },
];

const LibraryPage: React.FC<LibraryPageProps> = ({
    subjectsData = [],
    onBack
}) => {
    // تحميل بيانات المكتبة من السيرفر والتخزين المحلي
    const [libraryGroups, setLibraryGroups] = useState<RawLibraryGroup[]>(() => loadCachedLibraryData());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [syncNotification, setSyncNotification] = useState<string | null>(null);

    // الخطوات بالترتيب الأصلي: المادة أولاً، ثم الفصل الدراسي، ثم التصنيف
    const [selectedSubject, setSelectedSubject] = useState<string>("الرياضيات");
    const [selectedSemester, setSelectedSemester] = useState<string>(Semester.First);
    const [selectedCategory, setSelectedCategory] = useState<string>("الكتب المدرسية");

    // جلب غلاف المادة حسب الفصل المحدد مع توفير صور احتياطية مضمونة
    const getSubjectCover = (subjectLabel: string) => {
        if (selectedSemester === Semester.Second) {
            const sem2 = subjectsData.find(s => s.id === subjectLabel && s.semester === Semester.Second);
            if (sem2?.coverImage) return sem2.coverImage;
        }
        const sem1 = subjectsData.find(s => s.id === subjectLabel && s.semester === Semester.First);
        if (sem1?.coverImage) return sem1.coverImage;
        const anySub = subjectsData.find(s => s.id === subjectLabel);
        if (anySub?.coverImage) return anySub.coverImage;
        const staticItem = LIBRARY_SUBJECTS.find(s => s.label === subjectLabel);
        return staticItem?.coverImage || '';
    };

    // جلب نمط خط المادة
    const getSubjectFontClass = (subjectLabel: string) => {
        const sub = subjectsData.find(s => s.id === subjectLabel);
        if (sub?.fontClass) return sub.fontClass;
        const staticItem = LIBRARY_SUBJECTS.find(s => s.label === subjectLabel);
        return staticItem?.fontClass || (subjectLabel === "الرياضيات" ? 'font-sans' : 'font-naskh');
    };

    // حالة نافذة المعاينة (نفس نافذة عرض مصادر الفصل)
    const [activeResourceModal, setActiveResourceModal] = useState<{
        resource: LessonResource;
        title: string;
        downloadFileName: string;
    } | null>(null);
    const isModalInHistoryRef = useRef(false);

    // إجمالي عدد الملفات الصالحة المتوفرة حالياً في كامل المكتبة
    const totalAvailableInLibrary = useMemo(() => {
        return extractValidLibraryItems(libraryGroups).length;
    }, [libraryGroups]);

    // وظيفة جلب البيانات وتحديثها فورياً أولاً بأول
    const syncLibraryData = useCallback(async (isManual = false) => {
        if (isManual) setIsRefreshing(true);
        try {
            const freshData = await fetchRemoteLibraryData();
            if (freshData && ((Array.isArray(freshData) && freshData.length > 0) || (typeof freshData === 'object' && Object.keys(freshData).length > 0))) {
                setLibraryGroups(freshData);
                const freshCount = extractValidLibraryItems(freshData).length;
                if (isManual) {
                    setSyncNotification(`تم فحص وتحديث مصادر المكتبة فورياً (${freshCount} ملف متوفر)`);
                    setTimeout(() => setSyncNotification(null), 4000);
                }
            }
        } catch (err) {
            console.warn('Could not refresh remote library resources:', err);
        } finally {
            if (isManual) setIsRefreshing(false);
        }
    }, []);

    // جلب أحدث بيانات مصادر المكتبة من ملف JSON فورياً + مراقبة مستمرة
    useEffect(() => {
        // 1. جلب فوري عند فتح الصفحة
        syncLibraryData(false);

        // 2. فحص تلقائي دوري كل 20 ثانية لتحديث أي مصدر مضاف فوراً
        const intervalId = setInterval(() => {
            syncLibraryData(false);
        }, 20000);

        // 3. فحص وتحديث فوري عند العودة إلى التبويب (Window Focus / Visibility Change)
        const handleFocusOrVisible = () => {
            if (document.visibilityState === 'visible') {
                syncLibraryData(false);
            }
        };

        window.addEventListener('focus', handleFocusOrVisible);
        document.addEventListener('visibilitychange', handleFocusOrVisible);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocusOrVisible);
            document.removeEventListener('visibilitychange', handleFocusOrVisible);
        };
    }, [syncLibraryData]);

    const handleManualRefresh = () => {
        syncLibraryData(true);
    };

    // استخراج العناصر الصالحة التي تمتلك رابطاً فقط من ملف JSON
    const filteredItems: ValidLibraryItem[] = extractValidLibraryItems(libraryGroups, {
        subject: selectedSubject,
        semester: selectedSemester,
        category: selectedCategory
    });

    // فتح الملف في نافذة المعاينة مع ضبط السجل لزر الرجوع في الهاتف
    const handleOpenFile = (item: ValidLibraryItem) => {
        if (!item.fileUrl) return;

        const resType = inferResourceType(item.type, item.fileUrl);
        const fileExt = resType === 'pdf' ? 'pdf' : resType === 'video' ? 'mp4' : 'png';
        const cleanTitle = item.title.replace(/[/\\?%*:|"<>]/g, '').trim();
        const downloadFileName = `${cleanTitle}.${fileExt}`;

        setActiveResourceModal({
            resource: {
                type: resType,
                url: item.fileUrl,
                resourceTitle: item.title
            },
            title: `${item.subject} • ${item.category}`,
            downloadFileName
        });

        try {
            const currentState = window.history.state || {};
            if (!currentState.activeResourceModal) {
                const safeHistoryIndex = typeof currentState.historyIndex === 'number' ? currentState.historyIndex : 1;
                window.history.pushState({
                    ...currentState,
                    historyIndex: safeHistoryIndex,
                    activeResourceModal: true
                }, '');
                isModalInHistoryRef.current = true;
            }
        } catch (e) {
            console.warn("pushState error:", e);
        }
    };

    // إغلاق نافذة المعاينة مع الرجوع خطوة في سجل المتصفح
    const closeResourceModal = useCallback(() => {
        setActiveResourceModal(null);
        if (isModalInHistoryRef.current || window.history.state?.activeResourceModal) {
            isModalInHistoryRef.current = false;
            try {
                window.history.back();
            } catch (e) {
                console.warn("history back error:", e);
            }
        }
    }, []);

    // الاستماع لزر الرجوع في الهاتف للعودة إلى صفحة المكتبة وليس إلى واجهة التطبيق الرئيسية
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            const state = e.state || {};
            if (!state.activeResourceModal) {
                isModalInHistoryRef.current = false;
                setActiveResourceModal(null);
            } else {
                isModalInHistoryRef.current = true;
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const currentSemesterLabel = SEMESTER_OPTIONS.find(s => s.id === selectedSemester)?.label || selectedSemester;

    return (
        <div id="library-page" className="container mx-auto p-4 max-w-3xl pt-2 text-right animate-fade-in" dir="rtl">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-11 bg-yellow-400 rounded-full shrink-0"></div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
                            المكتبة الدراسية
                            <span className="text-[10px] bg-slate-900 text-yellow-400 font-extrabold px-2 py-0.5 rounded-md">
                                منهاج 2010
                            </span>
                        </h3>
                        <p className="text-slate-500 font-bold text-xs mt-0.5">
                            الملفات والمصادر المعتمدة للمنهاج الدراسي
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* مؤشر التزامن الفوري */}
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>تحديث مباشر</span>
                    </div>

                    {/* زر تحديث البيانات من ملف JSON */}
                    <button
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className="p-2.5 bg-white border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-slate-800 hover:bg-slate-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        title="تحديث مصادر المكتبة من السيرفر فورياً"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-800 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
                        <span className="hidden sm:inline text-xs font-black">
                            {isRefreshing ? 'تحديث...' : 'تحديث فوري'}
                        </span>
                    </button>

                    {/* زر الرجوع */}
                    <button 
                        onClick={onBack}
                        className="w-11 h-11 bg-white border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-slate-800 hover:bg-slate-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all shrink-0 flex items-center justify-center group cursor-pointer"
                        title="رجوع للرئيسية"
                    >
                        <ArrowRightIcon className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* إشعار تأكيد التحديث الفوري */}
            {syncNotification && (
                <div className="mb-4 p-3 bg-emerald-100 border-2 border-emerald-800 text-emerald-950 rounded-xl font-black text-xs flex items-center gap-2 animate-fade-in shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{syncNotification}</span>
                </div>
            )}

            {/* بطاقة خطوات الاختيار بنفس التنسيق والأيقونات السابقة: المادة -> الفصل -> التصنيف */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5 mb-5">
                {/* الخطوة ١: اختيار المادة أولاً */}
                <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 mb-2.5 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                        ١. اختر المادة الدراسية:
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {LIBRARY_SUBJECTS.map((sub) => {
                            const isSelected = selectedSubject === sub.label;
                            const coverImage = getSubjectCover(sub.label);
                            const fontClass = getSubjectFontClass(sub.label);

                            return (
                                <button
                                    key={sub.label}
                                    type="button"
                                    onClick={() => setSelectedSubject(sub.label)}
                                    className={`p-1.5 sm:p-2 rounded-xl border-2 transition-all flex flex-row items-center gap-2 sm:gap-2.5 cursor-pointer relative overflow-hidden group h-[68px] sm:h-[76px] touch-manipulation text-right select-none ${
                                        isSelected
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-none scale-[1.02]'
                                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-900 shadow-xs'
                                    }`}
                                >
                                    {/* غلاف المادة بنفس طريقة عرض بطاقة المادة في حاوية الفصل */}
                                    <div className={`w-8 h-11 sm:w-9 sm:h-13 rounded-lg overflow-hidden shadow-sm shrink-0 border z-10 transition-all ${
                                        isSelected ? 'border-slate-700' : 'border-slate-100'
                                    }`}>
                                        <img 
                                            src={coverImage} 
                                            alt={sub.label} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            referrerPolicy="no-referrer" 
                                        />
                                    </div>

                                    {/* اسم المادة */}
                                    <div className="flex-1 text-right z-10 min-w-0">
                                        <h4 className={`text-[11.5px] sm:text-xs md:text-sm tracking-tight font-black leading-snug break-words ${
                                            isSelected ? 'text-white' : 'text-slate-800'
                                        } ${fontClass}`}>
                                            {sub.label}
                                        </h4>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* الخطوة ٢: ثم اختيار الفصل الدراسي */}
                <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 mb-2.5 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                        ٢. اختر الفصل الدراسي:
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                        {SEMESTER_OPTIONS.map((sem) => {
                            const isSelected = selectedSemester === sem.id;
                            return (
                                <button
                                    key={sem.id}
                                    onClick={() => setSelectedSemester(sem.id)}
                                    className={`p-2.5 rounded-xl border-2 font-black text-xs sm:text-sm text-center transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-none scale-[1.02]'
                                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-900 shadow-xs'
                                    }`}
                                >
                                    <span>{sem.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* الخطوة ٣: ثم اختيار التصنيف المطلوب */}
                <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 mb-2.5 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        ٣. اختر التصنيف المطلوب:
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {CATEGORIES_LIST.map((cat) => {
                            const isSelected = selectedCategory === cat.label;
                            const availableCount = countValidItemsInCategory(
                                libraryGroups, 
                                cat.label, 
                                selectedSubject, 
                                selectedSemester
                            );

                            return (
                                <button
                                    key={cat.label}
                                    onClick={() => setSelectedCategory(cat.label)}
                                    className={`p-3 rounded-xl border-2 font-black text-xs sm:text-sm text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative ${
                                        isSelected
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-none scale-[1.02]'
                                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-900 shadow-xs'
                                    }`}
                                >
                                    <span className="text-xl sm:text-2xl">{cat.icon}</span>
                                    <span className="whitespace-nowrap truncate w-full">{cat.label}</span>
                                    {availableCount > 0 && (
                                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                            isSelected ? 'bg-yellow-400 text-slate-950 font-black' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                            {availableCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* عرض الملفات الناتجة بنفس طريقة عرض مصادر الفصل */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                {/* رأس قسم الملفات */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                    <div>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                            <span>ملفات: {selectedCategory}</span>
                            <span className="text-slate-400 font-bold">•</span>
                            <span className="text-sky-700">{selectedSubject}</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 font-bold">
                            {currentSemesterLabel}
                        </p>
                    </div>

                    <span className="text-[11px] bg-slate-900 text-yellow-400 px-3 py-1 rounded-full font-black self-start sm:self-auto">
                        {filteredItems.length} {filteredItems.length === 1 ? 'ملف متوفر' : 'ملفات متوفرة'}
                    </span>
                </div>

                {/* قائمة الملفات المعروضة من ملف JSON (الملفات ذات الروابط فقط) */}
                {filteredItems.length > 0 ? (
                    <div className="space-y-3">
                        {filteredItems.map((item, index) => {
                            const isPdf = item.type === 'pdf';
                            const isImage = item.type === 'image';
                            const isVideo = item.type === 'video';

                            return (
                                <div
                                    key={`${item.id}-${index}`}
                                    className="bg-white p-4 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right group"
                                >
                                    <div className="flex items-start sm:items-center gap-3">
                                        {/* أيقونة نوع الملف */}
                                        <div className="w-10 h-10 rounded-xl border border-slate-900 flex items-center justify-center shrink-0 shadow-2xs transition-colors bg-slate-100 group-hover:bg-yellow-100">
                                            {isPdf && <FileText className="w-5 h-5 text-rose-600" />}
                                            {isImage && <ImageIcon className="w-5 h-5 text-emerald-600" />}
                                            {isVideo && <PlayCircle className="w-5 h-5 text-sky-600" />}
                                            {!isPdf && !isImage && !isVideo && <ExternalLink className="w-5 h-5 text-sky-600" />}
                                        </div>

                                        {/* تفاصيل الملف */}
                                        <div className="space-y-1">
                                            <h5 className="font-black text-slate-900 text-xs sm:text-sm leading-snug">
                                                {item.title}
                                            </h5>
                                            <div className="flex items-center flex-wrap gap-2 text-[10px]">
                                                <span className="bg-sky-100 text-sky-900 font-extrabold px-2 py-0.5 rounded-md border border-sky-200">
                                                    {item.subject}
                                                </span>
                                                <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                                    {item.semester}
                                                </span>
                                                <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md border border-amber-200">
                                                    {item.category}
                                                </span>
                                                <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                                                    {isPdf ? 'ملف PDF' : isImage ? 'صورة' : isVideo ? 'فيديو' : 'رابط'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* أزرار الإجراء: معاينة وتحميل الملف */}
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <button
                                            onClick={() => handleOpenFile(item)}
                                            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                                        >
                                            {isPdf ? (
                                                <>
                                                    <FileText className="w-4 h-4 text-rose-400" />
                                                    <span>معاينة الملف (PDF)</span>
                                                </>
                                            ) : isImage ? (
                                                <>
                                                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                                                    <span>عرض الصورة</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink className="w-4 h-4 text-yellow-400" />
                                                    <span>فتح المحتوى</span>
                                                </>
                                            )}
                                        </button>

                                        {/* زر تنزيل مباشر */}
                                        <a
                                            href={item.fileUrl}
                                            download={`${item.title}.pdf`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                                            title="تحميل الملف مباشرة"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* حالة عدم وجود ملفات متوفرة برابط في هذا التصنيف والمادة */
                    <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-xl border border-slate-300">
                            📁
                        </div>
                        <h5 className="font-black text-slate-800 text-xs sm:text-sm">
                            لا توجد ملفات متوفرة في قسم ({selectedCategory}) لمادة ({selectedSubject}) حالياً
                        </h5>
                        <p className="text-[11px] text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
                            سيتم عرض الملفات فور إدراج روابطها في ملف المكتبة (JSON).
                        </p>
                    </div>
                )}
            </div>

            {/* نافذة معاينة وعرض الملف (نفس نافذة عرض مصادر الفصل) */}
            {activeResourceModal && (
                <ResourceViewerModal
                    resource={activeResourceModal.resource}
                    lessonTitle={activeResourceModal.title}
                    downloadFileName={activeResourceModal.downloadFileName}
                    onClose={closeResourceModal}
                />
            )}
        </div>
    );
};

export default LibraryPage;

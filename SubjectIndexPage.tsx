import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpenIcon, ChevronDownIcon, StarIcon, BookmarkIcon, RefreshIcon, ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, Loader2 } from './data/Icons';
import { Subject, Unit, Lesson, View, SubjectName, Semester } from './types';
import { isSubjectLoaded, getLessonChunksCount } from './services/quizService';

interface SubjectIndexPageProps {
    selectedSubject: Subject | null;
    subjectIndexData: { [key: string]: Unit[] };
    expandedUnitIndices: number[];
    toggleUnit: (idx: number) => void;
    expandedLessonKeys: string[];
    toggleLesson: (key: string) => void;
    userProgress: any;
    handleStartQuiz: (lesson: Lesson, chunkIndex?: number, unitTitle?: string) => void;
    handleStartUnitExam: (unit: Unit, uIdx: number) => void;
    handleStartComprehensiveExam: () => void;
    openExternalBook: () => void;
    navigateTo: (view: any) => void;
    onBack: () => void;
}

const SubjectIndexPage: React.FC<SubjectIndexPageProps> = React.memo(({
    selectedSubject,
    subjectIndexData,
    expandedUnitIndices,
    toggleUnit,
    expandedLessonKeys,
    toggleLesson,
    userProgress,
    handleStartQuiz,
    handleStartUnitExam,
    handleStartComprehensiveExam,
    openExternalBook,
    navigateTo,
    onBack
}) => {
    if (!selectedSubject) return null;
    
    // Try to get semester-specific data first, then fall back to generic subject data
    const semesterKey = `${selectedSubject.id}-${selectedSubject.semester}`;
    const units = subjectIndexData[semesterKey] || subjectIndexData[selectedSubject.id] || [];
    
    const isLoaded = selectedSubject.id === SubjectName.English || isSubjectLoaded(selectedSubject.id as SubjectName);

    const getExamStatus = (lessonTitle: string, examNumber: number) => {
        const isEnglish = selectedSubject.id === SubjectName.English;
        const examLabel = isEnglish ? `Exam (${examNumber})` : `امتحان (${examNumber})`;
        const fullTitle = `${lessonTitle} - ${examLabel}`;

        const results = userProgress.quizResults?.filter((r: any) => 
            r.subjectId === selectedSubject.id && r.lessonTitle === fullTitle
        ) || [];

        if (results.length === 0) return null;
        const bestScore = Math.max(...results.map(r => r.score));
        
        if (bestScore === 40) return 'perfect';
        if (bestScore >= 20) return 'passed';
        return 'failed';
    };

    const getUnitExamStatus = (unitTitle: string) => {
        const unitOrdinal = unitTitle.split(':')[0];
        const isEnglish = selectedSubject.id === SubjectName.English;
        const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
        const fullTitle = `${unitOrdinal} - ${examLabel}`;

        const results = userProgress.quizResults?.filter((r: any) => 
            r.subjectId === selectedSubject.id && r.lessonTitle === fullTitle
        ) || [];

        if (results.length === 0) return null;
        const bestScore = Math.max(...results.map(r => r.score));
        
        if (bestScore === 40) return 'perfect';
        if (bestScore >= 20) return 'passed';
        return 'failed';
    };

    const getExamProgressStyle = (lessonTitle: string, examNumber: number) => {
        const status = getExamStatus(lessonTitle, examNumber);

        if (status === 'perfect') {
            return {
                backgroundColor: '#10b981',
                color: 'white',
                borderColor: '#0f172a'
            };
        }

        const isEnglish = selectedSubject.id === SubjectName.English;
        const examLabel = isEnglish ? `Exam (${examNumber})` : `امتحان (${examNumber})`;
        const fullTitle = `${lessonTitle} - ${examLabel}`;
        const key = `${selectedSubject.id}_${fullTitle}`;
        const progress = userProgress.examProgresses?.[key];

        if (progress && progress.totalQuestions > 0) {
            const percentage = (progress.currentQuestionIndex / progress.totalQuestions) * 100;
            return {
                background: `linear-gradient(to top, #fbbf24 ${percentage}%, white ${percentage}%)`,
                borderColor: '#0f172a'
            };
        }
        return {};
    };

    const getUnitExamProgressStyle = (unitTitle: string) => {
        const status = getUnitExamStatus(unitTitle);

        if (status === 'perfect') {
            return {
                backgroundColor: '#10b981',
                color: 'white',
                borderColor: '#0f172a'
            };
        }

        const unitOrdinal = unitTitle.split(':')[0];
        const isEnglish = selectedSubject.id === SubjectName.English;
        const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
        const fullTitle = `${unitOrdinal} - ${examLabel}`;
        const key = `${selectedSubject.id}_${fullTitle}`;
        const progress = userProgress.examProgresses?.[key];

        if (progress && progress.totalQuestions > 0) {
            const percentage = (progress.currentQuestionIndex / progress.totalQuestions) * 100;
            return {
                background: `linear-gradient(to top, #fbbf24 ${percentage}%, white ${percentage}%)`,
                borderColor: '#0f172a'
            };
        }
        return {};
    };

    const getComprehensiveExamStatus = () => {
        const fullTitle = selectedSubject.id === SubjectName.English ? 'Comprehensive Exam' : 'امتحان شامل';
        const results = userProgress.quizResults?.filter((r: any) => 
            r.subjectId === selectedSubject.id && r.lessonTitle.includes(fullTitle)
        ) || [];

        if (results.length === 0) return null;
        const bestScore = Math.max(...results.map(r => r.score));
        
        if (bestScore === 40) return 'perfect';
        if (bestScore >= 20) return 'passed';
        return 'failed';
    };

    const comprehensiveStatus = getComprehensiveExamStatus();

    return (
        <div className="container mx-auto p-4 max-w-2xl pt-1.5 pb-8" dir="rtl">
            <div className="flex items-stretch justify-between mb-4 px-2 gap-4 sm:gap-10">
                {/* Cover Image on the Right */}
                <div className="relative w-32 h-48 sm:w-52 sm:h-72 shrink-0 order-1">
                    <div className="w-full h-full rounded-xl overflow-hidden shadow-xl border-2 border-slate-900 relative group">
                        <img 
                            src={selectedSubject.coverImage} 
                            alt={selectedSubject.id} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer" 
                        />
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
                        <button 
                            onClick={openExternalBook}
                            className="w-14 h-14 sm:w-18 sm:h-18 bg-accent rounded-full flex items-center justify-center text-white font-black text-[9px] sm:text-xs text-center leading-tight shadow-xl border-2 border-white active:scale-90 transition-transform"
                        >
                            افتح<br/>الكتاب
                        </button>
                    </div>
                </div>

                {/* Text and Buttons on the Left */}
                <div className="flex-1 text-right min-w-0 order-2 flex flex-col justify-between py-1">
                    <div>
                        <div className="flex items-center justify-between gap-1.5">
                             <div className="flex flex-col text-right">
                                 <h2 className={`text-xl sm:text-2xl font-black text-slate-800 truncate ${selectedSubject.fontClass}`}>{selectedSubject.id}</h2>
                                 <span className="text-[10px] font-black text-primary/80">{selectedSubject.semester}</span>
                             </div>
                             <button 
                                onClick={onBack}
                                className="w-11 h-11 sm:w-14 sm:h-14 bg-white border-2 border-slate-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-slate-800 hover:bg-slate-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 flex items-center justify-center group"
                                title="رجوع"
                             >
                                {selectedSubject.id === SubjectName.English ? (
                                    <ArrowLeftIcon className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" strokeWidth={3} />
                                ) : (
                                    <ArrowRightIcon className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" strokeWidth={3} />
                                )}
                             </button>
                        </div>
                        <p className="text-slate-400/80 font-bold text-xs mt-1">تصفح الوحدات والدروس</p>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4 w-full mt-3">
                        <button 
                            onClick={() => navigateTo(View.Favorites)}
                            className="w-full bg-white p-3 sm:p-4 rounded-xl shadow-md flex items-center justify-between px-3 sm:px-6 active:scale-95 transition-transform border-2 border-slate-900"
                        >
                            <span className="font-black text-sm sm:text-lg text-slate-800 flex-1 text-center">المفضلة</span>
                            <div className="w-6 h-6 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 order-first">
                                <BookmarkIcon className="w-5 h-5 sm:w-8 sm:h-8 text-amber-500 fill-amber-500" />
                            </div>
                        </button>

                        <button 
                            onClick={handleStartComprehensiveExam}
                            className={`w-full p-3 sm:p-4 rounded-xl shadow-md flex flex-col items-center justify-center px-3 sm:px-6 active:scale-95 transition-transform border-2 border-slate-900 relative ${comprehensiveStatus === 'perfect' ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary to-secondary'}`}
                        >
                            {comprehensiveStatus === 'passed' && <span className="absolute top-1 text-[8px] sm:text-[10px] leading-tight text-white/90 font-black">ناجح</span>}
                            {comprehensiveStatus === 'failed' && <span className="absolute top-1 text-[8px] sm:text-[10px] leading-tight text-white/90 font-black">مكمل</span>}
                            <div className="flex items-center justify-between w-full">
                                <span className="font-black text-sm sm:text-lg text-white flex-1 text-center">امتحان شامل</span>
                                <div className="w-6 h-6 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 order-first">
                                    <StarIcon className="w-5 h-5 sm:w-8 sm:h-8 text-white fill-white" />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
                {selectedSubject.id === SubjectName.Arabic && selectedSubject.semester === Semester.Second ? (
                    <div className="bg-white rounded-xl p-16 text-center shadow-md border border-slate-900 flex flex-col items-center justify-center my-10">
                        <div className="text-5xl mb-4">✨</div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">قريباً...</h3>
                        <p className="text-slate-500 font-bold">نعمل حالياً على تجهيز فهرس المادة والاختبارات</p>
                    </div>
                ) : units.map((unit, uIdx) => {
                    const isExpanded = expandedUnitIndices.includes(uIdx);
                    
                    const calculateUnitProgress = (unit: Unit) => {
                        let totalExams = 0;
                        let completedExams = 0;
                        const results = userProgress.quizResults || [];

                        if (selectedSubject.id === SubjectName.Arabic || selectedSubject.id === SubjectName.English) {
                            totalExams = unit.lessons.length;
                            unit.lessons.forEach(lesson => {
                                const isPassed = results.some((r: any) => 
                                    r.subjectId === selectedSubject.id && 
                                    r.lessonTitle === lesson.title &&
                                    r.score >= 20
                                );
                                if (isPassed) completedExams++;
                            });
                        } else {
                            unit.lessons.forEach(lesson => {
                                const chunks = getLessonChunksCount(selectedSubject.id, lesson.title) || 5;
                                totalExams += chunks;
                                for (let i = 1; i <= chunks; i++) {
                                    const examLabel = selectedSubject.id === SubjectName.English ? `Exam (${i})` : `امتحان (${i})`;
                                    const fullTitle = `${lesson.title} - ${examLabel}`;
                                    const isPassed = results.some((r: any) => 
                                        r.subjectId === selectedSubject.id && 
                                        r.lessonTitle === fullTitle &&
                                        r.score >= 20
                                    );
                                    if (isPassed) completedExams++;
                                }
                            });
                            
                            // Unit exam
                            totalExams += 1;
                            const unitOrdinal = unit.title.split(':')[0];
                            const examLabel = selectedSubject.id === SubjectName.English ? 'Exam (1)' : 'امتحان (1)';
                            const unitExamTitle = `${unitOrdinal} - ${examLabel}`;
                            if (results.some((r: any) => 
                                r.subjectId === selectedSubject.id && 
                                r.lessonTitle === unitExamTitle &&
                                r.score >= 20
                            )) {
                                completedExams++;
                            }
                        }

                        return totalExams > 0 ? (completedExams / totalExams) * 100 : 0;
                    };

                    const unitProgress = calculateUnitProgress(unit);

                    return (
                        <div key={uIdx} className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-900 transition-all duration-300">
                            <button
                                onClick={() => toggleUnit(uIdx)}
                                dir={selectedSubject.id === SubjectName.English ? "ltr" : "rtl"}
                                className={`w-full p-5 flex flex-col transition-colors ${isExpanded ? 'bg-slate-50' : 'bg-white'}`}
                            >
                                <div className="w-full flex items-center justify-between">
                                    <h3 className={`text-sm sm:text-base font-black text-slate-800 flex-1 ${selectedSubject.id === SubjectName.English ? 'mr-4 text-left' : 'ml-4 text-right'}`}>{unit.title}</h3>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                                        <ChevronDownIcon className="w-6 h-6" />
                                    </div>
                                </div>
                                
                                {unitProgress > 0 && (
                                    <div className="w-full mt-3 px-1 flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${unitProgress}%` }}
                                                className="h-full bg-emerald-500"
                                            />
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-black text-emerald-600 whitespace-nowrap shrink-0">{Math.round(unitProgress)}%</span>
                                    </div>
                                )}
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 bg-slate-50/30">
                                            {(selectedSubject.id === SubjectName.Arabic || selectedSubject.id === SubjectName.English) ? (
                                                <div 
                                                    className="flex flex-wrap gap-3 justify-center py-2" 
                                                    dir={selectedSubject.id === SubjectName.English ? "ltr" : "rtl"}
                                                >
                                                    {unit.lessons.map((lesson, lIdx) => {
                                                        const status = getExamStatus(lesson.title, 1);
                                                        return (
                                                            <button
                                                                key={lIdx}
                                                                onClick={() => handleStartQuiz(lesson, undefined, unit.title)}
                                                                style={getExamProgressStyle(lesson.title, 1)}
                                                                className={`w-11 h-11 rounded-lg border-2 border-slate-900 font-black flex flex-col items-center justify-center active:scale-90 transition-transform shadow-sm relative ${getExamProgressStyle(lesson.title, 1).backgroundColor ? '' : 'text-primary bg-white hover:bg-primary hover:text-white'}`}
                                                            >
                                                                {status === "passed" && <span className="absolute top-0.5 text-[6px] leading-tight text-emerald-600 font-black">ناجح</span>}
                                                                {status === "failed" && <span className="absolute top-0.5 text-[6px] leading-tight text-red-600 font-black">مكمل</span>}
                                                                <span className="text-sm mt-0.5">{lIdx + 1}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {unit.lessons.map((lesson, lIdx) => {
                                                        const lessonKey = `${uIdx}-${lIdx}`;
                                                        const isLessonExpanded = expandedLessonKeys.includes(lessonKey);
                                                        
                                                        return (
                                                            <div key={lIdx} className="bg-white rounded-lg shadow-sm border border-slate-900 overflow-hidden transition-all">
                                                                <button
                                                                    onClick={() => toggleLesson(lessonKey)}
                                                                    className="w-full p-4 flex items-center justify-between text-right group"
                                                                >
                                                                    <div className="flex items-center gap-4 flex-1">
                                                                        <span className="font-black text-slate-700 text-sm">{lesson.title}</span>
                                                                    </div>
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isLessonExpanded ? 'bg-slate-100 text-primary rotate-180' : 'text-slate-300'}`}>
                                                                        <ChevronDownIcon className="w-5 h-5" />
                                                                    </div>
                                                                </button>

                                                                <AnimatePresence>
                                                                    {isLessonExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            className="px-5 pb-5"
                                                                        >
                                                                            <div className="flex flex-wrap gap-3 justify-center pt-2">
                                                                                {Array.from({ length: getLessonChunksCount(selectedSubject.id, lesson.title) || 5 }).map((_, i) => {
                                                                                    const status = getExamStatus(lesson.title, i + 1);
                                                                                    return (
                                                                                        <button
                                                                                            key={i}
                                                                                            onClick={() => handleStartQuiz(lesson, i, unit.title)}
                                                                                            style={getExamProgressStyle(lesson.title, i + 1)}
                                                                                            className={`w-11 h-11 rounded-lg border-2 border-slate-900 font-black flex flex-col items-center justify-center active:scale-90 transition-transform relative ${getExamProgressStyle(lesson.title, i + 1).backgroundColor ? '' : 'text-primary bg-white hover:bg-primary hover:text-white'}`}
                                                                                        >
                                                                                            {status === "passed" && <span className="absolute top-0.5 text-[6px] leading-tight text-emerald-600 font-black">ناجح</span>}
                                                                                            {status === "failed" && <span className="absolute top-0.5 text-[6px] leading-tight text-red-600 font-black">مكمل</span>}
                                                                                            <span className="text-sm mt-0.5">{i + 1}</span>
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Unit Exam Card */}
                                                    {(() => {
                                                        const status = getUnitExamStatus(unit.title);
                                                        return (
                                                            <button
                                                                 onClick={() => handleStartUnitExam(unit, uIdx)}
                                                                 style={getUnitExamProgressStyle(unit.title)}
                                                                 className={`w-full mt-3 border-2 border-slate-900 p-3.5 rounded-lg shadow-sm flex flex-col items-center justify-center px-4 active:scale-95 transition-transform group relative ${getUnitExamProgressStyle(unit.title).backgroundColor ? '' : 'bg-white hover:bg-primary'}`}
                                                             >
                                                                {status === "passed" && <span className="absolute top-1 text-[8px] leading-tight text-emerald-600 font-black group-hover:text-white">ناجح</span>}
                                                                {status === "failed" && <span className="absolute top-1 text-[8px] leading-tight text-red-600 font-black group-hover:text-white">مكمل</span>}
                                                                <span className={`font-black text-sm sm:text-base text-center mt-1 ${getUnitExamProgressStyle(unit.title).backgroundColor ? 'text-white' : 'text-primary group-hover:text-white'}`}>
                                                                    امتحان {unit.title.split(':')[0]}
                                                                </span>
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default SubjectIndexPage;

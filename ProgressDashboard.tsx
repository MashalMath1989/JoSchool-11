import React from 'react';
import { ClockIcon, TrophyIcon, CheckCircleIcon, CheckIcon, StarIcon, BookmarkIcon } from './data/Icons';
import { UserProgress } from './types';

interface ProgressDashboardProps {
    userProgress: UserProgress;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
    userProgress
}) => {
    const totalLessons = userProgress.completedLessons.length;
    const allQuizResults = userProgress.quizResults;
    const totalQuizzes = allQuizResults.length;
    
    // Calculate average percentage instead of raw score to handle different max marks
    const averagePercentage = totalQuizzes > 0 
        ? Math.round(allQuizResults.reduce((acc, r) => {
            const ratio = r.totalQuestions > 0 ? (r.score / r.totalQuestions) : 0;
            // If ratio > 1, the score was already scaled
            return acc + (ratio > 1 ? 100 : ratio * 100);
        }, 0) / totalQuizzes)
        : 0;
    
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h} ساعة و ${m} دقيقة`;
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl pt-2 text-right" dir="rtl">
            <div className="text-right mb-8 px-2">
                <h3 className="text-lg font-black text-text-main flex items-center gap-3">
                    <div className="w-2 h-10 bg-primary rounded-full"></div>
                    لوحة الإنجازات
                </h3>
                <p className="text-text-sub font-bold text-[9px] mt-1">تابع تقدمك الدراسي وتفوقك</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-primary text-center border border-slate-900">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                        <ClockIcon className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-black text-text-main leading-tight">{formatTime(userProgress.totalTimeSpent)}</div>
                    <div className="text-[9px] font-bold text-text-sub mt-1">وقت التعلم الكلي</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-accent text-center border border-slate-900">
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                        <TrophyIcon className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-black text-text-main leading-tight">{averagePercentage}%</div>
                    <div className="text-[9px] font-bold text-text-sub mt-1">معدل الإنجاز</div>
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
        </div>
    );
};

export default ProgressDashboard;

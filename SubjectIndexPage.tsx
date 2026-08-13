import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, FileText, Image as ImageIcon, X } from 'lucide-react';
import { BookOpenIcon, ChevronDownIcon, StarIcon, BookmarkIcon, RefreshIcon, ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, Loader2 } from './data/Icons';
import { Subject, Unit, Lesson, View, SubjectName, Semester, LessonResource } from './types';
import { isSubjectLoaded, getLessonChunksCount, isLessonLoaded } from './services/quizService';
import { loadCachedResources, fetchRemoteResources, fetchRemoteHistoryResources, getResourcesForLesson, getResourcesForUnit, generatePdfDownloadFileName, ResourceJsonUnit, MathBasicsItem, loadCachedMathBasics, fetchRemoteMathBasics, getYoutubeThumbnailUrl, fetchYoutubeVideoTitle } from './services/resourceService';
import { ResourceViewerModal } from './ResourceViewerModal';

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
    showNotice?: (message: string, title?: string, imageUrl?: string) => void;
    navigateTo: (view: any) => void;
    onBack: () => void;
    examsUpdatedTrigger?: number;
}

const SubjectIndexPage: React.FC<SubjectIndexPageProps> = React.memo(({
    selectedSubject,
    subjectIndexData = {},
    expandedUnitIndices,
    toggleUnit,
    expandedLessonKeys,
    toggleLesson,
    userProgress = {},
    handleStartQuiz,
    handleStartUnitExam,
    handleStartComprehensiveExam,
    openExternalBook,
    showNotice,
    navigateTo,
    onBack,
    examsUpdatedTrigger
}) => {
    const [resourcesData, setResourcesData] = React.useState<ResourceJsonUnit[]>(() => loadCachedResources(selectedSubject?.id));
    const [activeResource, setActiveResource] = React.useState<{ resource: LessonResource; lessonTitle: string; downloadFileName?: string } | null>(null);
    const [isSyncingResource, setIsSyncingResource] = React.useState<boolean>(false);
    const [showMathBasicsView, setShowMathBasicsView] = React.useState<boolean>(false);
    const [mathBasicsItems, setMathBasicsItems] = React.useState<MathBasicsItem[]>(() => loadCachedMathBasics());
    const [activeLessonVideos, setActiveLessonVideos] = React.useState<{ unitTitle: string; lessonTitle: string; videos: LessonResource[] } | null>(null);
    const [ytTitles, setYtTitles] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        if (showMathBasicsView && mathBasicsItems.length > 0) {
            mathBasicsItems.forEach(item => {
                if (item.youtubeTitle) {
                    setYtTitles(prev => ({ ...prev, [item.url]: item.youtubeTitle! }));
                } else {
                    fetchYoutubeVideoTitle(item.url).then(title => {
                        if (title) {
                            setYtTitles(prev => ({ ...prev, [item.url]: title }));
                        }
                    });
                }
            });
        }
    }, [showMathBasicsView, mathBasicsItems]);

    React.useEffect(() => {
        if (activeLessonVideos && activeLessonVideos.videos.length > 0) {
            activeLessonVideos.videos.forEach(item => {
                if (item.url) {
                    fetchYoutubeVideoTitle(item.url).then(title => {
                        if (title) {
                            setYtTitles(prev => ({ ...prev, [item.url]: title }));
                        }
                    });
                }
            });
        }
    }, [activeLessonVideos]);

    const openMathBasicsView = () => {
        setShowMathBasicsView(true);
        try {
            const currentState = window.history.state || {};
            window.history.pushState({ ...currentState, mathBasics: true }, '');
        } catch (e) {
            console.warn("pushState error:", e);
        }
    };

    const closeMathBasicsView = () => {
        if (window.history.state?.mathBasics) {
            window.history.back();
        } else {
            setShowMathBasicsView(false);
        }
    };

    const openLessonVideosView = (unitTitle: string, lessonTitle: string, videos: LessonResource[]) => {
        setActiveLessonVideos({ unitTitle, lessonTitle, videos });
        try {
            const currentState = window.history.state || {};
            window.history.pushState({ ...currentState, lessonVideos: true }, '');
        } catch (e) {
            console.warn("pushState error:", e);
        }
    };

    const closeLessonVideosView = () => {
        if (window.history.state?.lessonVideos) {
            window.history.back();
        } else {
            setActiveLessonVideos(null);
        }
    };

    const openResourceModal = (resData: { resource: LessonResource; lessonTitle: string; downloadFileName?: string }) => {
        setActiveResource(resData);
        try {
            const currentState = window.history.state || {};
            if (!currentState.activeResourceModal) {
                window.history.pushState({ ...currentState, activeResourceModal: true }, '');
            }
        } catch (e) {
            console.warn("pushState error:", e);
        }
    };

    const closeResourceModal = () => {
        if (window.history.state?.activeResourceModal) {
            window.history.back();
        } else {
            setActiveResource(null);
        }
    };

    React.useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            const state = e.state || {};

            if (!state.activeResourceModal) {
                setActiveResource(null);
            }

            if (!state.mathBasics) {
                setShowMathBasicsView(false);
            }

            if (!state.lessonVideos) {
                setActiveLessonVideos(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    React.useEffect(() => {
        if (selectedSubject?.id === SubjectName.Math && selectedSubject?.semester === Semester.First) {
            setMathBasicsItems(loadCachedMathBasics());
            fetchRemoteMathBasics().then(items => {
                if (items && items.length > 0) {
                    setMathBasicsItems(items);
                }
            }).catch(err => {
                console.warn("Math basics fetch error:", err);
            });
        }
    }, [selectedSubject]);

    React.useEffect(() => {
        let isMounted = true;
        const isSupportedSubject = (selectedSubject?.id === SubjectName.JordanHistory || selectedSubject?.id === SubjectName.Math) && selectedSubject?.semester !== Semester.Second;
        if (isSupportedSubject) {
            setResourcesData(loadCachedResources(selectedSubject.id));
            // Silent background fetch on page load
            fetchRemoteResources(selectedSubject.id).then(updated => {
                if (isMounted && updated && updated.length > 0) {
                    setResourcesData(updated);
                }
            }).catch(err => {
                console.warn("Silent resource sync failed:", err);
            });
        } else {
            setResourcesData([]);
        }
        return () => { isMounted = false; };
    }, [selectedSubject]);

    const handleResourceClick = async (
        unitTitle: string,
        lessonTitle: string,
        uIdx: number,
        lIdx: number,
        rIdx: number,
        res: LessonResource,
        unitObj?: Unit
    ) => {
        const isUnitResource = lIdx < 0;
        const initialDownloadFileName = generatePdfDownloadFileName(
            isUnitResource ? 'unit' : 'lesson',
            uIdx,
            lIdx,
            isUnitResource ? unitTitle : lessonTitle,
            res.resourceTitle,
            res.type
        );

        // Show current resource immediately so user gets fast UI feedback
        openResourceModal({ 
            resource: res, 
            lessonTitle: isUnitResource ? unitTitle : lessonTitle,
            downloadFileName: initialDownloadFileName
        });
        setIsSyncingResource(true);

        try {
            // Re-fetch latest live JSON from GitHub (with timestamp cache-buster)
            const freshUnits = await fetchRemoteResources(selectedSubject?.id);
            if (freshUnits && freshUnits.length > 0) {
                setResourcesData(freshUnits);
                const freshResources = !isUnitResource 
                    ? getResourcesForLesson(unitTitle, lessonTitle, uIdx, lIdx, freshUnits)
                    : getResourcesForUnit(unitTitle, uIdx, freshUnits, unitObj);

                if (freshResources && freshResources.length > 0) {
                    const updatedRes = freshResources[rIdx] || freshResources.find(r => r.type === res.type) || freshResources[0];
                    if (updatedRes && updatedRes.url) {
                        const updatedDownloadFileName = generatePdfDownloadFileName(
                            isUnitResource ? 'unit' : 'lesson',
                            uIdx,
                            lIdx,
                            isUnitResource ? unitTitle : lessonTitle,
                            updatedRes.resourceTitle,
                            updatedRes.type
                        );
                        openResourceModal({ 
                            resource: updatedRes, 
                            lessonTitle: isUnitResource ? unitTitle : lessonTitle,
                            downloadFileName: updatedDownloadFileName
                        });
                    }
                }
            }
        } catch (err) {
            console.warn("Live fetch on resource click error:", err);
        } finally {
            setIsSyncingResource(false);
        }
    };

    if (!selectedSubject) return null;
    
    // Try to get semester-specific data first, then fall back to generic subject data
    const semesterKey = `${selectedSubject.id}-${selectedSubject.semester}`;
    const units = (subjectIndexData && (subjectIndexData[semesterKey] || subjectIndexData[selectedSubject.id])) || [];
    
    const isArabic = selectedSubject.id === SubjectName.Arabic;
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

    if (showMathBasicsView) {
        return (
            <div className="container mx-auto max-w-2xl p-4 pt-2 pb-8" dir="rtl">
                {/* Page Header with Back Button */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-red-600 flex items-center justify-center border-2 border-slate-900 shadow-md shrink-0">
                            <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-black text-base sm:text-xl text-white leading-tight truncate">
                                حصص التأسيس - الرياضيات
                            </h2>
                            <p className="text-xs text-slate-300 font-bold mt-0.5 truncate">
                                الفصل الأول • فيديوهات التأسيس الشاملة ({mathBasicsItems.length} حصة)
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={closeMathBasicsView}
                        className="w-10 h-10 sm:w-12 sm:h-12 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white border-2 border-slate-900 rounded-xl text-slate-800 hover:bg-slate-100 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 flex items-center justify-center cursor-pointer group"
                        title="رجوع"
                    >
                        <ArrowRightIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" strokeWidth={3} />
                    </button>
                </div>

                {/* Videos Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block animate-pulse"></span>
                            قائمة فيديوهات التأسيس
                        </h3>
                        <span className="text-xs font-bold text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-lg">
                            {mathBasicsItems.length} حصة
                        </span>
                    </div>

                    {mathBasicsItems.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center text-slate-500 font-bold flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                            <span>جاري تحميل حصص التأسيس...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                            {mathBasicsItems.map((item, idx) => {
                                const thumbUrl = getYoutubeThumbnailUrl(item.url);
                                return (
                                    <button
                                        key={item.videoId || idx}
                                        onClick={() => {
                                            openResourceModal({
                                                resource: {
                                                    type: 'video',
                                                    url: item.url,
                                                    resourceTitle: item.videoTitle
                                                },
                                                lessonTitle: 'حصص التأسيس - الرياضيات (الفصل الأول)',
                                                downloadFileName: `${item.videoTitle}.mp4`
                                            });
                                        }}
                                        className="flex items-center gap-3.5 p-3.5 bg-white rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all text-right group cursor-pointer overflow-hidden"
                                    >
                                        <div className="w-28 sm:w-36 aspect-video rounded-md bg-slate-900 border border-slate-900 flex items-center justify-center shrink-0 group-hover:border-red-600 transition-colors shadow-sm overflow-hidden relative">
                                            {thumbUrl ? (
                                                <img 
                                                    src={thumbUrl} 
                                                    alt={item.videoTitle} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-red-50 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                                                    <PlayCircle className="w-7 h-7 text-red-600 group-hover:text-white transition-colors" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-slate-800 text-sm leading-snug group-hover:text-red-600 transition-colors line-clamp-1">
                                                {item.videoTitle}
                                            </h4>
                                            <p className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-700 transition-colors line-clamp-2 leading-snug mt-1" title={ytTitles[item.url] || item.youtubeTitle || item.videoTitle}>
                                                {ytTitles[item.url] || item.youtubeTitle || "فيديو شرح"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Resource Viewer Modal */}
                {activeResource && (
                    <ResourceViewerModal
                        resource={activeResource.resource}
                        lessonTitle={activeResource.lessonTitle}
                        downloadFileName={activeResource.downloadFileName}
                        isSyncing={isSyncingResource}
                        onClose={closeResourceModal}
                    />
                )}
            </div>
        );
    }

    if (activeLessonVideos) {
        return (
            <div className="container mx-auto max-w-2xl p-4 pt-2 pb-8" dir="rtl">
                {/* Page Header with Back Button */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-red-600 flex items-center justify-center border-2 border-slate-900 shadow-md shrink-0">
                            <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-black text-base sm:text-xl text-white leading-tight truncate">
                                حصص الشرح - {activeLessonVideos.lessonTitle}
                            </h2>
                            <p className="text-xs text-slate-300 font-bold mt-0.5 truncate">
                                {activeLessonVideos.unitTitle} • ({activeLessonVideos.videos.length} حصة)
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={closeLessonVideosView}
                        className="w-10 h-10 sm:w-12 sm:h-12 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white border-2 border-slate-900 rounded-xl text-slate-800 hover:bg-slate-100 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 flex items-center justify-center cursor-pointer group"
                        title="رجوع"
                    >
                        <ArrowRightIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" strokeWidth={3} />
                    </button>
                </div>

                {/* Videos Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block animate-pulse"></span>
                            قائمة فيديوهات الشرح
                        </h3>
                        <span className="text-xs font-bold text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-lg">
                            {activeLessonVideos.videos.length} حصة
                        </span>
                    </div>

                    {activeLessonVideos.videos.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center text-slate-500 font-bold">
                            لا توجد فيديوهات مجهزة لهذا الدرس حالياً
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                            {activeLessonVideos.videos.map((res, idx) => {
                                const thumbUrl = getYoutubeThumbnailUrl(res.url);
                                const videoTitle = res.resourceTitle?.trim() || `حصة شرح ${idx + 1}`;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            openResourceModal({
                                                resource: res,
                                                lessonTitle: activeLessonVideos.lessonTitle,
                                                downloadFileName: `${videoTitle}.mp4`
                                            });
                                        }}
                                        className="flex items-center gap-3.5 p-3.5 bg-white rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all text-right group cursor-pointer overflow-hidden"
                                    >
                                        <div className="w-28 sm:w-36 aspect-video rounded-md bg-slate-900 border border-slate-900 flex items-center justify-center shrink-0 group-hover:border-red-600 transition-colors shadow-sm overflow-hidden relative">
                                            {thumbUrl ? (
                                                <img 
                                                    src={thumbUrl} 
                                                    alt={videoTitle} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-red-50 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                                                    <PlayCircle className="w-7 h-7 text-red-600 group-hover:text-white transition-colors" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-slate-800 text-sm leading-snug group-hover:text-red-600 transition-colors line-clamp-1">
                                                {videoTitle}
                                            </h4>
                                            <p className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-700 transition-colors line-clamp-2 leading-snug mt-1" title={ytTitles[res.url] || videoTitle}>
                                                {ytTitles[res.url] || "فيديو شرح"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Resource Viewer Modal */}
                {activeResource && (
                    <ResourceViewerModal
                        resource={activeResource.resource}
                        lessonTitle={activeResource.lessonTitle}
                        downloadFileName={activeResource.downloadFileName}
                        isSyncing={isSyncingResource}
                        onClose={closeResourceModal}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl p-4 pt-2 pb-8" dir="rtl">
            <div className="flex items-stretch justify-between px-2 gap-4 sm:gap-8 mb-5">
                {/* Cover Image on the Right */}
                <div className="relative shrink-0 order-1 w-28 h-42 sm:w-44 sm:h-64">
                    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-900 relative group">
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
                            className="w-12 h-12 sm:w-16 sm:h-16 text-[9px] sm:text-xs bg-accent rounded-full flex items-center justify-center text-white font-black text-center leading-tight shadow-xl border-2 border-white active:scale-90 transition-transform"
                        >
                            افتح<br/>الكتاب
                        </button>
                    </div>
                </div>

                {/* Text and Buttons on the Left */}
                <div className="flex-1 text-right min-w-0 order-2 flex flex-col justify-between py-1">
                    <div>
                        <div className="flex items-center justify-between gap-2">
                             <div className="flex flex-col text-right min-w-0">
                                 <h2 className={`text-lg sm:text-2xl font-black text-slate-800 truncate ${selectedSubject.fontClass}`}>{selectedSubject.id}</h2>
                                 <span className="text-xs font-black text-primary/80">{selectedSubject.semester}</span>
                             </div>

                             {selectedSubject.id === SubjectName.Math && selectedSubject.semester === Semester.First && (
                                  <button
                                      onClick={openMathBasicsView}
                                      className="w-11 h-11 sm:w-13 sm:h-13 bg-gradient-to-b from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 flex flex-col items-center justify-center text-[11px] sm:text-xs leading-none p-1 text-center"
                                      title="حصص التأسيس"
                                  >
                                      <span>حصص</span>
                                      <span className="mt-0.5">التأسيس</span>
                                  </button>
                             )}

                             <button 
                                onClick={onBack}
                                className="w-10 h-10 sm:w-13 sm:h-13 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white border-2 border-slate-900 rounded-lg text-slate-800 hover:bg-slate-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 flex items-center justify-center group"
                                title="رجوع"
                             >
                                {selectedSubject.id === SubjectName.English ? (
                                    <ArrowLeftIcon className="w-5 h-5 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" strokeWidth={3} />
                                ) : (
                                    <ArrowRightIcon className="w-5 h-5 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" strokeWidth={3} />
                                )}
                             </button>
                        </div>
                        <p className="text-slate-400/80 font-bold text-xs mt-1">تصفح الوحدات والدروس</p>
                    </div>
                    
                    <div className="w-full space-y-2.5 sm:space-y-3.5 mt-3">
                        <button 
                            onClick={() => navigateTo(View.Favorites)}
                            className="w-full bg-white rounded-xl shadow-md flex items-center justify-between active:scale-95 transition-transform border-2 border-slate-900 p-2.5 px-4 sm:p-3.5 sm:px-6"
                        >
                            <span className="font-black text-slate-800 flex-1 text-center text-sm sm:text-base">المفضلة</span>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 order-first">
                                <BookmarkIcon className="w-5 h-5 sm:w-7 sm:h-7 text-amber-500 fill-amber-500" />
                            </div>
                        </button>

                        <button 
                            onClick={() => {
                                if (selectedSubject.semester === Semester.Second) {
                                    if (showNotice) {
                                        showNotice("عندما تقوم وزارة التربية والتعليم بإصدار نسخة الفصل الثاني لعام 2026/2027 سيتم عرض أحدث نسخة هنا", "تنبيه");
                                    } else {
                                        openExternalBook();
                                    }
                                    return;
                                }
                                handleStartComprehensiveExam();
                            }}
                            className={`w-full rounded-xl shadow-md flex flex-col items-center justify-center active:scale-95 transition-transform border-2 border-slate-900 relative p-2.5 px-4 sm:p-3.5 sm:px-6 ${comprehensiveStatus === 'perfect' ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary to-secondary'}`}
                        >
                            {comprehensiveStatus === 'passed' && <span className="absolute top-1 text-[8px] sm:text-[10px] leading-tight text-white/90 font-black">ناجح</span>}
                            {comprehensiveStatus === 'failed' && <span className="absolute top-1 text-[8px] sm:text-[10px] leading-tight text-white/90 font-black">مكمل</span>}
                            <div className="flex items-center justify-between w-full">
                                <span className="font-black text-white flex-1 text-center text-sm sm:text-base">امتحان شامل</span>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 order-first">
                                    <StarIcon className="w-5 h-5 sm:w-7 sm:h-7 text-white fill-white" />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3.5">

                {selectedSubject.semester === Semester.Second ? (
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
                                className={`w-full flex flex-col p-4 sm:p-5 transition-colors ${isExpanded ? 'bg-slate-50' : 'bg-white'}`}
                            >
                                <div className="w-full flex items-center justify-between">
                                    <h3 className={`text-sm sm:text-base font-black text-slate-800 flex-1 ${selectedSubject.id === SubjectName.English ? 'mr-4 text-left' : 'ml-4 text-right'}`}>{unit.title}</h3>
                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                                        <ChevronDownIcon className="w-5 h-5 sm:w-6 sm:h-6" />
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
                                            {unit.lessons.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 text-center bg-amber-50/80 border border-dashed border-amber-300 rounded-xl w-full my-2" dir="rtl">
                                                    <span className="text-2xl">⏳</span>
                                                    <span className="text-sm font-black text-amber-900">امتحانات هذه الوحدة قيد التحضير</span>
                                                    <span className="text-xs text-amber-700 font-bold">سيتم إتاحة امتحانات المنهاج الجديد فور اكتمالها</span>
                                                </div>
                                            ) : (selectedSubject.id === SubjectName.Arabic || selectedSubject.id === SubjectName.English) ? (
                                                <div 
                                                    className="grid grid-cols-5 gap-2.5 sm:gap-3 max-w-[280px] mx-auto justify-items-center py-2" 
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
                                                        const lessonKey = `${uIdx}_${lesson.title}`;
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
                                                                            <div className="flex flex-col items-center justify-center py-2 w-full">
                                                                                <div className="grid grid-cols-5 gap-2.5 sm:gap-3 max-w-[280px] mx-auto justify-items-center pt-2">
                                                                                    {Array.from({ length: getLessonChunksCount(selectedSubject.id, lesson.title) || 1 }).map((_, i) => {
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

                                                                                {/* Lesson Resources Grid (RTL Organized Compact Grid) */}
                                                                                {(() => {
                                                                                    const isSupportedSubject = (selectedSubject?.id === SubjectName.JordanHistory || selectedSubject?.id === SubjectName.Math) && selectedSubject?.semester !== Semester.Second;

                                                                                    const lessonResources = isSupportedSubject ? getResourcesForLesson(
                                                                                        unit.title,
                                                                                        lesson.title,
                                                                                        uIdx,
                                                                                        lIdx,
                                                                                        resourcesData
                                                                                    ) : [];

                                                                                    if (!lessonResources || lessonResources.length === 0) {
                                                                                        return (
                                                                                            <div className="w-full mt-2.5 pt-2 border-t border-slate-200/80 text-center" dir="rtl">
                                                                                                <span className="inline-block text-[11px] sm:text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                                                                                                    يتم توفير ملخصات وشرح الدروس أولا بأول
                                                                                                </span>
                                                                                            </div>
                                                                                        );
                                                                                    }

                                                                                    const videoResources = lessonResources.filter(r => r.type === 'video');
                                                                                    const nonVideoResources = lessonResources.filter(r => r.type !== 'video');

                                                                                    return (
                                                                                        <div className="w-full mt-2.5 pt-2 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-1.5" dir="rtl">
                                                                                            {videoResources.length > 0 && (
                                                                                                <button
                                                                                                    onClick={() => openLessonVideosView(unit.title, lesson.title, videoResources)}
                                                                                                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg border-2 border-slate-900 bg-red-600 hover:bg-red-700 text-white font-black text-xs active:scale-95 transition-all shadow-2xs group cursor-pointer"
                                                                                                >
                                                                                                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0">
                                                                                                        <PlayCircle className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                                                                                                    </div>
                                                                                                    <span className="truncate text-right flex-1 text-[11px] leading-tight">حصص الشرح</span>
                                                                                                </button>
                                                                                            )}

                                                                                            {nonVideoResources.map((res, rIdx) => {
                                                                                                const resTitle = res.resourceTitle?.trim() 
                                                                                                    ? res.resourceTitle 
                                                                                                    : res.type === 'pdf' 
                                                                                                        ? 'ملخص PDF' 
                                                                                                        : 'ملخص مصور';

                                                                                                return (
                                                                                                    <button
                                                                                                        key={rIdx}
                                                                                                        onClick={() => handleResourceClick(unit.title, lesson.title, uIdx, lIdx, rIdx, res)}
                                                                                                        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-900 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-2xs text-slate-800 font-bold text-xs group cursor-pointer"
                                                                                                    >
                                                                                                        <div className="w-4 h-4 rounded flex items-center justify-center shrink-0">
                                                                                                            {res.type === 'pdf' && <FileText className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />}
                                                                                                            {res.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />}
                                                                                                        </div>
                                                                                                        <span className="truncate text-right flex-1 text-[11px] leading-tight">{resTitle}</span>
                                                                                                    </button>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    );
                                                                                })()}
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

                                            {/* Unit Resources Section (RTL Grid Layout) */}
                                            {(() => {
                                                const isSupportedSubject = (selectedSubject?.id === SubjectName.JordanHistory || selectedSubject?.id === SubjectName.Math) && selectedSubject?.semester === Semester.First;
                                                if (!isSupportedSubject) {
                                                    return null;
                                                }

                                                const unitResources = getResourcesForUnit(unit.title, uIdx, resourcesData, unit);
                                                if (!unitResources || unitResources.length === 0) return null;

                                                const videoResources = unitResources.filter(r => r.type === 'video');
                                                const nonVideoResources = unitResources.filter(r => r.type !== 'video');

                                                return (
                                                    <div className="w-full mt-3 pt-2.5 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-1.5" dir="rtl">
                                                        {videoResources.length > 0 && (
                                                            <button
                                                                onClick={() => openLessonVideosView(unit.title, `شرح ${unit.title}`, videoResources)}
                                                                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-slate-900 bg-red-600 hover:bg-red-700 text-white font-black text-xs active:scale-95 transition-all shadow-2xs group cursor-pointer"
                                                            >
                                                                <div className="w-4 h-4 rounded flex items-center justify-center shrink-0">
                                                                    <PlayCircle className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                                                                </div>
                                                                <span className="truncate text-right flex-1 text-[11px] leading-tight">حصص الشرح</span>
                                                            </button>
                                                        )}

                                                        {nonVideoResources.map((res, rIdx) => {
                                                            const resTitle = res.resourceTitle?.trim() 
                                                                ? res.resourceTitle 
                                                                : res.type === 'pdf' 
                                                                    ? 'ملخص الوحدة PDF' 
                                                                    : 'خريطة ذهنية للوحدة';

                                                            return (
                                                                <button
                                                                    key={rIdx}
                                                                    onClick={() => handleResourceClick(unit.title, resTitle, uIdx, -1, rIdx, res, unit)}
                                                                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-900 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-2xs text-slate-800 font-bold text-xs group cursor-pointer"
                                                                >
                                                                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0">
                                                                        {res.type === 'pdf' && <FileText className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />}
                                                                        {res.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />}
                                                                    </div>
                                                                    <span className="truncate text-right flex-1 text-[11px] leading-tight">{resTitle}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {activeResource && (
                <ResourceViewerModal
                    resource={activeResource.resource}
                    lessonTitle={activeResource.lessonTitle}
                    downloadFileName={activeResource.downloadFileName}
                    isSyncing={isSyncingResource}
                    onClose={() => setActiveResource(null)}
                />
            )}
        </div>
    );
});

export default SubjectIndexPage;

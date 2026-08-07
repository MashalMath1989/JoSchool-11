import React from 'react';
import { motion } from 'framer-motion';
import { View } from './types';
import { ArrowRightIcon } from './data/Icons';

interface SessionsListPageProps {
    navigateTo: (view: View, subject?: any, title?: string) => void;
    onBack: () => void;
}

const SessionsListPage: React.FC<SessionsListPageProps> = ({ navigateTo, onBack }) => {
    return (
        <div className="container mx-auto p-4 max-w-2xl pt-2 text-right animate-fade-in" dir="rtl">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
                <div>
                    <h3 className="text-xl font-black text-slate-950 flex items-center gap-3">
                        <div className="w-2.5 h-10 bg-primary rounded-full"></div>
                        الدورات والامتحانات الوزارية
                    </h3>
                    <p className="text-slate-500 font-extrabold text-[10px] mt-1">اختر الدورة أو الامتحان لتصفح الأسئلة وحل النماذج الرسمية</p>
                </div>
                <button 
                    onClick={onBack}
                    className="w-11 h-11 sm:w-14 sm:h-14 bg-white border-2 border-slate-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-slate-800 hover:bg-slate-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 flex items-center justify-center group"
                    title="رجوع"
                >
                    <ArrowRightIcon className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" strokeWidth={3} />
                </button>
            </div>

            {/* Courses/Sessions Cards Grid */}
            <div className="space-y-4">
                {/* الدورة التجريبية */}
                <div
                    onClick={() => navigateTo(View.SessionSubjects, undefined, 'الدورة التجريبية')}
                    className="bg-white rounded-2xl p-5 shadow-md border-r-[6px] border-yellow-400 border-l border-t border-b border-slate-900 flex items-center justify-between cursor-pointer transition-all duration-100 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.99] hover:shadow-lg group touch-manipulation"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center border border-yellow-200 select-none overflow-hidden p-1">
                            <img 
                                src="https://i.postimg.cc/GtXVRVcp/IMG-20260704-001239-098.png" 
                                alt="App Logo" 
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <div className="text-right">
                            <h4 className="font-black text-slate-900 text-base group-hover:text-primary transition-colors">الدورة التجريبية</h4>
                            <p className="text-slate-500 font-bold text-xs mt-0.5">امتحانات تجريبية تحاكي نمط الوزارة المقترح للتدريب والتقييم.</p>
                        </div>
                    </div>
                </div>

                {/* دورة 2008 */}
                <div
                    onClick={() => navigateTo(View.SessionSubjects, undefined, 'دورة 2008')}
                    className="bg-white rounded-2xl p-5 shadow-md border-r-[6px] border-sky-400 border-l border-t border-b border-slate-900 flex items-center justify-between cursor-pointer transition-all duration-100 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.99] hover:shadow-lg group touch-manipulation"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-200 select-none overflow-hidden p-1">
                            <img 
                                src="https://i.postimg.cc/XvYQrc5C/FB-IMG-1780984890803.jpg" 
                                alt="2008 Session" 
                                className="w-full h-full object-cover rounded-lg"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <div className="text-right">
                            <h4 className="font-black text-slate-900 text-base group-hover:text-primary transition-colors">دورة 2008</h4>
                            <p className="text-slate-500 font-bold text-xs mt-0.5">امتحانات دورة الوزارة العادية لجيل 2008 مع الإجابات النموذجية.</p>
                        </div>
                    </div>
                </div>

                {/* دورة 2008 تكميلي */}
                <div
                    onClick={() => navigateTo(View.SessionSubjects, undefined, 'دورة 2008 تكميلي')}
                    className="bg-white rounded-2xl p-5 shadow-md border-r-[6px] border-purple-400 border-l border-t border-b border-slate-900 flex items-center justify-between cursor-pointer transition-all duration-100 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.99] hover:shadow-lg group touch-manipulation"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-200 select-none overflow-hidden p-1">
                            <img 
                                src="https://i.postimg.cc/XvYQrc5C/FB-IMG-1780984890803.jpg" 
                                alt="2008 Supplementary Session" 
                                className="w-full h-full object-cover rounded-lg"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <div className="text-right">
                            <h4 className="font-black text-slate-900 text-base group-hover:text-primary transition-colors">دورة 2008 تكميلي</h4>
                            <p className="text-slate-500 font-bold text-xs mt-0.5">امتحانات دورة الوزارة التكميلية لجيل 2008 مع الإجابات النموذجية.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Aesthetic tip/indicator at bottom */}
            <div className="mt-8 bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
                <span className="text-sm select-none">💡</span>
                <div className="space-y-0.5 text-right">
                    <h4 className="text-xs font-black text-slate-800">التدريب الوزاري المكثف</h4>
                    <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                        حل الأسئلة الوزارية السابقة يمنحك مهارة إدارة الوقت الكافية والقدرة على فهم الهيكل الأساسي للأسئلة المعتمدة للثانوية العامة.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SessionsListPage;

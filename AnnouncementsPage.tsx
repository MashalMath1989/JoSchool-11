import React from 'react';
import { motion } from 'framer-motion';
import { BellOff, Newspaper } from 'lucide-react';

interface AnnouncementsPageProps {
    goBack?: () => void;
}

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = () => {
    return (
        <div className="container mx-auto p-4 max-w-2xl pt-2 text-right animate-fade-in" dir="rtl">
            {/* Title Section */}
            <div className="text-right mb-6 px-2 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-text-main flex items-center gap-3">
                        <div className="w-2 h-10 bg-primary rounded-full"></div>
                        لوحة الإعلانات والأخبار
                    </h3>
                    <p className="text-text-sub font-bold text-[9px] mt-1">آخر الأخبار والتعميمات الرسمية لطلبة الثاني عشر والحادي عشر</p>
                </div>
            </div>

            {/* Empty State Container */}
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-md border border-slate-900 p-8 text-center my-6 flex flex-col items-center justify-center space-y-4 min-h-[280px]"
            >
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-slate-900 flex items-center justify-center text-amber-500 shadow-sm">
                    <BellOff className="w-8 h-8" />
                </div>

                <div className="space-y-1.5 max-w-sm">
                    <h4 className="text-base font-black text-slate-900">لا توجد إعلانات حالياً</h4>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed">
                        سيتم نشر أحدث الأخبار والتعميمات الرسمية لوزارة التربية والتعليم والامتحانات هنا فور صدورها.
                    </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-bold">
                    <Newspaper className="w-3.5 h-3.5 text-primary" />
                    <span>تابع المنصة بانتظام للتحديثات الجديدة</span>
                </div>
            </motion.div>
        </div>
    );
};

export default AnnouncementsPage;


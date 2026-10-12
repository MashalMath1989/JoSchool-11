import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Trash2, 
    ShieldCheck, 
    Mail, 
    ArrowRight, 
    AlertTriangle, 
    CheckCircle2, 
    Database, 
    Clock, 
    User, 
    HelpCircle,
    Smartphone,
    Lock
} from 'lucide-react';
import { LOGO_DATA_URI } from './logoDataUri';

export const DeleteAccountInfoPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-red-500 selection:text-white" dir="rtl">
            {/* الشريط العلوي */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
                <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-900 p-1 flex items-center justify-center shadow-xs">
                            <img src={LOGO_DATA_URI} alt="JoSchool11" className="w-full h-auto object-contain" />
                        </div>
                        <div>
                            <h1 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                                منصة JoSchool 11
                            </h1>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-bold">
                                دليل وسياسة حذف الحساب وبيانات المستخدم
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/"
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                        <span>العودة للتطبيق</span>
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </Link>
                </div>
            </header>

            {/* المحتوى الرئيسي */}
            <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
                {/* البطاقة الترحيبية ورأس الصفحة */}
                <div className="bg-gradient-to-br from-white via-red-50/20 to-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-black mb-4 border border-red-200">
                            <ShieldCheck className="w-4 h-4 text-red-600" />
                            <span>متوافق مع سياسات بيانات المستخدم لمتجر Google Play</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-3">
                            كيفية حذف حسابك وبياناتك في تطبيق JoSchool 11
                        </h2>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-bold">
                            نحن في تطبيق JoSchool 11 نحترم خصوصية طلابنا تماماً. نمنحك التحكم الكامل في حسابك وبياناتك، ويمكنك في أي وقت حذف حسابك وجميع سجلاتك الدراسية نهائياً إما مباشرة من داخل التطبيق أو عبر مراسلتنا.
                        </p>
                    </div>
                </div>

                {/* القسم 1: أنواع البيانات التي يتم حذفها */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-base text-slate-900">
                                ما هي البيانات التي يتم حذفها عند طلب الحذف؟
                            </h3>
                            <p className="text-xs text-slate-500 font-bold">
                                يتم مسح كافة السجلات الرقمية المرتبطة بمعرّف المستخدم (UID)
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                            <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                                <User className="w-4 h-4 text-red-500" />
                                <span>بيانات الحساب الشخصي</span>
                            </div>
                            <p className="text-xs text-slate-600 font-bold leading-relaxed pr-6">
                                البريد الإلكتروني، الاسم، رقم الجلوس، رقم الهاتف، ومعلومات المصادقة في Firebase Authentication.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                            <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                                <CheckCircle2 className="w-4 h-4 text-red-500" />
                                <span>التقدم الدراسي ونتائج الاختبارات</span>
                            </div>
                            <p className="text-xs text-slate-600 font-bold leading-relaxed pr-6">
                                سجلات حل الامتحانات، نسب النجاح، الدروس المكتملة، وإحصائيات الدراسة المخزنة في Firestore.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                            <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                                <CheckCircle2 className="w-4 h-4 text-red-500" />
                                <span>الأسئلة المفضلة والملاحظات</span>
                            </div>
                            <p className="text-xs text-slate-600 font-bold leading-relaxed pr-6">
                                بنك الأسئلة المميزة والمحفوظة للمراجعة وسجلات التفاعل الأكاديمي.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                            <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                                <Clock className="w-4 h-4 text-red-500" />
                                <span>سياسة الاحتفاظ الفوري</span>
                            </div>
                            <p className="text-xs text-slate-600 font-bold leading-relaxed pr-6">
                                الحذف فوري ونهائي (Permanent Deletion). لا نحتفظ بأي نسخ احتياطية للمستخدمين المحذوفين.
                            </p>
                        </div>
                    </div>
                </section>

                {/* القسم 2: خطوات الحذف خطوة بخطوة من داخل التطبيق */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-base text-slate-900">
                                الطريقة الأولى: حذف الحساب مباشرة من داخل التطبيق
                            </h3>
                            <p className="text-xs text-slate-500 font-bold">
                                أسرع طريقة وأكثرها أماناً، تتم في ثوانٍ معدودة
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* خطوة 1 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                1
                            </div>
                            <div>
                                <h4 className="font-black text-sm text-slate-900 mb-0.5">
                                    افتح التطبيق وسجل الدخول
                                </h4>
                                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                    قم بتسجيل الدخول إلى حسابك في تطبيق JoSchool11 باستخدام بريدك الإلكتروني وكلمة المرور أو حساب Google.
                                </p>
                            </div>
                        </div>

                        {/* خطوة 2 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                2
                            </div>
                            <div>
                                <h4 className="font-black text-sm text-slate-900 mb-0.5">
                                    انتقل إلى صفحة الملف الشخصي (ملفي)
                                </h4>
                                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                    اضغط على زر القائمة في أعلى الصفحة ثم اختر <b>«ملفي»</b> أو اضغط على اسمك/صورتك الرمزية أعلى الشاشة.
                                </p>
                            </div>
                        </div>

                        {/* خطوة 3 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                3
                            </div>
                            <div>
                                <h4 className="font-black text-sm text-slate-900 mb-0.5">
                                    توجه إلى أسفل الصفحة واضغط على زر «حذف الحساب»
                                </h4>
                                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                    في قسم الملف الشخصي، ستجد قسماً باللون الأحمر بعنوان <b>«منطقة إدارة الحساب»</b>، اضغط على زر <b>«حذف الحساب»</b>.
                                </p>
                            </div>
                        </div>

                        {/* خطوة 4 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                4
                            </div>
                            <div>
                                <h4 className="font-black text-sm text-slate-900 mb-0.5">
                                    تأكيد الهوية بكلمة المرور أو Google
                                </h4>
                                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                    لأسباب أمنية مشددة، ستطلب منك النافذة المنبثقة إدخال كلمة المرور الخاصة بحسابك (أو تأكيد المصادقة عبر نافذة Google المنبثقة) للتحقق من أنك صاحب الحساب الحقيقي.
                                </p>
                            </div>
                        </div>

                        {/* خطوة 5 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-50/70 border border-red-200">
                            <div className="w-7 h-7 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                5
                            </div>
                            <div>
                                <h4 className="font-black text-sm text-red-950 mb-0.5">
                                    التأكيد النهائي وحذف البيانات
                                </h4>
                                <p className="text-xs text-red-800 font-bold leading-relaxed">
                                    اضغط على زر <b>«تأكيد الحذف نهائياً»</b>. سيقوم النظام بحذف وثيقة بياناتك من Firestore فوراً، ثم حذف حساب تسجيل الدخول نهائياً وتوجيهك إلى صفحة البداية مع رسالة تأكيد.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* القسم 3: طلب الحذف بدون الدخول للتطبيق */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-base text-slate-900">
                                الطريقة الثانية: طلب حذف الحساب عبر البريد الإلكتروني
                            </h3>
                            <p className="text-xs text-slate-500 font-bold">
                                مخصص للطلاب الذين فقدوا الوصول لحساباتهم أو قاموا بإلغاء تثبيت التطبيق
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 font-bold space-y-2 leading-relaxed">
                        <p>
                            إذا لم تتمكن من تسجيل الدخول إلى التطبيق أو واجهت أي صعوبة، يمكنك إرسال طلب حذف مباشر إلى فريق الدعم والمطور المسؤول عبر البريد الإلكتروني:
                        </p>
                        <div className="p-3 bg-white rounded-xl border border-slate-300 font-mono text-slate-900 text-xs select-all text-left flex items-center justify-between">
                            <span className="font-bold">mechail.sbeatan1@gmail.com</span>
                            <span className="text-[10px] text-slate-400 font-sans font-bold">البريد المعتمد</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 pt-1">
                            <li>موضوع الرسالة: <b>طلب حذف حساب JoSchool11</b></li>
                            <li>تضمين البريد الإلكتروني المسجل في التطبيق لتحديد الحساب بدقة.</li>
                            <li>تتم معالجة الطلب وحذف كافة السجلات بشكل كامل خلال مدة لا تتجاوز <b>48 ساعة عمل</b> مع إشعارك بتأكيد الحذف.</li>
                        </ul>
                    </div>

                    <div className="pt-2 text-center sm:text-right">
                        <a
                            href="mailto:mechail.sbeatan1@gmail.com?subject=%D8%B7%D9%84%D8%A8%20%D8%AD%D8%B0%D9%81%20%D8%AD%D8%B3%D8%A7%D8%A8%20JoSchool11&body=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%0A%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%AD%D8%B0%D9%81%20%D8%AD%D8%B3%D8%A7%D8%A8%D9%8A%20%D9%88%D8%AC%D9%85%D9%8A%D8%B9%20%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA%D9%8A%20%D9%85%D9%86%20%D8%AA%D8%B7%D8%A8%D9%8A%D9%82%20JoSchool11.%0A%0A%D8%A7%D9%84%D8%A8%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D9%85%D8%B3%D8%AC%D9%84%3A%20"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                            <Mail className="w-4 h-4" />
                            <span>إرسال طلب حذف الحساب عبر البريد</span>
                        </a>
                    </div>
                </section>

                {/* القسم 4: الأسئلة الشائعة */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-base text-slate-900">
                                أسئلة شائعة حول حذف الحساب
                            </h3>
                            <p className="text-xs text-slate-500 font-bold">
                                معلومات هامة يجب معرفتها قبل الحذف
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 text-xs font-bold leading-relaxed">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                            <p className="font-black text-slate-900 mb-1">
                                هل يمكن استرجاع حسابي بعد حذفه؟
                            </p>
                            <p className="text-slate-600">
                                لا، عملية الحذف نهائية وغير قابلة للاسترجاع. إذا أردت استخدام التطبيق مجدداً، سيتعين عليك إنشاء حساب جديد كلياً والبدء من جديد.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                            <p className="font-black text-slate-900 mb-1">
                                هل يتم الاحتفاظ بأي بيانات بعد الحذف؟
                            </p>
                            <p className="text-slate-600">
                                لا يتم الاحتفاظ بأي سجلات أو معلومات شخصية. يتم مسح مستندك في Firestore وحسابك في Firebase Auth بشكل لحظي وفوري.
                            </p>
                        </div>
                    </div>
                </section>

                {/* تذييل الصفحة */}
                <footer className="text-center py-6 text-xs font-bold text-slate-400 space-y-2">
                    <p>© {new Date().getFullYear()} JoSchool 11 - منصة الأول ثانوي (المسار الأكاديمي، جيل 2010). جميع الحقوق محفوظة.</p>
                    <p>مطابق لسياسات خصوصية متجر Google Play (Google Play Data Safety Policy).</p>
                </footer>
            </main>
        </div>
    );
};

export default DeleteAccountInfoPage;

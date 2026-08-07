import React, { forwardRef } from 'react';
import { Question } from './types';
import { MathRenderer, renderTextWithUnderline } from './textRenderer';
import TrigGraph from './TrigGraph';
import { KATEX_CSS } from './katexCss';
import { LOGO_DATA_URI } from './logoDataUri';

interface QuestionCardVisualProps {
  question: Question;
  subjectName?: string;
  lessonTitle?: string;
  isEnglish?: boolean;
  includeAnswer?: boolean;
}

export const QuestionCardVisual = forwardRef<HTMLDivElement, QuestionCardVisualProps>(({
  question,
  subjectName,
  lessonTitle,
  isEnglish = false,
  includeAnswer = false,
}, ref) => {
  const isMathSubject =
    subjectName?.includes('رياضيات') ||
    subjectName?.toLowerCase().includes('math') ||
    (question && (
      (question as any).subjectId === 'math' ||
      (question as any).subjectId?.includes('math') ||
      (question as any).subjectId?.includes('رياضيات') ||
      (question as any).questionGraph ||
      (question as any).graph ||
      (question.question && (question.question.includes('\\') || question.question.includes('$')))
    ));

  const isCardLtr = Boolean(isEnglish);
  const optionLabels = (isCardLtr || isMathSubject) ? ['A', 'B', 'C', 'D', 'E'] : ['أ', 'ب', 'ج', 'د', 'هـ'];

  const getSubjectBadge = () => {
    const s = subjectName?.trim() || '';
    if (s.includes('رياضيات') || s.toLowerCase().includes('math')) {
      return 'سؤال رياضيات 📝';
    }
    if (s.includes('تاريخ')) {
      return 'سؤال تاريخ الأردن 📝';
    }
    if (s.includes('إسلامية')) {
      return 'سؤال تربية إسلامية 📝';
    }
    if (s.includes('عربية')) {
      return 'سؤال لغة عربية 📝';
    }
    if (s.includes('إنجليزية') || s.toLowerCase().includes('english')) {
      return 'سؤال لغة إنجليزية 📝';
    }
    if (s) {
      let cleanName = s;
      if (cleanName === 'الرياضيات') cleanName = 'رياضيات';
      else if (cleanName === 'التربية الإسلامية') cleanName = 'تربية إسلامية';
      else if (cleanName === 'اللغة العربية') cleanName = 'لغة عربية';
      else if (cleanName === 'اللغة الإنجليزية') cleanName = 'لغة إنجليزية';
      else if (cleanName.startsWith('ال') && cleanName.length > 3 && !cleanName.includes(' ')) {
        cleanName = cleanName.slice(2);
      }
      return `سؤال ${cleanName} 📝`;
    }
    if (isMathSubject) {
      return 'سؤال رياضيات 📝';
    }
    return 'سؤال امتحاني 📝';
  };

  return (
    <div
      ref={ref}
      dir={isCardLtr ? 'ltr' : 'rtl'}
      className="w-[620px] bg-white text-slate-800 p-7 relative overflow-hidden rounded-2xl border-2 border-slate-200/90 shadow-xl flex flex-col gap-5"
      style={{
        fontFamily: isCardLtr ? "'Poppins', system-ui, sans-serif" : "'Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', serif",
      }}
    >
      <style>{`
        ${KATEX_CSS}

        .font-naskh {
          font-family: 'Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', serif !important;
        }
        .font-sans {
          font-family: 'Poppins', system-ui, sans-serif !important;
        }
        .ltr-math {
          direction: ltr !important;
          unicode-bidi: isolate !important;
          display: inline-block;
          max-width: 100%;
          overflow: visible !important;
          vertical-align: middle;
          padding: 0 3px;
        }
        .katex {
          font-size: 1.15em !important;
          line-height: 1.35 !important;
          font-weight: normal !important;
          direction: ltr !important;
          unicode-bidi: isolate !important;
        }
        .katex-display {
          margin: 0.5em 0 !important;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .katex-html {
          direction: ltr !important;
          unicode-bidi: isolate !important;
          display: inline-block !important;
          white-space: nowrap !important;
        }
        .katex .base {
          direction: ltr !important;
          unicode-bidi: isolate !important;
          display: inline-flex !important;
          align-items: center !important;
          white-space: nowrap !important;
        }
      `}</style>

      {/* Top Gradient Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 pointer-events-none" />

      {/* Decorative Subtle Background Accents */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 pt-1 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white p-1 shadow-md border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={LOGO_DATA_URI}
              alt="JoSchool11"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-base">JoSchool11</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                جيل 2010
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-0.5">
              {subjectName && <span>📌 {subjectName}</span>}
              {subjectName && lessonTitle && <span>•</span>}
              {lessonTitle && <span>📖 {lessonTitle}</span>}
            </div>
          </div>
        </div>

        <div className="px-3 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-black border border-slate-200">
          {getSubjectBadge()}
        </div>
      </div>

      {/* Question Text */}
      <div
        className={`text-lg font-black text-slate-900 leading-relaxed relative z-10 ${
          isCardLtr ? 'text-left font-sans' : 'text-right font-naskh'
        }`}
        dir={isCardLtr ? 'ltr' : 'rtl'}
      >
        <MathRenderer text={question.question} />
      </div>

      {/* Question Graph if present */}
      {((question as any).questionGraph || (question as any).graph) && (
        <div className="w-full max-w-[320px] h-[205px] mx-auto bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex justify-center items-center relative z-10 my-2 shadow-sm">
          <TrigGraph graphData={(question as any).questionGraph || (question as any).graph} />
        </div>
      )}

      {/* Choices */}
      <div className="grid grid-cols-1 gap-2.5 relative z-10">
        {question.choices &&
          question.choices.map((choice, idx) => {
            const label = optionLabels[idx] || (idx + 1).toString();
            const option = (question as any).options && (question as any).options[idx];
            const optionGraph = option && option.graph;
            const isCorrect = includeAnswer && choice.trim() === question.correct_answer?.trim();

            return (
              <div
                key={idx}
                dir={isMathSubject || isCardLtr ? 'ltr' : 'rtl'}
                className={`p-3.5 rounded-2xl font-bold text-sm flex items-center gap-3.5 border transition-all ${
                  isCorrect
                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-sm'
                    : 'bg-slate-50/80 border-slate-200 text-slate-800'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs border-2 ${
                    isCorrect
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {label}
                </div>
                {optionGraph ? (
                  <div className="flex-1 flex justify-center items-center h-[105px] max-w-[160px] mx-auto">
                    <TrigGraph graphData={optionGraph} isOption={true} />
                  </div>
                ) : (
                  <div className={`flex-1 min-w-0 ${isMathSubject || isCardLtr ? 'text-left font-sans' : 'text-right font-naskh'}`}>
                    <MathRenderer text={choice} />
                  </div>
                )}
                {isCorrect && (
                  <span className="text-[11px] font-black bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shrink-0">
                    الإجابة الصحيحة ✅
                  </span>
                )}
              </div>
            );
          })}
      </div>

      {/* Answer Explanation if enabled */}
      {includeAnswer && question.explanation && (
        <div className="bg-amber-50/90 border-2 border-amber-200/90 rounded-2xl p-4.5 relative z-10" dir={isCardLtr ? 'ltr' : 'rtl'}>
          <div className="flex items-center gap-2 mb-2 text-amber-900 font-black text-sm">
            <span className="w-6 h-6 rounded-lg bg-amber-200/80 flex items-center justify-center text-xs">💡</span>
            <span>{isCardLtr ? 'Explanation:' : 'الشرح والتبسيط:'}</span>
          </div>
          <div className={`leading-relaxed text-sm font-bold text-slate-800 ${isCardLtr ? 'text-left font-sans' : 'text-right font-naskh'}`}>
            <MathRenderer text={question.explanation} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 relative z-10">
        <span>🎓 تطبيق JoSchool11 لطلاب التوجيهي (جيل 2010)</span>
        <span>استعد للامتحانات الوزارية بثقة 🚀</span>
      </div>
    </div>
  );
});

QuestionCardVisual.displayName = 'QuestionCardVisual';

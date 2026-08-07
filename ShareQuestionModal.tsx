import React, { useState, useRef, useEffect } from 'react';
import { Question } from './types';
import { XIcon, ShareIcon, DownloadIcon } from './data/Icons';
import { formatQuestionText, generateQuestionCardBlob, generateQuestionCardDataUrl } from './shareUtils';
import { QuestionCardVisual } from './QuestionCardVisual';

interface ShareQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  subjectName?: string;
  lessonTitle?: string;
  isEnglish?: boolean;
}

export const ShareQuestionModal: React.FC<ShareQuestionModalProps> = ({
  isOpen,
  onClose,
  question,
  subjectName,
  lessonTitle,
  isEnglish = false,
}) => {
  const [includeAnswer, setIncludeAnswer] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && question) {
      let isMounted = true;
      setIsGeneratingImage(true);

      generateQuestionCardDataUrl({
        question,
        subjectName,
        lessonTitle,
        isEnglish,
        includeAnswer,
      }).then((dataUrl) => {
        if (isMounted) {
          setPreviewDataUrl(dataUrl);
          setIsGeneratingImage(false);
        }
      });

      return () => {
        isMounted = false;
      };
    } else {
      setPreviewDataUrl(null);
    }
  }, [isOpen, question, subjectName, lessonTitle, isEnglish, includeAnswer]);

  if (!isOpen || !question) return null;

  const formattedText = formatQuestionText(question, subjectName, lessonTitle, isEnglish, includeAnswer);

  const handleShareImage = async () => {
    setIsGeneratingImage(true);
    try {
      let blob: Blob | null = null;
      if (previewDataUrl) {
        try {
          const res = await fetch(previewDataUrl);
          blob = await res.blob();
        } catch (e) {
          blob = null;
        }
      }
      
      if (!blob) {
        blob = await generateQuestionCardBlob({
          question,
          subjectName,
          lessonTitle,
          isEnglish,
          includeAnswer,
        });
      }

      if (!blob) throw new Error('Could not generate card image');

      const file = new File([blob], 'joschool-question.png', { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'سؤال من JoSchool11',
          text: formattedText,
          files: [file],
        });
      } else if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'سؤال من JoSchool11',
          text: formattedText,
        });
      } else {
        await handleDownloadImage();
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Share image fallback trigger:', err?.message || err);
        handleDownloadImage();
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = async () => {
    setIsGeneratingImage(true);
    try {
      let blob: Blob | null = null;
      if (previewDataUrl) {
        try {
          const res = await fetch(previewDataUrl);
          blob = await res.blob();
        } catch (e) {
          blob = null;
        }
      }

      if (!blob) {
        blob = await generateQuestionCardBlob({
          question,
          subjectName,
          lessonTitle,
          isEnglish,
          includeAnswer,
        });
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `joschool-question-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.warn('Download image failed:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShareWhatsApp = () => {
    const encodedText = encodeURIComponent(formattedText);
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `whatsapp://send?text=${encodedText}`;
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fast-fade"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-[2rem] p-4 sm:p-6 shadow-2xl border border-slate-100 relative overflow-hidden max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <ShareIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">مشاركة بطاقة السؤال</h3>
              <p className="text-xs font-bold text-slate-400">شارك بطاقة السؤال كصورة مصممة بأناقة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            title="إغلاق"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-3 flex-1 flex flex-col justify-between overflow-hidden">
          
          {/* Card Preview Area */}
          <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200 flex flex-col items-center justify-center min-h-[180px] max-h-[240px] relative overflow-hidden shadow-inner flex-1">
            {isGeneratingImage && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center gap-2 text-white font-bold text-xs rounded-2xl">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span>جاري تجهيز صورة بطاقة السؤال...</span>
              </div>
            )}

            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="معاينة بطاقة السؤال"
                className="w-full h-full object-contain rounded-xl shadow-md border border-slate-200 max-h-[220px] bg-white"
              />
            ) : (
              <div className="w-full overflow-hidden flex justify-center scale-[0.75] origin-top my-[-25px]">
                <QuestionCardVisual
                  ref={cardRef}
                  question={question}
                  subjectName={subjectName}
                  lessonTitle={lessonTitle}
                  isEnglish={isEnglish}
                  includeAnswer={includeAnswer}
                />
              </div>
            )}
          </div>

          {/* Toggle include answer */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs sm:text-sm font-bold text-slate-700">إظهار الإجابة الصحيحة والشرح على الصورة</span>
            <button
              type="button"
              onClick={() => setIncludeAnswer(!includeAnswer)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border ${includeAnswer ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-300 border-slate-400'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${includeAnswer ? '-translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={handleShareImage}
              disabled={isGeneratingImage}
              className="py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl font-black shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 text-xs transition-all disabled:opacity-50"
            >
              <ShareIcon className="w-4 h-4" />
              <span>مشاركة الصورة 🖼️</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-3 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl font-black shadow-md flex items-center justify-center gap-1.5 text-xs transition-all"
            >
              <span>مشاركة واتساب 💬</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl font-black shadow-md flex items-center justify-center gap-1.5 text-xs transition-all disabled:opacity-50"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>تحميل الصورة 📥</span>
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 text-center">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400">
            تطبيق JoSchool11 - يتم توليد بطاقة السؤال كصورة عالية الجودة لمشاركتها مباشرة 🎓
          </p>
        </div>
      </div>
    </div>
  );
};

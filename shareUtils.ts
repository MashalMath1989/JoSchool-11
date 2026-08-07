import React from 'react';
import { createRoot } from 'react-dom/client';
import { toBlob, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Question } from './types';
import { QuestionCardVisual } from './QuestionCardVisual';
import { KATEX_CSS } from './katexCss';

export function isMathSubject(subjectName?: string | any, question?: Question): boolean {
  if (typeof subjectName === 'object' && subjectName !== null) {
    subjectName = subjectName.id || subjectName.title || subjectName.name || '';
  }
  const sName = String(subjectName || '');
  const qSub = String((question as any)?.subjectId || (question as any)?.subject_id || (question as any)?.subjectName || '');
  const combined = `${sName} ${qSub}`;

  if (
    combined.includes('رياضيات') ||
    combined.includes('Math') ||
    combined.includes('math') ||
    combined.includes('الرياضيات')
  ) {
    return true;
  }

  if (question) {
    const qText = question.question || '';
    if (
      qText.includes('\\frac') ||
      qText.includes('\\sqrt') ||
      qText.includes('\\lim') ||
      qText.includes('\\int') ||
      qText.includes('\\sin') ||
      qText.includes('\\cos') ||
      qText.includes('\\tan') ||
      (question as any).trigGraph ||
      (question as any).questionGraph ||
      (question as any).graph
    ) {
      return true;
    }
  }

  return false;
}

export function formatQuestionText(
  question: Question,
  subjectName?: string,
  lessonTitle?: string,
  isEnglish: boolean = false,
  includeAnswer: boolean = false
): string {
  const labels = isEnglish ? ['A', 'B', 'C', 'D', 'E'] : ['أ', 'ب', 'ج', 'د', 'هـ'];

  let text = `📚 سؤال من تطبيق JoSchool11 (جيل 2010)\n`;
  if (subjectName) text += `📌 المادة: ${subjectName}\n`;
  if (lessonTitle) text += `📖 الدرس: ${lessonTitle}\n`;

  text += `\n❓ السؤال:\n${question.question.trim()}\n`;

  if (question.choices && question.choices.length > 0) {
    text += `\nالخيارات:\n` + question.choices.map((c, i) => {
      const label = labels[i] || (i + 1).toString();
      return `${label}) ${c.trim()}`;
    }).join('\n') + `\n`;
  }

  if (includeAnswer && question.correct_answer) {
    text += `\n✅ الإجابة الصحيحة: ${question.correct_answer.trim()}\n`;
    if (question.explanation) {
      text += `💡 الشرح: ${question.explanation.trim()}\n`;
    }
  }

  text += `\n--------------------\n🎓 حمّل تطبيق JoSchool11 واستعد للامتحانات الوزارية بكل ثقة!`;
  return text;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob | null> {
  try {
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (e) {
    return null;
  }
}

export async function generateQuestionCardBlob({
  question,
  subjectName,
  lessonTitle,
  isEnglish = false,
  includeAnswer = false,
}: {
  question: Question;
  subjectName?: string;
  lessonTitle?: string;
  isEnglish?: boolean;
  includeAnswer?: boolean;
}): Promise<Blob | null> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '620px';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-99999';
  document.body.appendChild(container);

  const root = createRoot(container);

  return new Promise((resolve) => {
    root.render(
      React.createElement(QuestionCardVisual, {
        question,
        subjectName,
        lessonTitle,
        isEnglish,
        includeAnswer,
      })
    );

    setTimeout(async () => {
      try {
        const cardEl = container.firstElementChild as HTMLElement;
        if (cardEl) {
          let blob: Blob | null = null;
          try {
            blob = await toBlob(cardEl, {
              quality: 1.0,
              pixelRatio: 3,
              fontEmbedCSS: KATEX_CSS,
              skipFonts: false,
              cacheBust: false,
              filter: (node) => node.nodeName !== 'SCRIPT' && node.nodeName !== 'LINK',
            });
          } catch (e) {
            console.warn('toBlob failed, trying toPng fallback:', e);
          }

          if (!blob) {
            const dataUrl = await toPng(cardEl, {
              quality: 1.0,
              pixelRatio: 3,
              fontEmbedCSS: KATEX_CSS,
              skipFonts: false,
              cacheBust: false,
              filter: (node) => node.nodeName !== 'SCRIPT' && node.nodeName !== 'LINK',
            });
            if (dataUrl) {
              blob = await dataUrlToBlob(dataUrl);
            }
          }

          resolve(blob);
        } else {
          resolve(null);
        }
      } catch (err) {
        console.error('Failed to capture card image blob', err);
        resolve(null);
      } finally {
        root.unmount();
        container.remove();
      }
    }, 250);
  });
}

export async function generateQuestionCardDataUrl({
  question,
  subjectName,
  lessonTitle,
  isEnglish = false,
  includeAnswer = false,
}: {
  question: Question;
  subjectName?: string;
  lessonTitle?: string;
  isEnglish?: boolean;
  includeAnswer?: boolean;
}): Promise<string | null> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '620px';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-99999';
  document.body.appendChild(container);

  const root = createRoot(container);

  return new Promise((resolve) => {
    root.render(
      React.createElement(QuestionCardVisual, {
        question,
        subjectName,
        lessonTitle,
        isEnglish,
        includeAnswer,
      })
    );

    setTimeout(async () => {
      try {
        const cardEl = container.firstElementChild as HTMLElement;
        if (cardEl) {
          const dataUrl = await toPng(cardEl, {
            quality: 1.0,
            pixelRatio: 3,
            fontEmbedCSS: KATEX_CSS,
            skipFonts: false,
            cacheBust: false,
            filter: (node) => node.nodeName !== 'SCRIPT' && node.nodeName !== 'LINK',
          });
          resolve(dataUrl);
        } else {
          resolve(null);
        }
      } catch (err) {
        console.error('Failed to capture card image dataUrl', err);
        resolve(null);
      } finally {
        root.unmount();
        container.remove();
      }
    }, 250);
  });
}

let shareToastElement: HTMLElement | null = null;

export function showShareToast(message: string = 'جاري التحضير... ⏳') {
  if (shareToastElement) {
    shareToastElement.remove();
    shareToastElement = null;
  }
  const toast = document.createElement('div');
  toast.id = 'joschool-share-toast';
  toast.className = 'fixed top-6 left-1/2 -translate-x-1/2 z-[999999] bg-slate-900/95 text-white backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 text-sm font-black dir-rtl transition-all duration-300 pointer-events-none';
  toast.setAttribute('dir', 'rtl');
  toast.innerHTML = `
    <div class="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  shareToastElement = toast;
}

export function hideShareToast() {
  if (shareToastElement) {
    const el = shareToastElement;
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, -10px)';
    setTimeout(() => {
      el.remove();
      if (shareToastElement === el) {
        shareToastElement = null;
      }
    }, 200);
  }
}

/**
  * Export Math question card as a PDF file preserving KaTeX equations, layout & styles
  */
export async function exportMathQuestionAsPDF({
  question,
  subjectName = 'الرياضيات',
  lessonTitle,
  isEnglish = false,
}: {
  question: Question;
  subjectName?: string;
  lessonTitle?: string;
  isEnglish?: boolean;
}) {
  showShareToast('جاري تصدير بطاقة سؤال الرياضيات كملف PDF... 📄');

  try {
    const dataUrl = await generateQuestionCardDataUrl({
      question,
      subjectName,
      lessonTitle,
      isEnglish,
      includeAnswer: false,
    });

    if (!dataUrl) {
      throw new Error('Failed to generate question card image');
    }

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const imgWidth = img.naturalWidth || img.width || 620;
    const imgHeight = img.naturalHeight || img.height || 400;

    const pdfWidth = 210; // mm (A4 width)
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    const doc = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    doc.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const pdfBlob = doc.output('blob');
    const pdfFileName = `سؤال_رياضيات_JoSchool11_${Date.now()}.pdf`;
    const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

    hideShareToast();

    // Try Web Share API with PDF file first
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            title: 'سؤال رياضيات - JoSchool11',
            text: '📚 بطاقة سؤال مادة الرياضيات بصيغة PDF من تطبيق JoSchool11',
            files: [pdfFile],
          });
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.warn('Native PDF share failed, downloading instead:', err);
      }
    }

    // Direct PDF download fallback
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    showShareToast('تم تحميل بطاقة السؤال بصيغة PDF بنجاح 📥📄');
    setTimeout(hideShareToast, 2500);

  } catch (err) {
    console.error('Failed to generate PDF:', err);
    hideShareToast();
    showShareToast('تعذر تصدير ملف PDF، يُرجى المحاولة لاحقاً ❌');
    setTimeout(hideShareToast, 2500);
  }
}

/**
  * Share non-Math question as text only
  */
export async function shareQuestionAsText({
  question,
  subjectName,
  lessonTitle,
  isEnglish = false,
}: {
  question: Question;
  subjectName?: string;
  lessonTitle?: string;
  isEnglish?: boolean;
}) {
  const formattedText = formatQuestionText(question, subjectName, lessonTitle, isEnglish, false);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'سؤال من JoSchool11',
        text: formattedText,
      });
      return;
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('Native text share failed:', err);
    }
  }

  // Fallback: Copy to clipboard and open WhatsApp
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(formattedText);
      showShareToast('تم نسخ نص السؤال إلى الحافظة بنجاح 📋');
      setTimeout(hideShareToast, 2500);
    } catch (e) {
      // Ignore
    }
  }

  const encodedText = encodeURIComponent(formattedText);
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = `whatsapp://send?text=${encodedText}`;
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank', 'noopener,noreferrer');
  }
}

export async function shareQuestionDirectly({
  question,
  subjectName,
  lessonTitle,
  isEnglish = false,
}: {
  question: Question;
  subjectName?: string;
  lessonTitle?: string;
  isEnglish?: boolean;
}) {
  if (isMathSubject(subjectName, question)) {
    // Export Math question card as PDF file
    return exportMathQuestionAsPDF({ question, subjectName, lessonTitle, isEnglish });
  } else {
    // Share non-Math questions (History, Islamic, Arabic, etc.) as TEXT ONLY
    return shareQuestionAsText({ question, subjectName, lessonTitle, isEnglish });
  }
}



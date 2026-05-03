import React from 'react';

/**
 * وظيفة لتحويل وسوم <u> و </u> إلى تنسيق حقيقي (Underline)
 * تدعم البحث عن الوسوم واستبدالها بمكونات React
 */
export const renderTextWithUnderline = (text: string) => {
    if (!text || typeof text !== 'string') return text;
    
    // إذا لم يحتوي النص على أي وسوم <u>، نعيده كما هو لتوفير المعالجة
    if (!text.includes('<u>')) return text;

    // تقسيم النص بناءً على وسوم <u> و </u>
    const parts = text.split(/(<u>.*?<\/u>)/gi);

    return (
        <>
            {parts.map((part, index) => {
                if (part.toLowerCase().startsWith('<u>') && part.toLowerCase().endsWith('</u>')) {
                    // استخراج المحتوى بين <u> و </u>
                    const content = part.substring(3, part.length - 4);
                    return <u key={index} className="underline underline-offset-4 decoration-2">{content}</u>;
                }
                return part;
            })}
        </>
    );
};

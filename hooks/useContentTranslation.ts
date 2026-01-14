"use client";

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export function useContentTranslation<T extends Record<string, string>>(initialContent: T) {
    const { language, translateText } = useLanguage();
    const [content, setContent] = useState<T>(initialContent);
    // Use a ref to keep track of the initial English content to prevent re-translation loops
    // and to always translate FROM English, avoiding drift.
    const initialContentRef = useRef(initialContent);

    useEffect(() => {
        // If language is English, revert to initial content
        if (language === 'en') {
            setContent(initialContentRef.current);
            return;
        }

        const translateContent = async () => {
            try {
                const keys = Object.keys(initialContentRef.current);
                const values = Object.values(initialContentRef.current);

                const translatedValues = await translateText(values);

                if (Array.isArray(translatedValues) && translatedValues.length === values.length) {
                    const newContent: any = {};
                    keys.forEach((key, index) => {
                        newContent[key] = translatedValues[index];
                    });
                    setContent(newContent);
                }
            } catch (error) {
                console.error("Translation error in hook:", error);
            }
        };

        translateContent();
    }, [language, translateText]);

    return content;
}

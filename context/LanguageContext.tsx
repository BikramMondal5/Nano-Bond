"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type Language = 'en' | 'es' | 'fr' | 'hi' | 'de';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    translateText: (text: string | string[]) => Promise<string | string[]>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>('en');

    const translateText = useCallback(async (text: string | string[]) => {
        if (language === 'en') return text;

        try {
            const textsToTranslate = Array.isArray(text) ? text : [text];

            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    texts: textsToTranslate,
                    targetLocale: language
                })
            });

            if (!response.ok) throw new Error('Translation failed');

            const data = await response.json();
            const translations = data.translations;

            return Array.isArray(text) ? translations : translations[0];
        } catch (error) {
            console.error("Translation error:", error);
            return text; // Fallback to original
        }
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, translateText }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

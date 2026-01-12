"use client";

import React, { createContext, useContext, useCallback, useState } from 'react';

interface ThreeJsContextType {
    isPaused: boolean;
    pauseThreeJs: () => void;
    resumeThreeJs: () => void;
}

const ThreeJsContext = createContext<ThreeJsContextType | undefined>(undefined);

export const ThreeJsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPaused, setIsPaused] = useState(false);

    const pauseThreeJs = useCallback(() => {
        setIsPaused(true);
        // Add any Three.js pause logic here if you have a Three.js scene
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('pauseThreeJs'));
        }
    }, []);

    const resumeThreeJs = useCallback(() => {
        setIsPaused(false);
        // Add any Three.js resume logic here if you have a Three.js scene
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('resumeThreeJs'));
        }
    }, []);

    return (
        <ThreeJsContext.Provider value={{ isPaused, pauseThreeJs, resumeThreeJs }}>
            {children}
        </ThreeJsContext.Provider>
    );
};

export const useThreeJs = () => {
    const context = useContext(ThreeJsContext);
    if (context === undefined) {
        throw new Error('useThreeJs must be used within a ThreeJsProvider');
    }
    return context;
};

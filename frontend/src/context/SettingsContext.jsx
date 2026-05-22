import React, { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_CONFIG = {
    highlightActiveTask: true,
    showTimeRemaining: false,
    showActiveProgressBar: false,
    showEndTime: true,
    showDuration: false,
};

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('lifemanager-settings');
        if (saved) {
            try {
                return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to parse settings:', e);
            }
        }
        return { ...DEFAULT_CONFIG };
    });

    const updateSetting = (key, value) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            localStorage.setItem('lifemanager-settings', JSON.stringify(next));
            return next;
        });
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}

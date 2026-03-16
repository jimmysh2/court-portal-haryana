import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(localStorage.getItem('preferredLanguage') || 'en');

    useEffect(() => {
        localStorage.setItem('preferredLanguage', lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const toggleLanguage = () => {
        setLang(prev => prev === 'en' ? 'hi' : 'en');
    };

    const t = (key) => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

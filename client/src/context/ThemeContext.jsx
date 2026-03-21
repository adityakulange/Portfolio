import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Default to 'inferno' if no local storage, but will be overwritten by API
    const [theme, setThemeState] = useState(localStorage.getItem('admin-theme') || 'inferno');

    // Fetch theme from API on mount and poll for changes
    useEffect(() => {
        const fetchTheme = async () => {
             try {
                const { data } = await api.get('/profile');
                if (data && data.theme) {
                    // Only update state if theme is different to avoid re-renders/loops
                    setThemeState(prev => {
                        if (prev !== data.theme) {
                            return data.theme;
                        }
                        return prev;
                    });
                }
             } catch (error) {
                 console.error("Failed to fetch theme", error);
             }
        };

        fetchTheme(); // Initial fetch
        
        // Poll every 5 seconds to sync across devices
        const interval = setInterval(fetchTheme, 5000);
        return () => clearInterval(interval);
    }, []);

    const setTheme = async (newTheme) => {
        setThemeState(newTheme);
        // Optimistic update locally
        const root = document.documentElement;
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('admin-theme', newTheme);
        
        // Sync to backend
        try {
            await api.put('/profile', { theme: newTheme });
        } catch (error) {
            console.error("Failed to save theme preference", error);
        }
    };

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem('admin-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

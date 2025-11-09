import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check localStorage first, then system preference, default to dark
    const saved = localStorage.getItem('darkMode');
    let isDarkMode = true;
    
    if (saved !== null) {
      isDarkMode = JSON.parse(saved);
    } else {
      // Check system preference if no saved preference
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-gray-200/80 dark:bg-white/10 backdrop-blur-sm border border-gray-300/50 dark:border-white/20
                 hover:bg-gray-300/80 dark:hover:bg-white/20 transition-all duration-300 hover:scale-110"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-500 dark:text-yellow-300" />
      ) : (
        <Moon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
      )}
    </button>
  );
}

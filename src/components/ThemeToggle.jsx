import React from 'react';
import { useTheme } from '../ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="3.5" />
          <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <line x1="8" y1="0.5" x2="8" y2="2.3" />
            <line x1="8" y1="13.7" x2="8" y2="15.5" />
            <line x1="0.5" y1="8" x2="2.3" y2="8" />
            <line x1="13.7" y1="8" x2="15.5" y2="8" />
            <line x1="2.8" y1="2.8" x2="4.1" y2="4.1" />
            <line x1="11.9" y1="11.9" x2="13.2" y2="13.2" />
            <line x1="2.8" y1="13.2" x2="4.1" y2="11.9" />
            <line x1="11.9" y1="4.1" x2="13.2" y2="2.8" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.8 10.2A6 6 0 0 1 5.8 2.2a6.3 6.3 0 0 0-1.6 1A6.5 6.5 0 1 0 14.8 11.8a6.3 6.3 0 0 0 1-1.6 6 6 0 0 1-2 0Z" />
        </svg>
      )}
    </button>
  );
}

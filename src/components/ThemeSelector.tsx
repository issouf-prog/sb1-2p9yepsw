import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Theme } from '../types';

interface ThemeSelectorProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

export function ThemeSelector({ theme, onChange }: ThemeSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => onChange('light')}
        className={`p-2 rounded-md transition-all ${
          theme === 'light' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-white/50'
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('dark')}
        className={`p-2 rounded-md transition-all ${
          theme === 'dark' ? 'bg-gray-700 shadow-sm text-blue-400' : 'text-gray-600 hover:bg-gray-700/50'
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('system')}
        className={`p-2 rounded-md transition-all ${
          theme === 'system' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:bg-white/50 dark:hover:bg-gray-700/50'
        }`}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
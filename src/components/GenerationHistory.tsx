import React from 'react';
import { Clock, Video } from 'lucide-react';
import { GenerationHistoryItem } from '../types';

interface GenerationHistoryProps {
  history: GenerationHistoryItem[];
  onSelect: (item: GenerationHistoryItem) => void;
}

export function GenerationHistory({ history, onSelect }: GenerationHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Clock className="w-5 h-5" />
        <h3 className="font-medium">Historique des générations</h3>
      </div>
      <div className="space-y-2">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-3"
          >
            <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(item.timestamp).toLocaleDateString()}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
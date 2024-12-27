import { useState } from 'react';
import type { GenerationHistoryItem } from '../types';

export function useHistory() {
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);

  const addToHistory = (item: Omit<GenerationHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: GenerationHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const clearHistory = () => setHistory([]);

  return { history, addToHistory, clearHistory };
}
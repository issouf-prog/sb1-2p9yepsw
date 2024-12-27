import React from 'react';
import { Loader2 } from 'lucide-react';

interface GenerationStatusProps {
  status: 'idle' | 'generating' | 'complete';
  progress: number;
}

export function GenerationStatus({ status, progress }: GenerationStatusProps) {
  return (
    <div className="mt-4">
      {status === 'generating' && (
        <div className="flex items-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
      )}
    </div>
  );
}
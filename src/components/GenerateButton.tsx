import React from 'react';
import { Play, Loader2 } from 'lucide-react';
import { GenerationStatus } from '../types';

interface GenerateButtonProps {
  onGenerate: () => void;
  status: GenerationStatus;
  disabled: boolean;
}

export function GenerateButton({ onGenerate, status, disabled }: GenerateButtonProps) {
  return (
    <button
      onClick={onGenerate}
      disabled={status === 'generating' || disabled}
      className="group mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-102 active:scale-98 flex items-center justify-center gap-2 w-full sm:w-auto"
    >
      {status === 'generating' ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Play className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
      )}
      {status === 'generating' ? 'Génération en cours...' : 'Générer la vidéo'}
    </button>
  );
}
import React from 'react';
import { Sparkles } from 'lucide-react';

interface TitleInputProps {
  title: string;
  onTitleChange: (title: string) => void;
  onGenerateScript: () => void;
  isGenerating: boolean;
}

export function TitleInput({ 
  title, 
  onTitleChange, 
  onGenerateScript, 
  isGenerating 
}: TitleInputProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Titre de la vidéo
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Entrez le titre de votre vidéo..."
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <button
          onClick={onGenerateScript}
          disabled={!title.trim() || isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Générer un script
        </button>
      </div>
    </div>
  );
}
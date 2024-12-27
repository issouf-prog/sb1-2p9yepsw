import React from 'react';
import { Loader2 } from 'lucide-react';

interface TextInputProps {
  text: string;
  onChange: (text: string) => void;
  isGenerating: boolean;
}

export function TextInput({ text, onChange, isGenerating }: TextInputProps) {
  return (
    <div className="relative w-full transition-all duration-300">
      {isGenerating && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Génération du script...</span>
          </div>
        </div>
      )}
      <textarea
        className="w-full h-40 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out"
        placeholder="Entrez votre texte ici ou générez un script à partir du titre..."
        value={text}
        onChange={(e) => onChange(e.target.value)}
        disabled={isGenerating}
      />
    </div>
  );
}
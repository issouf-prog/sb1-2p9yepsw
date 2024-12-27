import React from 'react';
import { Lightbulb } from 'lucide-react';
import { VideoPlatform } from '../types';

interface TitleSuggestionsProps {
  platform: VideoPlatform;
  onSelect: (title: string) => void;
}

export function TitleSuggestions({ platform, onSelect }: TitleSuggestionsProps) {
  const suggestions = getSuggestionsByPlatform(platform);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
        <Lightbulb className="w-4 h-4" />
        <span>Suggestions de titres</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function getSuggestionsByPlatform(platform: VideoPlatform): string[] {
  switch (platform) {
    case 'youtube':
      return [
        "Comment j'ai appris...",
        "Le guide ultime pour...",
        "10 secrets pour...",
        "Pourquoi vous devriez..."
      ];
    case 'tiktok':
      return [
        "POV: Quand...",
        "Le hack que personne...",
        "Ce truc va vous choquer...",
        "J'ai testé..."
      ];
    case 'instagram':
      return [
        "La routine parfaite pour...",
        "3 astuces pour...",
        "Découvrez comment...",
        "Le before/after de..."
      ];
  }
}
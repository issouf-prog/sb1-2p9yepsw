import React from 'react';
import { Video } from 'lucide-react';

export function Header() {
  return (
    <div className="flex items-center space-x-2 mb-8">
      <Video className="w-8 h-8 text-blue-600" />
      <h1 className="text-2xl font-bold">Générateur de Vidéos IA</h1>
    </div>
  );
}
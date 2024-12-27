import React from 'react';

interface PreviewProps {
  videoUrl: string | null;
}

export function Preview({ videoUrl }: PreviewProps) {
  if (!videoUrl) return null;

  return (
    <div className="mt-6 rounded-lg overflow-hidden bg-black aspect-video shadow-lg transition-all duration-500 animate-fadeIn">
      <video 
        className="w-full h-full"
        controls
        src={videoUrl}
      />
    </div>
  );
}
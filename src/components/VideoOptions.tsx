import React from 'react';
import { Settings2 } from 'lucide-react';
import type { VideoConfig, VideoPlatform, VideoFormat, VideoLength, Language } from '../types';

interface VideoOptionsProps {
  config: VideoConfig;
  onChange: (config: VideoConfig) => void;
}

const platforms: { value: VideoPlatform; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
];

const formats: { value: VideoFormat; label: string }[] = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mov', label: 'MOV' },
  { value: 'webm', label: 'WebM' },
];

const lengths: { value: VideoLength; label: string; duration: string }[] = [
  { value: 'short', label: 'Court', duration: '< 1 min' },
  { value: 'medium', label: 'Moyen', duration: '1-5 min' },
  { value: 'long', label: 'Long', duration: '5-15 min' },
];

const languages: { value: Language; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
];

export function VideoOptions({ config, onChange }: VideoOptionsProps) {
  const handleChange = (key: keyof VideoConfig) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    onChange({
      ...config,
      [key]: e.target.value,
    });
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-5 h-5 text-gray-600" />
        <h2 className="font-semibold text-gray-700">Configuration de la vidéo</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plateforme
          </label>
          <select
            value={config.platform}
            onChange={handleChange('platform')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {platforms.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            value={config.format}
            onChange={handleChange('format')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {formats.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Longueur
          </label>
          <select
            value={config.length}
            onChange={handleChange('length')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {lengths.map(({ value, label, duration }) => (
              <option key={value} value={value}>{label} ({duration})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Langue
          </label>
          <select
            value={config.language}
            onChange={handleChange('language')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {languages.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
import type { VideoPlatform, VideoFormat, VideoLength, Language } from '../types';

export const PLATFORMS: { value: VideoPlatform; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
];

export const FORMATS: { value: VideoFormat; label: string }[] = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mov', label: 'MOV' },
  { value: 'webm', label: 'WebM' },
];

export const LENGTHS: { value: VideoLength; label: string; duration: string }[] = [
  { value: 'short', label: 'Court', duration: '< 1 min' },
  { value: 'medium', label: 'Moyen', duration: '1-5 min' },
  { value: 'long', label: 'Long', duration: '5-15 min' },
];

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
];
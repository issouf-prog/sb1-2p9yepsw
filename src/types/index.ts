export type GenerationStatus = 'idle' | 'generating' | 'complete';
export type VideoPlatform = 'youtube' | 'tiktok' | 'instagram';
export type VideoFormat = 'mp4' | 'mov' | 'webm';
export type VideoLength = 'short' | 'medium' | 'long';
export type Language = 'fr' | 'en' | 'es' | 'de';
export type Theme = 'light' | 'dark' | 'system';

export interface VideoConfig {
  platform: VideoPlatform;
  format: VideoFormat;
  length: VideoLength;
  language: Language;
}

export interface ScriptGenerationState {
  isGenerating: boolean;
  script: string;
}

export interface GenerationHistoryItem {
  id: string;
  title: string;
  text: string;
  config: VideoConfig;
  timestamp: number;
  videoUrl?: string;
}
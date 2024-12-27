import { useState } from 'react';
import { useHistory } from './useHistory';
import { useScriptGeneration } from './useScriptGeneration';
import { simulateVideoGeneration } from '../utils/videoGeneration';
import type { GenerationStatus, VideoConfig, GenerationHistoryItem } from '../types';

export function useVideoGeneration() {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [config, setConfig] = useState<VideoConfig>({
    platform: 'youtube',
    format: 'mp4',
    length: 'medium',
    language: 'fr',
  });

  const { history, addToHistory } = useHistory();
  const { scriptState, generateScriptContent } = useScriptGeneration();

  const handleGenerateScript = async () => {
    const script = await generateScriptContent(title, config.platform, config.length);
    setText(script);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setStatus('generating');
    setProgress(0);
    setVideoUrl(null);

    try {
      const url = await simulateVideoGeneration(setProgress, config);
      setVideoUrl(url);
      setStatus('complete');
      
      addToHistory({ title, text, config, videoUrl: url });
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      setStatus('idle');
    }
  };

  const handleHistorySelect = (item: GenerationHistoryItem) => {
    setTitle(item.title);
    setText(item.text);
    setConfig(item.config);
    setVideoUrl(item.videoUrl || null);
  };

  return {
    title,
    text,
    config,
    status,
    progress,
    videoUrl,
    history,
    scriptGeneration: scriptState,
    setTitle,
    setText,
    setConfig,
    handleGenerateScript,
    handleGenerate,
    handleHistorySelect,
  };
}
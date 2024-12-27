import { useState } from 'react';
import { generateScript } from '../utils/scriptGeneration';
import type { VideoPlatform, VideoLength, ScriptGenerationState } from '../types';

export function useScriptGeneration() {
  const [scriptState, setScriptState] = useState<ScriptGenerationState>({
    isGenerating: false,
    script: '',
  });

  const generateScriptContent = async (
    title: string,
    platform: VideoPlatform,
    length: VideoLength
  ) => {
    if (!title.trim()) return '';

    setScriptState({ isGenerating: true, script: '' });
    
    try {
      const script = await generateScript(title, platform, length);
      setScriptState({ isGenerating: false, script });
      return script;
    } catch (error) {
      console.error('Erreur lors de la génération du script:', error);
      setScriptState({ isGenerating: false, script: '' });
      return '';
    }
  };

  return { scriptState, generateScriptContent };
}
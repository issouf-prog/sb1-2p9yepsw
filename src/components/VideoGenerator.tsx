import React, { useState } from 'react';
import { TextInput } from './TextInput';
import { TitleInput } from './TitleInput';
import { GenerationStatus } from './GenerationStatus';
import { Preview } from './Preview';
import { GenerateButton } from './GenerateButton';
import { VideoOptions } from './VideoOptions';
import { GenerationHistory } from './GenerationHistory';
import { TitleSuggestions } from './TitleSuggestions';
import { ThemeSelector } from './ThemeSelector';
import { useTheme } from '../hooks/useTheme';
import { useVideoGeneration } from '../hooks/useVideoGeneration';
import type { GenerationHistoryItem, VideoConfig } from '../types';

export function VideoGenerator() {
  const [theme, setTheme] = useTheme();
  const {
    title,
    text,
    config,
    status,
    progress,
    videoUrl,
    history,
    setTitle,
    setText,
    setConfig,
    handleGenerateScript,
    handleGenerate,
    handleHistorySelect,
    scriptGeneration
  } = useVideoGeneration();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 space-y-6 transition-all duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Générateur de Vidéo</h2>
        <ThemeSelector theme={theme} onChange={setTheme} />
      </div>

      <VideoOptions config={config} onChange={setConfig} />
      
      <div className="space-y-6">
        <div>
          <TitleInput
            title={title}
            onTitleChange={setTitle}
            onGenerateScript={handleGenerateScript}
            isGenerating={scriptGeneration.isGenerating}
          />
          <TitleSuggestions 
            platform={config.platform}
            onSelect={setTitle}
          />
        </div>

        <TextInput 
          text={text} 
          onChange={setText}
          isGenerating={scriptGeneration.isGenerating}
        />

        <GenerationStatus status={status} progress={progress} />
        
        <GenerateButton 
          onGenerate={handleGenerate}
          status={status}
          disabled={!text.trim()}
        />

        <Preview videoUrl={videoUrl} />
        
        <GenerationHistory 
          history={history}
          onSelect={handleHistorySelect}
        />
      </div>
    </div>
  );
}
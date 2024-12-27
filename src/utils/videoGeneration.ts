import type { VideoConfig } from '../types';

export async function simulateVideoGeneration(
  onProgress: (progress: number) => void,
  config?: VideoConfig
): Promise<string> {
  // Simuler un temps de génération différent selon la longueur
  const steps = config?.length === 'short' ? 5 : 
                config?.length === 'medium' ? 10 : 15;
  
  for (let i = 0; i <= 100; i += (100 / steps)) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    onProgress(Math.min(100, i));
  }
  
  return 'https://storage.googleapis.com/webfundamentals-assets/videos/chrome.mp4';
}
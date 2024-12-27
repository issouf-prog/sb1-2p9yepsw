import { VideoPlatform, VideoLength } from '../types';

const PLATFORM_TEMPLATES = {
  youtube: {
    short: "Une vidéo courte et dynamique pour YouTube Shorts",
    medium: "Un format optimal pour l'engagement sur YouTube",
    long: "Un contenu détaillé et approfondi pour YouTube"
  },
  tiktok: {
    short: "Un contenu viral adapté à TikTok",
    medium: "Une série de clips engageants pour TikTok",
    long: "Un storytelling captivant pour TikTok"
  },
  instagram: {
    short: "Un Reel Instagram accrocheur",
    medium: "Un carrousel vidéo pour Instagram",
    long: "Une IGTV complète et détaillée"
  }
};

export async function generateScript(
  title: string, 
  platform: VideoPlatform, 
  length: VideoLength
): Promise<string> {
  // Simuler un délai d'appel API
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const template = PLATFORM_TEMPLATES[platform][length];
  
  return `🎥 ${title}

${template}

Introduction:
- Accroche captivante sur le sujet
- Présentation rapide du contenu

Corps du contenu:
1. Point clé #1
   - Détail important
   - Exemple concret

2. Point clé #2
   - Explication approfondie
   - Démonstration pratique

Conclusion:
- Récapitulatif des points essentiels
- Call-to-action engageant

#${platform} #contenu #création`;
}
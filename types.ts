

export enum WorkflowStep {
  SETUP = 'setup',
  EDITOR = 'editor',
  EXPORT = 'export',
}

export enum AspectRatio {
  RATIO_16_9 = '16:9',
  RATIO_4_3 = '4:3',
  RATIO_9_16 = '9:16',
  RATIO_1_1 = '1:1',
  RATIO_21_9 = '21:9',
  RATIO_4_5 = '4:5',
  RATIO_3_2 = '3:2',
}

export interface StyleOption {
  id: string;
  name: string;
  nameZh?: string; 
  color: string;
  description: string;
  descriptionZh?: string;
}

export enum SymbolCategory {
  REFERENCE = 'Reference',
  CAMERA = 'Camera',
  ACTION = 'Action',
  DIALOGUE = 'Dialogue',
  CUSTOM = 'Custom',
}

export interface SymbolItem {
  id: string;
  category: SymbolCategory;
  name: string;
  icon: string; // Identifier key, Emoji, or Base64 Image URL
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  rotation: number;
  text?: string;
  description?: string; // For technical prompt explanation
  isCustom?: boolean;
}

export interface StoryboardFrame {
  id: string;
  number: number;
  description: string;
  descriptionZh?: string;
  visualPrompt: string;
  visualPromptZh?: string;
  imageUrl?: string;
  symbols: SymbolItem[];
  isGenerating?: boolean;
  generationError?: boolean; // 标记分镜图生成是否失败
}

export interface ProjectConfig {
  script: string;
  style: StyleOption;
  aspectRatio: AspectRatio;
  duration: number;
  frameCount: number;
  useAIoptimization: boolean;
  referenceImage?: string; // Base64 string for the main reference subject
}

export type Language = 'en' | 'zh';
export type ApiProvider = 'gemini' | 'openai';

export interface ApiConfig {
  provider: ApiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  presetName?: string; // To track which preset is used
}

export interface ApiPreset {
  id: string;
  name: string;
  provider: ApiProvider;
  baseUrl: string;
  defaultModel: string;
}

export interface AppSettings {
  language: Language;
  llm: ApiConfig;
  image: ApiConfig;
}

export const CONTACT_INFO = {
  email: "909599954@qq.com",
  web: "www.wboke.com"
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'zh', 
  llm: {
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'THUDM/GLM-Z1-9B-0414',
    presetName: '硅基流动'
  },
  image: {
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'black-forest-labs/FLUX.1-schnell',
    presetName: '硅基流动 (Flux绘图)'
  }
};

export const STYLES: StyleOption[] = [
  { id: 'scifi', name: 'Sci-Fi', nameZh: '科幻未来', color: '#06b6d4', description: 'Futuristic, clean lines, neon accents', descriptionZh: '未来主义，线条干净，霓虹点缀' },
  { id: 'cyberpunk', name: 'Cyberpunk', nameZh: '赛博朋克', color: '#d946ef', description: 'High contrast, grit, tech elements', descriptionZh: '高对比度，科技感，坚硬质感' },
  { id: 'ink', name: 'Ink Wash', nameZh: '水墨国风', color: '#1e293b', description: 'Traditional Asian ink style, fluid', descriptionZh: '传统水墨，飘逸流畅' },
  { id: 'anime', name: 'Anime', nameZh: '日系动漫', color: '#f59e0b', description: 'Expressive, dynamic angles', descriptionZh: '表现力强，动态视角' },
  { id: 'noir', name: 'Film Noir', nameZh: '黑白电影', color: '#525252', description: 'Heavy shadows, high contrast b&w', descriptionZh: '重阴影，高对比黑白' },
  { id: 'sketch', name: 'Minimal Sketch', nameZh: '极简素描', color: '#a8a29e', description: 'Rough pencil, loose lines', descriptionZh: '铅笔草稿，线条疏松' },
  { id: 'clay', name: 'Claymation', nameZh: '粘土风格', color: '#e67e22', description: 'Plasticine texture, stop motion look', descriptionZh: '橡皮泥质感，定格动画' },
  { id: 'lego', name: 'Voxel/Brick', nameZh: '乐高积木', color: '#c0392b', description: '3D blocks, voxel art', descriptionZh: '3D积木，体素艺术' },
  { id: 'steampunk', name: 'Steampunk', nameZh: '蒸汽朋克', color: '#d35400', description: 'Brass, gears, victorian retro', descriptionZh: '黄铜齿轮，维多利亚复古' },
  { id: 'vangogh', name: 'Van Gogh', nameZh: '梵高抽象', color: '#f1c40f', description: 'Oil painting, swirling strokes', descriptionZh: '油画质感，漩涡笔触' },
  { id: 'custom', name: 'Custom Style', nameZh: '自定义风格', color: '#999', description: 'Custom visual style', descriptionZh: '自定义视觉风格' },
];

export const SYMBOLS_LIBRARY = {
  [SymbolCategory.REFERENCE]: [
    { name: 'Reference Box', icon: 'ref-box' },
  ],
  [SymbolCategory.CAMERA]: [
    { name: 'Zoom In', icon: 'zoom-in' },
    { name: 'Zoom Out', icon: 'zoom-out' },
    { name: 'Pan Left', icon: 'pan-left' },
    { name: 'Pan Right', icon: 'pan-right' },
    { name: 'Tilt Up', icon: 'tilt-up' },
    { name: 'Tilt Down', icon: 'tilt-down' },
    { name: 'Tracking', icon: 'tracking' },
    { name: 'Hitchcock', icon: 'hitchcock' },
  ],
  [SymbolCategory.ACTION]: [
    { name: 'Move Fwd', icon: 'move-fwd' },
    { name: 'Jump', icon: 'jump' },
    { name: 'Turn', icon: 'turn' },
    { name: 'Fight', icon: 'fight' },
    { name: 'Fall', icon: 'fall' },
  ],
  [SymbolCategory.DIALOGUE]: [
    { name: 'Speech Bubble', icon: 'speech-bubble' },
  ],
};

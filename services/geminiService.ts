
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardFrame, ProjectConfig, AppSettings, ApiConfig } from "../types";
import { requestQueue } from './requestQueue';
import { fetchRetry } from '../src/utils/fetchRetry';

const ENV_API_KEY = process.env.API_KEY || '';
const getApiKey = (config: ApiConfig): string => config.apiKey || ENV_API_KEY;

const getPlaceholderImage = (text: string) => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
    '<rect width="100%" height="100%" fill="#f3f4f6"/>' +
    '<text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="#9ca3af" text-anchor="middle" dy=".3em">' + text + '</text>' +
  '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

// 生成签名的辅助函数（用于速创API的签名校验）
const generateSignature = (params: Record<string, string>, key: string): string => {
  // 1. 对参数按照键名进行排序
  const sortedKeys = Object.keys(params).sort();
  // 2. 拼接成 key1=value1&key2=value2 的格式
  const signStr = sortedKeys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
  // 3. 在末尾添加密钥
  const secretStr = signStr + key;
  // 4. 使用 MD5 算法生成签名
  // 浏览器环境兼容的MD5实现
  const md5Hash = (str: string): string => {
    function md5cycle(x: number[], k: number[]): void {
      let a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17,  606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12,  1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7,  1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7,  1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22,  1236535329);
      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14,  643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9,  38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5,  568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20,  1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14,  1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);
      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16,  1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11,  1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4,  681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23,  76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16,  530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);
      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10,  1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6,  1700485571);
      d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523);
      b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6,  1873313359);
      d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380);
      b = ii(b, c, d, a, k[13], 21,  1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070);
      d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15,  718787259);
      b = ii(b, c, d, a, k[9], 21, -343485551);
      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
    }
    function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
    }
    function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }
    function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }
    function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return cmn(c ^ (b | (~d)), a, b, x, s, t);
    }
    function add32(a: number, b: number): number {
      return (a + b) & 0xFFFFFFFF;
    }
    function md51(s: string): string {
      let n = s.length, state = [1732584193, -271733879, -1732584194, 271733878];
      for (let i = 64; i <= s.length; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)));
      }
      s = s.substring(s.length & ~63);
      let tail = Array(64).fill(0);
      for (let i = 0; i < s.length; i++) tail[i] = s.charCodeAt(i);
      tail[s.length] = 0x80;
      if (s.length <= 55) {
        tail[56] = n * 8;
        md5cycle(state, tail);
      } else {
        md5cycle(state, tail);
        tail.fill(0);
        tail[56] = n * 8;
        md5cycle(state, tail);
      }
      return state.map(x => x.toString(16).padStart(8, '0')).join('');
    }
    function md5blk(s: string): number[] {
      let md5blks = [];
      for (let i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
      }
      return md5blks;
    }
    return md51(str);
  };
  return md5Hash(secretStr);
};

export const testApiConnection = async (config: ApiConfig, type: 'llm' | 'image' = 'llm'): Promise<boolean> => {
  const apiKey = getApiKey(config);
  if (!apiKey) return false;
  
  try {
    if (config.provider === 'gemini') {
       const ai = new GoogleGenAI({ apiKey });
       // Simple test generation
       await ai.models.generateContent({
         model: type === 'image' ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash',
         contents: type === 'image' ? 'A simple drawing of a cat' : 'Hello',
         config: { maxOutputTokens: type === 'image' ? 1 : 1 }
       });
       return true;
    } else {
       // OpenAI Compatible Test - 统一使用代理API
       const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
       
       // 检查是否为速创API
       const isSuCreativeGemini = baseUrl.includes('wuyinkeji.com/api/chat');
       const isSuCreativeImage = baseUrl.includes('wuyinkeji.com/api/img');
       const isSuCreative = isSuCreativeGemini || isSuCreativeImage;
       
       // 统一使用代理端点
       let fullUrl = type === 'image' ? '/api/ai/image' : '/api/ai/chat';
       let requestBody: any;
       
       if (isSuCreativeGemini) {
         // 速创Gemini聊天API
         fullUrl = '/api/ai/chat';
         requestBody = {
           messages: [{role: 'user', content: 'Hi'}],
           apiConfig: {
             baseUrl: baseUrl,
             defaultModel: config.model || 'gemini-3-pro',
             provider: 'sucreative'
           }
         };
       } else if (isSuCreativeImage) {
         // 速创图片API
         fullUrl = '/api/ai/image';
         requestBody = {
           prompt: 'A simple test image',
           aspectRatio: '1:1',
           imageSize: '1K',
           model: config.model || 'nano-banana',
           apiConfig: {
             baseUrl: baseUrl,
             defaultModel: config.model || 'nano-banana',
             provider: 'sucreative'
           }
         };
       } else if (type === 'image') {
         // 其他图片API
         const isCogView = config.model?.includes('cogview');
         requestBody = {
           model: config.model,
           prompt: 'A simple test image',
           n: 1,
           size: isCogView ? '1024x1024' : '512x512',
           ...(isCogView ? { user_id: 'storyboard-user' } : {}),
           apiConfig: {
             baseUrl: baseUrl,
             defaultModel: config.model,
             provider: baseUrl.includes('bigmodel.cn') ? 'zhipu' : 'openai'
           }
         };
       } else {
         // 聊天API
         requestBody = {
           messages: [{role: 'user', content: 'Hi'}],
           apiConfig: {
             baseUrl: baseUrl,
             defaultModel: config.model,
             provider: baseUrl.includes('bigmodel.cn') ? 'zhipu' : 'openai'
           }
         };
       }
       

       
       console.log('API Test Details:', {
         provider: config.provider,
         type: type,
         baseUrl: baseUrl,
         fullUrl: fullUrl,
         requestBody: requestBody
       });
       
       // 使用统一的代理API进行测试
       const res = await fetch(fullUrl, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'X-SF-Key': apiKey
         },
         body: JSON.stringify(requestBody)
       });
       
       console.log('API Test Response:', {
         status: res.status,
         statusText: res.statusText,
         url: res.url
       });
       
       // 如果请求失败，尝试获取详细错误信息
       if (!res.ok) {
         try {
           const errorData = await res.json();
           console.log('API Test Error Details:', errorData);
         } catch (e) {
           console.log('Failed to parse error response:', e);
         }
       }
       
       return res.ok;
    }
  } catch (e) {
    console.error("API Test Failed Exception:", e);
    return false;
  }
};

// Translation function to translate between English and Chinese
export const translateText = async (
  text: string,
  targetLang: 'en' | 'zh',
  settings: AppSettings
): Promise<string> => {
  console.log('translateText called:', { text, targetLang, settings });
  const llmConfig = settings.llm;
  const apiKey = getApiKey(llmConfig);
  console.log('API Key found:', !!apiKey);

  if (!apiKey) {
    console.warn("No API Key found for translation, returning original text");
    return text;
  }

  const sourceLang = targetLang === 'en' ? 'zh' : 'en';
  const prompt = 'You are a professional translator for the Film & Video Industry.\n' +
  'Translate the following text from ' + sourceLang + ' to ' + targetLang + '.\n\n' +
  '[RULES]\n' +
  '1. Context Awareness: Translate strictly in the context of Scriptwriting and Cinematography.\n' +
  '   - "Pan" -> "摇镜头" (not "平底锅")\n' +
  '   - "Shot" -> "镜头" (not "射击")\n' +
  '   - "Crane" -> "升降镜头" (not "起重机")\n' +
  '2. Tone: Keep it concise, professional, and descriptive.\n' +
  '3. Output: Return ONLY the translated text. No explanations.\n\n' +
  '[TEXT]:\n' +
  text;

  try {
    if (llmConfig.provider === 'gemini') {
      console.log('Using Gemini for translation');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: llmConfig.model || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "text/plain"
        }
      });
      console.log('Gemini translation response:', response);
      return response.text?.trim() || text;
    } else {
      console.log('Using other LLM provider for translation:', llmConfig.provider);
      const baseUrl = llmConfig.baseUrl || 'https://api.openai.com/v1';
      
      // 统一使用代理API
      const fullUrl = '/api/ai/chat';
      
      console.log('Translation API request:', {
        url: fullUrl,
        method: 'POST'
      });
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SF-Key': apiKey
        },
        body: JSON.stringify({
          messages: [{role: 'user', content: prompt}],
          max_tokens: 500,
          temperature: 0.1,
          apiConfig: {
            baseUrl: baseUrl,
            defaultModel: llmConfig.model,
            provider: llmConfig.provider
          }
        })
      });
      
      console.log('Translation API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Translation API error:', errorText);
        throw new Error('Translation API error: ' + response.status + ' - ' + errorText);
      }
      
      const data = await response.json();
      console.log('Translation API response data:', data);
      return data.choices[0]?.message?.content?.trim() || text;
    }
  } catch (error) {
    console.error("Translation failed:", error);
    return text;
  }
};

// 检测用户输入的脚本是否已经是结构化的（有编号、序号、段落等规律性内容）
function isStructuredScript(script: string): boolean {
  // 检测常见的脚本结构化模式（包括中英文）
  const patterns = [
    /^\s*[0-9]+\.\s+/gm, // 数字编号 (1. , 2. , etc.)
    /^\s*[a-zA-Z]+\.\s+/gm, // 字母编号 (a. , b. , etc.)
    /^\s*\([0-9]+\)\s+/gm, // 括号数字 ((1) , (2) , etc.)
    /^\s*\([a-zA-Z]+\)\s+/gm, // 括号字母 ((a) , (b) , etc.)
    /^\s*[-*+]\s+/gm, // 项目符号 (- , * , +)
    /^\s*\d+:\s+/gm, // 时间戳或序号 (1: , 2: , etc.)
    /^\s*Scene\s+[0-9]+/i, // 场景编号 (Scene 1, SCENE 2, etc.)
    /^\s*Shot\s+[0-9]+/i, // 镜头编号 (Shot 1, SHOT 2, etc.)
    // 中文编号支持
    /^\s*第[0-9一二三四五六七八九十百千万]+[幕场镜景]/gm, // 第1幕、第一场、第1镜等
    /^\s*[0-9一二三四五六七八九十百千万]+[、\.。]\s*/gm, // 1、 或 一、 等
    /^\s*\[第?[0-9一二三四五六七八九十百千万]+[幕场镜景]?\]/gm // [第1幕]、[1场]等
  ];
  
  // 更严格的检测：需要至少匹配3次或以上才认为是结构化脚本
  // 这样可以避免将普通文本错误地识别为结构化脚本
  return patterns.some(pattern => {
    const matches = script.match(pattern);
    return matches && matches.length >= 3;
  });
}

// 将结构化脚本拆分为帧
function splitStructuredScript(script: string, settings: AppSettings): Partial<StoryboardFrame>[] {
  const lines = script.split('\n');
  const frames: Partial<StoryboardFrame>[] = [];
  
  // 增强的编号模式，支持中英文混合
  // 匹配：数字编号、字母编号、括号编号、项目符号、时间戳、Scene/Shot、中文编号等
  const pattern = /^(\s*(?:[0-9]+\.|[a-zA-Z]+\.|\([0-9]+\)|\([a-zA-Z]+\)|[-*+]|\d+:\s*|Scene\s+[0-9]+|Shot\s+[0-9]+|第[0-9一二三四五六七八九十百千万]+[幕场镜景]|[0-9一二三四五六七八九十百千万]+[、\.。]|\[第?[0-9一二三四五六七八九十百千万]+[幕场镜景]?\])\s*)(.*)$/i;
  
  let currentContent = '';
  let frameNumber = 1;
  
  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      // 如果已经有内容，先保存当前内容为一帧
      if (currentContent.trim()) {
        const trimmedContent = currentContent.trim();
        frames.push({
          number: frameNumber++,
          description: trimmedContent,
          descriptionZh: trimmedContent,
          visualPrompt: 'Storyboard sketch of: ' + trimmedContent,
          visualPromptZh: '分镜草图: ' + trimmedContent
        });
        currentContent = '';
      }
      // 添加新帧的内容（去掉编号部分）
      currentContent = match[2];
    } else if (line.trim()) {
      // 如果不是新的编号行，添加到当前内容
      currentContent += (currentContent ? ' ' : '') + line.trim();
    }
  }
  
  // 保存最后一帧
  if (currentContent.trim()) {
    const trimmedContent = currentContent.trim();
    frames.push({
      number: frameNumber++,
      description: trimmedContent,
      descriptionZh: trimmedContent,
      visualPrompt: 'Storyboard sketch of: ' + trimmedContent,
      visualPromptZh: '分镜草图: ' + trimmedContent
    });
  }
  
  return frames;
}

export const generateFrames = async (
  config: ProjectConfig,
  settings: AppSettings
): Promise<Partial<StoryboardFrame>[]> => {
  const llmConfig = settings.llm;
  const apiKey = getApiKey(llmConfig);

  // 生产环境也输出关键日志，帮助诊断问题
  console.log("=== generateFrames called ===");
  console.log("AI创意优化状态:", config.useAIoptimization);
  console.log("脚本内容长度:", config.script?.length);
  console.log("是否为结构化脚本:", isStructuredScript(config.script));
  console.log("LLM配置:", {
    provider: llmConfig.provider,
    model: llmConfig.model,
    baseUrl: llmConfig.baseUrl,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0
  });

  // 处理结构化脚本
  if (!config.useAIoptimization && isStructuredScript(config.script)) {
    console.log("处理结构化脚本");
    const frames = splitStructuredScript(config.script, settings);
    return config.frameCount > 0 ? frames.slice(0, config.frameCount) : frames;
  } else if (!config.useAIoptimization && process.env.NODE_ENV !== 'production') {
    console.log("取消了AI创意优化，但脚本不是结构化的");
  }

  if (!apiKey) {
    console.warn("❌ No API Key found, using mock data based on user input");
    console.warn("API Key source check:", {
      fromConfig: !!llmConfig.apiKey,
      fromEnv: !!ENV_API_KEY,
      configValue: llmConfig.apiKey ? llmConfig.apiKey.substring(0, 10) + '...' : 'empty'
    });
    // 基于用户输入生成mock数据，而不是使用完全无关的mock数据
    const userInput = config.script || "story scene";
    return Array.from({ length: config.frameCount }, (_, i) => ({
      id: i.toString(),
      number: i + 1,
      description: `${userInput} - Scene ${i + 1}: Narrative description`,
      descriptionZh: `${userInput} - 第${i + 1}镜：剧情描述`,
      visualPrompt: `${config.style.name} style storyboard sketch of ${userInput} - scene ${i + 1}`,
      visualPromptZh: `${config.style.nameZh}风格分镜草图：${userInput} - 第${i + 1}镜`
    }));
  }
  
  console.log("✅ API Key found, proceeding with LLM call");

  // Optimized System Prompt with "Analyze-Optimize-Verify" logic
  const styleName = settings.language === 'zh' ? config.style.nameZh : config.style.name;
  
  // 使用字符串数组和join方法来构建长字符串，避免复杂的引号转义
  // 从localStorage获取用户自定义提示词
  const aiCreativePrompt = localStorage.getItem('aiCreativePrompt');
  
  let prompt: string;
  
  if (aiCreativePrompt) {
    // 使用用户自定义提示词，保留项目设置和输出约束
    prompt = `
${aiCreativePrompt}

[PROJECT SETTINGS]
- Core Script: "${config.script}"
- Visual Style: ${styleName} (${config.style.description})
- Duration: ${config.duration} seconds
- Target Shot Count: ${config.frameCount} keyframes

[OUTPUT CONSTRAINTS]
   - Return ONLY a raw JSON Array. No Markdown blocks, no introductory text.
   - The array must contain exactly ${config.frameCount} objects.
   - **LANGUAGE REQUIREMENT**: visualPrompt and description MUST be in ENGLISH. visualPromptZh and descriptionZh MUST be in CHINESE.
   - **Visual Consistency**: Ensure the main character's features remain identical across all visualPrompt fields.

[JSON SCHEMA]
Strictly follow this structure for each frame:
{
  "visualPrompt": "String (ENGLISH ONLY). Detailed image generation prompt for AI image generation. Must be in English. Start with: ${config.style.name} style storyboard sketch...",
  "visualPromptZh": "String (CHINESE ONLY). 对应英文的中文视觉描述。必须是中文。",
  "description": "String (ENGLISH ONLY). Concise technical instruction for motion. Must be in English.",
  "descriptionZh": "String (CHINESE ONLY). 简练的导演指令。必须是中文。"
}
`;
  } else {
    // 使用默认提示词
    const promptParts = [
      'You are an award-winning Film Director, Cinematographer, and Storyboard Artist.',
      'Your mission is to convert a text script into a structured, cinematic storyboard sequence (JSON format) suitable for AI video generation.',
      '',
      '[PROJECT SETTINGS]',
      '- Core Script: "' + config.script + '"',
      '- Visual Style: ' + styleName + ' (' + config.style.description + ')',
      '- Total Duration: ' + config.duration + ' seconds',
      '- Target Shot Count: ' + config.frameCount + ' keyframes',
      '- Suggested Shot Duration: ~' + Math.round(config.duration / config.frameCount) + ' seconds per shot (distribute evenly, adjust for narrative pacing)',
      '',
      '[DIRECTORIAL GUIDELINES]',
      '1.  **Narrative Flow**: Break the script into a logical sequence. Ensure visual continuity between shots.',
      '2.  **Visual Translation**: Convert abstract ideas into concrete visual descriptions.',
      '    - Instead of "He is sad", write "Close-up, tears welling up in eyes, low-key lighting".',
      '3.  **Style Enforcement**: Strictly adhere to the ' + styleName + ' style in all visual descriptions.',
      '4.  **Camera Language vs Cinematography Language**:',
      '    - visualPrompt (Camera Language): How to CONSTRUCT the frame - character appearance, actions, expressions, environment, lighting, composition',
      '    - description (Cinematography Language): How the frame MOVES - camera movements, character movements, environmental transitions, temporal progression',
      '5.  **Camera Movements**: In description field, specify professional camera movements (Pan, Tilt, Dolly, Zoom, Tracking) suitable for the mood and scene transitions.',
      '6.  **Visual Consistency**: Maintain identical character features, environment lighting, color palette, and cinematic texture across all shots.',
      '7.  **Shot Duration**: Distribute the total ' + config.duration + ' seconds evenly across ' + config.frameCount + ' shots (~' + Math.round(config.duration / config.frameCount) + ' seconds each). Adjust timing based on narrative pacing: establish shots may be longer, action shots shorter.',
      '8.  **Story Structure (MANDATORY)**: Each shot MUST advance the narrative through these beats:',
      '    - Setup (Shot 1): Introduce scene, character, and context. Establish the world.',
      '    - Build (Shot 2): Develop conflict, tension, or action. Show progression and change.',
      '    - Climax (Shot 3): Peak moment, turning point, or key action. Maximum engagement.',
      '    - Resolution (Shot 4+): Conclude the arc, show results, or reveal outcome.',
      '9.  **Scene Progression**: Each shot MUST show clear progression - NO REPETITION. Include specific details about:',
      '    - Character actions and expressions changing',
      '    - Environment or perspective shifting',
      '    - Time progression (before/during/after)',
      '    - Emotional or physical state evolving',
      '',
      '[OUTPUT CONSTRAINTS]',
      '   - Return ONLY a raw JSON Array. No Markdown blocks, no introductory text.',
      '   - The array must contain exactly ' + config.frameCount + ' objects.',
      '   - **LANGUAGE REQUIREMENT**: visualPrompt and description MUST be in ENGLISH. visualPromptZh and descriptionZh MUST be in CHINESE.',
      '   - **Visual Consistency**: Ensure the main character\'s features remain identical across all visualPrompt fields.',
      '',
      '[JSON SCHEMA]',
      'Strictly follow this structure for each frame:',
      '{',
      '  "visualPrompt": "String (ENGLISH ONLY). CAMERA LANGUAGE - How to construct the frame visually. Detailed image generation prompt. Start with: ' + config.style.name + ' style storyboard sketch. Include: (1) Subject appearance with consistent features and SPECIFIC ACTIONS/EXPRESSIONS, (2) Environment details with consistent lighting/color/atmosphere, (3) Composition, framing, and visual elements. Focus on WHAT the frame looks like, not how it moves.",',
      '  "visualPromptZh": "String (CHINESE ONLY). 相机语言 - 画面怎么构造。包含：(1)角色外观、一致的特征和具体动作/表情，(2)环境细节、光线、色调、氛围，(3)构图、取景和视觉元素。重点是画面看起来怎样，不是怎么动。",',
      '  "description": "String (ENGLISH ONLY). CINEMATOGRAPHY LANGUAGE - How the frame moves and transitions. Include: (1) Narrative beat (Setup/Build/Climax/Resolution), (2) Camera movements (pan, tilt, zoom, tracking, dolly), (3) Character movements and actions, (4) Environmental changes and transitions to next frame, (5) Temporal progression (e.g., \'continues from previous\', \'moments later\', \'accelerates\'). Focus on HOW the frame moves and connects to the next frame.",',
      '  "descriptionZh": "String (CHINESE ONLY). 摄像机语言 - 画面怎么动和怎么衔接。包含：(1)叙事节拍（开场/发展/高潮/结局），(2)摄像机运动（平移、倾斜、缩放、跟拍、推拉），(3)角色运动和动作，(4)环境变化和到下一画面的衔接，(5)时间进展（如"继续上一镜头"、"几分钟后"、"加速"）。重点是画面怎么动和怎么连接到下一个画面。",',
      '  "duration": "Number. Estimated duration in seconds for this shot. Total of all durations should equal ' + config.duration + ' seconds."',
      '}'
    ];
    
    prompt = promptParts.join('\n');
  }

  // 将实际的API请求逻辑封装在一个函数中
  const makeApiRequest = async () => {
    try {
      // 使用新的callLLM函数替代原有API调用
      const messages = [{ role: 'user', content: prompt }];
      console.log('Calling LLM with config:', { 
        provider: llmConfig.provider, 
        model: llmConfig.model,
        baseUrl: llmConfig.baseUrl,
        hasApiKey: !!apiKey
      });
      
      let response;
      try {
        response = await callLLM(messages, apiKey, config.frameCount, llmConfig);
      } catch (apiError) {
        const errorMsg = apiError instanceof Error ? apiError.message : String(apiError);
        console.error("LLM API call failed:", errorMsg);
        console.warn("Falling back to mockFrames due to API error:", errorMsg);
        lastUserScript = config.script || '';
        return mockFrames(config.frameCount, config.script);
      }
      
      console.log('LLM Response received:', { hasChoices: !!response.choices, hasContent: !!response.choices?.[0]?.message?.content });
      
      // 解析响应并映射到StoryboardFrame数组
      if (response.choices && response.choices[0]?.message?.content) {
        let content = response.choices[0].message.content;
        console.log('LLM Content length:', content.length, 'First 100 chars:', content.substring(0, 100));
        
        // 尝试从响应中提取JSON数组
        // 有些LLM会在JSON前后添加markdown代码块或其他文本
        let jsonContent = content;
        
        // 尝试提取```json ... ```中的内容
        const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonBlockMatch) {
          jsonContent = jsonBlockMatch[1].trim();
        }
        
        // 尝试提取[ ... ]中的内容
        if (!jsonContent.startsWith('[')) {
          const arrayMatch = content.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            jsonContent = arrayMatch[0];
          }
        }
        
        // 尝试解析JSON响应
        try {
          const frames = JSON.parse(jsonContent);
          if (Array.isArray(frames) && frames.length > 0) {
            console.log('✅ Successfully parsed LLM response with', frames.length, 'frames (requested:', config.frameCount, ')');
            
            // 如果LLM返回的帧数少于请求的数量，用mockFrames补充
            let finalFrames = frames;
            if (frames.length < config.frameCount) {
              console.warn(`⚠️ LLM returned ${frames.length} frames but ${config.frameCount} were requested. Supplementing with mock frames.`);
              const mockSupplements = mockFrames(config.frameCount - frames.length, config.script);
              finalFrames = [...frames, ...mockSupplements];
            }
            
            return finalFrames.map((frame: any, index: number) => {
              // 确保所有4个字段都有值 - 严格按照字段对应关系
              // visualPrompt: 英文视觉提示词 (用于生图)
              // visualPromptZh: 中文视觉描述 (用于参考)
              // description: 英文视频提示词 (用于视频生成)
              // descriptionZh: 中文视频提示词 (用于视频生成)
              
              // 使用 LLM 返回的值，如果缺失则使用默认值
              const visualPrompt = frame.visualPrompt || 
                `${config.style.name} style storyboard sketch for scene ${index + 1}, simple line art, white background`;
              
              const visualPromptZh = frame.visualPromptZh || 
                `${config.style.nameZh}风格分镜草图 - 第${index + 1}镜，简洁线条，白色背景`;
              
              const description = frame.description || 
                `Scene ${index + 1}: Narrative description and camera direction`;
              
              const descriptionZh = frame.descriptionZh || 
                `第${index + 1}镜：剧情描述和镜头指导`;
              
              return {
                id: index.toString(),
                number: index + 1,
                visualPrompt,
                visualPromptZh,
                description,
                descriptionZh
              };
            });
          }
        } catch (jsonError) {
          console.warn("JSON parse failed:", jsonError, "Content:", content.substring(0, 200));
        }
        
        // 如果JSON解析失败，使用 mockFrames 生成默认分镜
        console.warn("Using mockFrames due to JSON parse failure");
        lastUserScript = config.script || '';
        return mockFrames(config.frameCount, config.script);
      }
      // 保存用户脚本用于 mockFrames
      console.warn("No content in LLM response, using mockFrames");
      lastUserScript = config.script || '';
      return mockFrames(config.frameCount, config.script);
    } catch (error) {
      console.error("Plan Generation Error:", error);
      // 保存用户脚本用于 mockFrames
      lastUserScript = config.script || '';
      return mockFrames(config.frameCount, config.script);
    }
  };

  // 保存用户脚本用于后续可能的 mockFrames 调用
  lastUserScript = config.script || '';
  
  // 将请求添加到队列中
  return requestQueue.addRequest(makeApiRequest);
}

// 根据选择的风格生成相应的提示词
export const buildPrompt = (content: string, styleName: string = '') => {
  // 基础提示词
  let stylePrompt = '';
  
  // 根据风格名称添加相应的风格描述
  switch (styleName.toLowerCase()) {
    case 'custom':
      stylePrompt = 'custom style';
      break;
    case 'scifi':
    case '科幻未来':
      stylePrompt = 'futuristic, clean lines, neon accents, sci-fi style';
      break;
    case 'cyberpunk':
    case '赛博朋克':
      stylePrompt = 'high contrast, gritty, tech elements, cyberpunk style';
      break;
    case 'ink':
    case '水墨国风':
      stylePrompt = 'traditional Asian ink style, fluid, ink wash';
      break;
    case 'anime':
    case '日系动漫':
      stylePrompt = 'anime style, expressive, dynamic angles';
      break;
    case 'noir':
    case '黑白电影':
      stylePrompt = 'film noir, heavy shadows, high contrast black and white';
      break;
    case 'sketch':
    case '极简素描':
      stylePrompt = 'minimal sketch, rough pencil, loose lines';
      break;
    case 'clay':
    case '粘土风格':
      stylePrompt = 'claymation style, plasticine texture, stop motion look';
      break;
    case 'lego':
    case '乐高积木':
      stylePrompt = 'voxel art, 3D blocks, lego style';
      break;
    case 'steampunk':
    case '蒸汽朋克':
      stylePrompt = 'steampunk style, brass, gears, victorian retro';
      break;
    case 'vangogh':
    case '梵高抽象':
      stylePrompt = 'van gogh style, oil painting, swirling strokes';
      break;
    default:
      // 默认使用极简线稿风格 - 强调细线条，禁止大块黑色
      stylePrompt = 'simple line art, thin pencil sketch, very fine outlines only, pure white background, no fill, no shading, no solid areas, minimal strokes, sparse lines';
  }
  
  // 强制添加严格的线稿约束，避免大块黑色
  const lineArtConstraint = ', CRITICAL: thin line drawing ONLY, absolutely NO black fill, NO solid black areas, pure white background, sketch style, outline only, NO heavy shadows, NO dark areas, minimal strokes, sparse lines, light gray lines maximum';
  
  return `${content}, storyboard, ${stylePrompt}${lineArtConstraint}`;
}

// 新的LLM请求函数，使用相对路径指向边缘函数
export async function callLLM(messages: any[], userKey: string, frameCount?: number, llmConfig?: ApiConfig) {
    // 检查是否为速创Gemini API
    const isSuCreativeGemini = llmConfig?.baseUrl?.includes('wuyinkeji.com/api/chat/index');
    
    if (isSuCreativeGemini) {
      // 速创Gemini API的特殊处理
      // 获取用户的prompt内容
      const userContent = messages.find(msg => msg.role === 'user')?.content || '';
      
      // 构建请求参数
      const params = {
        key: userKey, // 添加接口密钥参数
        content: userContent,
        model: llmConfig.model || 'gemini-3-pro'
      };
      
      // 生成签名
      const signature = generateSignature(params, userKey);
      
      // 确定请求URL，开发环境使用代理
      const isProduction = process.env.NODE_ENV === 'production';
      let requestUrl;
      
      if (isProduction) {
        // 生产环境直接使用速创API地址
        requestUrl = llmConfig.baseUrl;
      } else {
        // 开发环境使用代理
        requestUrl = '/api/sucreative';
      }
      
      const res = await fetchRetry(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          ...params,
          sign: signature
        }).toString()
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Sucreative API Error:', { status: res.status, error: errorText });
        throw new Error(`Sucreative API Error: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Sucreative API Response:', { hasData: !!data.data, dataLength: data.data?.length });
      
      // 将速创API的响应转换为标准格式
      if (!data.data) {
        console.warn('Sucreative API returned empty data');
        throw new Error('Sucreative API returned empty data');
      }
      
      return {
        choices: [{
          message: {
            content: data.data
          }
        }]
      };
    } else {
      // 处理其他OpenAI兼容API的请求，统一使用我们的本地API端点
      console.log('Calling LLM API with config:', { 
        provider: llmConfig.provider, 
        model: llmConfig.model,
        baseUrl: llmConfig.baseUrl,
        hasUserKey: !!userKey,
        userKeyLength: userKey?.length || 0,
        messagesCount: messages.length,
        firstMessageLength: messages[0]?.content?.length || 0
      });
      
      const requestBody = {
        messages: messages,
        frameCount: frameCount,
        apiConfig: llmConfig
      };
      
      console.log('LLM API Request body size:', JSON.stringify(requestBody).length, 'bytes');
      
      const response = await fetchRetry('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SF-Key': userKey
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('LLM API Response status:', response.status, 'statusText:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('LLM API Error Response:', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText 
        });
        throw new Error('API Error: ' + response.status + ' - ' + errorText);
      }
      
      const data = await response.json();
      console.log('LLM API Response data:', { 
        hasChoices: !!data.choices,
        hasContent: !!data.choices?.[0]?.message?.content,
        contentLength: data.choices?.[0]?.message?.content?.length,
        hasError: !!data.error
      });
      
      // 检查响应中是否包含错误信息
      if (data.error) {
        console.error('LLM API returned error in response body:', data.error);
        throw new Error('LLM API Error: ' + (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)));
      }
      
      // 检查响应是否包含有效的choices数据
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('LLM API returned invalid response structure:', data);
        throw new Error('LLM API returned invalid response structure: no choices found');
      }
      
      return data;
    }
}

// 实现图片快速草稿模式
export async function quickDraft(prompt: string, settings: AppSettings) {
  const imgConfig = settings.image;
  const apiKey = getApiKey(imgConfig);
  
  // 强制使用付费通道，必须提供API密钥
  if (!apiKey) {
    throw new Error('API密钥不能为空，请在设置中配置您的API密钥');
  }
  
  // 构建提示词 - 强调简洁线条，避免大面积黑色填充，确保内容在画面内
  const apiPrompt = `${prompt}, CRITICAL: thin line art sketch ONLY, light gray or black outlines ONLY, pure white background, absolutely NO fill, NO shading, NO solid black areas, NO dark areas, minimal strokes, storyboard style, clean and sparse lines, full body in frame, centered composition, all elements fully visible within frame boundaries, no cropping, light sketch style`;
  
  // 根据用户配置的API提供商选择不同的处理方式
  let requestBody: any;
  
  // 检测API类型
  const isZhipuApi = imgConfig.provider === 'zhipu' || imgConfig.baseUrl?.includes('bigmodel.cn') || imgConfig.model?.includes('cogview');
  const isSucreativeApi = imgConfig.provider === 'sucreative' || imgConfig.baseUrl?.includes('wuyinkeji.com') || imgConfig.model?.includes('nano-banana');
  
  if (isSucreativeApi) {
    // 速创API
    requestBody = {
      prompt: apiPrompt,
      aspectRatio: "1:1",
      imageSize: "1K",
      model: imgConfig.model || 'nano-banana',
      apiConfig: {
        baseUrl: imgConfig.baseUrl || 'https://api.wuyinkeji.com/api/img',
        defaultModel: imgConfig.model || 'nano-banana',
        provider: 'sucreative'
      }
    };
  } else if (isZhipuApi) {
    // 智谱API
    requestBody = {
      prompt: apiPrompt,
      size: '1024x1024',
      quality: imgConfig.quality || 'standard',
      watermark_enabled: false, // 始终禁用水印
      user_id: 'storyboard-user',
      apiConfig: {
        baseUrl: imgConfig.baseUrl || 'https://open.bigmodel.cn/api/paas/v4',
        defaultModel: imgConfig.model || 'cogview-4-250304',
        provider: 'zhipu'
      }
    };
  } else {
    // 默认使用硅基流动API
    requestBody = {
      model: imgConfig.model || 'black-forest-labs/FLUX.1-schnell',
      prompt: apiPrompt,
      n: 1,
      size: '1024x1024',
      steps: 4,
      apiConfig: {
        baseUrl: imgConfig.baseUrl || 'https://api.siliconflow.cn/v1',
        defaultModel: imgConfig.model || 'black-forest-labs/FLUX.1-schnell',
        provider: 'siliconflow'
      }
    };
  }
  
  return fetchRetry('/api/ai/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SF-Key': apiKey
    },
    body: JSON.stringify(requestBody)
  }).then(r => r.json())
    .then(data => {
      // 确保返回与原有格式兼容的响应
      if (data.data) {
        return { data: data.data };
      } else if (data.images) {
        return {
          data: data.images.map((img: any) => ({ url: img }))
        };
      } else {
        // 直接返回API响应，如果已经是兼容格式
        return data;
      }
    });
}

export const generateFrameImage = async (frame: StoryboardFrame, styleName: string, settings: AppSettings, config?: { referenceImage?: string }): Promise<string> => {
  const imgConfig = settings.image;
  const apiKey = getApiKey(imgConfig);

  // 根据用户语言和可用提示词选择合适的内容
  let content: string;
  if (settings.language === 'zh' && frame.visualPromptZh) {
    // 中文环境优先使用中文视觉提示词
    content = frame.visualPromptZh;
  } else if (settings.language === 'zh' && frame.descriptionZh) {
    // 中文环境如果没有中文视觉提示词，使用中文描述
    content = frame.descriptionZh;
  } else {
    // 英文环境或没有中文提示词时，使用英文提示词
    content = frame.visualPrompt || frame.description;
  }
  
  let prompt: string;
  // 强制使用付费通道，必须提供API密钥
  if (!apiKey) {
    throw new Error('API密钥不能为空，请在设置中配置您的API密钥');
  }
  
  // 构建基础提示词
  let basePrompt = content;
  
  // 如果有参考主体图片，将其添加到提示词中
  if (config?.referenceImage) {
    basePrompt += `. 必须严格使用提供的参考主体图片中的物体外观，保持主体外观100%一致`;
  }
  
  // 构建正式提示词
  if (imgConfig.provider === 'siliconflow' || imgConfig.baseUrl?.includes('siliconflow.cn')) {
    // 硅基流动API
    prompt = buildPrompt(basePrompt, styleName);
  } else {
    // 其他API提供商使用风格化提示词
    prompt = buildPrompt(basePrompt, styleName);
  }

  const maxRetries = 5; // 增加最大重试次数到5次
  const baseDelay = 3000; // 增加基础延迟时间到3秒

  // 将实际的API请求逻辑封装在一个函数中
  const makeApiRequest = async () => {
    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        // 根据不同的API提供商选择不同的实现
        if (imgConfig.provider === 'zhipu' || imgConfig.baseUrl?.includes('bigmodel.cn') || imgConfig.model?.includes('cogview')) {
          // 智谱图像生成API
          const response = await fetchRetry('/api/ai/image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-SF-Key': apiKey
            },
            body: JSON.stringify({
              prompt,
              size: '512x512',
              quality: imgConfig.quality, // 添加质量参数
              watermark_enabled: false, // 始终禁用水印
              user_id: 'storyboard-user', // 智谱API必填参数
              apiConfig: {
                provider: 'zhipu',
                baseUrl: imgConfig.baseUrl || 'https://open.bigmodel.cn/api/paas/v4',
                defaultModel: imgConfig.model || 'cogview-4-250304'
              }
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Zhipu API Error: ${errorData.error || response.statusText}`);
          }
          
          const data = await response.json();
          if (data.data?.[0]?.url) {
            return data.data[0].url;
          } else {
            throw new Error('No image URL in response');
          }
        } else if (imgConfig.provider === 'sucreative' || imgConfig.baseUrl?.includes('wuyinkeji.com') || imgConfig.model?.includes('nano-banana')) {
          // 速创图像生成API
          return await generateImageOpenAI(prompt, imgConfig, apiKey);
        } else {
          // 使用用户配置的API
          // 根据baseUrl智能检测实际的API提供商
          let actualProvider: string = imgConfig.provider;
          let actualBaseUrl: string | undefined = imgConfig.baseUrl;
          let actualModel: string | undefined = imgConfig.model;
          
          // 如果baseUrl包含速创API的域名，强制使用速创配置
          if (imgConfig.baseUrl?.includes('wuyinkeji.com')) {
            actualProvider = 'sucreative';
            actualModel = actualModel || 'nano-banana';
            console.log('检测到速创API URL，自动切换到速创配置');
            // 使用generateImageOpenAI处理速创API
            return await generateImageOpenAI(prompt, imgConfig, apiKey);
          }
          
          // 如果baseUrl包含智谱API的域名，使用智谱配置
          if (imgConfig.baseUrl?.includes('bigmodel.cn')) {
            actualProvider = 'zhipu';
            actualBaseUrl = actualBaseUrl || 'https://open.bigmodel.cn/api/paas/v4';
            actualModel = actualModel || 'cogview-4-250304';
          }
          
          // 默认使用硅基流动
          if (!actualBaseUrl) {
            actualBaseUrl = 'https://api.siliconflow.cn/v1';
            actualModel = actualModel || 'black-forest-labs/FLUX.1-schnell';
          }
          
          const response = await fetchRetry('/api/ai/image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-SF-Key': apiKey
            },
            body: JSON.stringify({
              prompt,
              size: '512x512',
              quality: imgConfig.quality,
              watermark_enabled: false, // 始终禁用水印
              user_id: 'storyboard-user',
              apiConfig: {
                provider: actualProvider,
                baseUrl: actualBaseUrl,
                defaultModel: actualModel
              }
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error || response.statusText}`);
          }
          
          const data = await response.json();
          if (data.data?.[0]?.url) {
            return data.data[0].url;
          } else {
            throw new Error('No image URL in response');
          }
        }
      } catch (error) {
          console.error('Image Gen Error (attempt ' + (retry + 1) + '/' + (maxRetries + 1) + '):', error);
        
        // Detailed error handling for quota/rate limits
        const errMsg = (error instanceof Error) ? error.message : String(error);
        // 更全面地识别速率限制错误
        const isRateLimitError = 
          errMsg.includes('429') || 
          errMsg.includes('Too Many Requests') || 
          errMsg.includes('quota') || 
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('rate limit') ||
          errMsg.includes('exceeded your quota') ||
          errMsg.includes('request limit');
        
        // 如果是速率限制错误且还有重试次数，进行重试
        if (isRateLimitError && retry < maxRetries) {
          // 更激进的指数退避策略，同时加入随机延迟避免请求风暴
          const delayTime = baseDelay * Math.pow(2, retry) + Math.random() * 1000; 
          console.log('Rate limit hit, retrying after ' + Math.round(delayTime) + 'ms...');
          await new Promise(resolve => setTimeout(resolve, delayTime));
          continue;
        }
        
        // 如果不是速率限制错误，或者重试次数用完，返回占位图
        if (isRateLimitError) {
          return getPlaceholderImage('Quota Exceeded / Rate Limit');
        }
        return getPlaceholderImage('Image Gen Failed');
      }
    }
    
    // 理论上不会到达这里，但为了类型安全，返回一个占位图
    return getPlaceholderImage('Image Gen Failed');
  };

  // 将请求添加到队列中
  return requestQueue.addRequest(makeApiRequest);
}

// --- Implementations ---

async function generatePlanGemini(prompt: string, config: ApiConfig, apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: config.model || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            visualPrompt: { type: Type.STRING },
            visualPromptZh: { type: Type.STRING },
            description: { type: Type.STRING },
            descriptionZh: { type: Type.STRING },
          },
          required: ['visualPrompt', 'description']
        }
      }
    }
  });
  const data = JSON.parse(response.text || '[]');
  return mapToFrames(data);
}

async function generatePlanOpenAI(prompt: string, config: ApiConfig, apiKey: string) {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  
  // 在生产环境中直接使用原始API地址，开发环境使用代理
  const isProduction = process.env.NODE_ENV === 'production';
  let requestUrl: string;
  
  if (isProduction) {
    // 生产环境直接使用原始API地址
    requestUrl = baseUrl;
  } else {
    // 开发环境使用代理避免CORS
    let proxyUrl: string;
    if (baseUrl.includes('deepseek.com')) {
      proxyUrl = '/api/deepseek';
    } else if (baseUrl.includes('openai.com')) {
      proxyUrl = '/api/openai';
    } else if (baseUrl.includes('bigmodel.cn')) {
      proxyUrl = '/api/zhipu';
    } else if (baseUrl.includes('dashscope.aliyuncs.com')) {
      proxyUrl = '/api/qwen';
    } else if (baseUrl.includes('moonshot.cn')) {
      proxyUrl = '/api/moonshot';
    } else if (baseUrl.includes('volces.com')) {
      proxyUrl = '/api/doubao';
    } else if (baseUrl.includes('hunyuan.cloud.tencent.com')) {
      proxyUrl = '/api/hunyuan';
    } else if (baseUrl.includes('siliconflow.cn')) {
      proxyUrl = '/api/siliconflow';
    } else if (baseUrl.includes('wuyinkeji.com')) {
      proxyUrl = '/api/sucreative';
    } else {
      proxyUrl = baseUrl;
    }
    requestUrl = proxyUrl;
  }
  
  // 构建完整路径，确保代理后仍然包含版本号
  // 对于包含版本号的API，直接使用端点
  // 对于不包含版本号的API，添加v1版本号
  const endpoint = '/v1/chat/completions';
  
  let fullUrl;
  if (isProduction) {
    // 生产环境直接构建完整URL
    // 检查baseUrl是否已经包含版本号
    const urlParts = baseUrl.split('/');
    const versionIndex = urlParts.findIndex(part => part.startsWith('v'));
    
    if (versionIndex > -1) {
      // 如果baseUrl已经包含版本号，只拼接端点的资源路径部分
      const endpointPath = endpoint.substring(endpoint.indexOf('/', 1)); // 去掉开头的/v1部分
      if (baseUrl.endsWith('/')) {
        fullUrl = baseUrl + endpointPath.slice(1); // 移除端点路径开头的斜杠
      } else {
        fullUrl = baseUrl + endpointPath;
      }
    } else {
      // 如果baseUrl没有版本号，使用完整的endpoint
      if (baseUrl.endsWith('/')) {
        fullUrl = baseUrl + endpoint.slice(1); // 移除端点开头的斜杠
      } else {
        fullUrl = baseUrl + endpoint;
      }
    }
  } else {
    // 开发环境使用代理URL构建
    // 提取原始URL中的路径部分（包括版本号）
    const urlParts = baseUrl.split('/');
    const versionIndex = urlParts.findIndex(part => part === 'v1' || part === 'v2');
    
    if (versionIndex > -1) {
      // 如果原始URL包含版本号，提取版本号和之后的路径
      const versionPath = urlParts.slice(versionIndex).join('/');
      fullUrl = requestUrl + '/' + versionPath + (endpoint.startsWith('/') ? '' : '/') + endpoint;
    } else {
      // 如果原始URL没有版本号，使用默认的v1版本号
      fullUrl = requestUrl + '/v1' + endpoint;
    }
  }
  
  // 根据不同API提供商构建请求体
  const requestBody: any = {
    model: config.model,
    messages: [{ role: 'user', content: prompt }]
  };
  
  // 只有当不是硅基流动API时，才添加response_format参数
  if (!baseUrl.includes('siliconflow.cn')) {
    requestBody.response_format = { type: "json_object" };
  }
  
  const response = await fetchRetry(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) throw new Error('OpenAI API Error: ' + response.statusText);
  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  // 增强JSON解析容错性
  let parsed;
  try {
    // 清理内容，移除可能的markdown代码块标记
    let cleanContent = content;
    if (cleanContent) {
      // 移除可能的JSON代码块标记
      // 移除可能的JSON代码块标记
      // 使用转义反引号检查字符串开头
        const tripleBacktickJson = '\`\`\`json';
        if (cleanContent.startsWith(tripleBacktickJson)) {
          cleanContent = cleanContent.substring(tripleBacktickJson.length); // 移除JSON代码块标记
          // 移除后面的换行符
          if (cleanContent.startsWith('\n')) cleanContent = cleanContent.substring(1);
          if (cleanContent.startsWith('\r')) cleanContent = cleanContent.substring(1);
        }
        // 移除结尾的代码块标记
        const tripleBacktick = '\`\`\`';
        if (cleanContent.endsWith(tripleBacktick)) {
          cleanContent = cleanContent.substring(0, cleanContent.length - tripleBacktick.length);
        }
      cleanContent = cleanContent.trim();
      
      // 尝试解析JSON
      const json = JSON.parse(cleanContent);
      if (Array.isArray(json)) parsed = json;
      else if (json.frames && Array.isArray(json.frames)) parsed = json.frames;
      else if (typeof json === 'object' && json !== null) {
        // 尝试获取第一个数组值
        const values = Object.values(json);
        parsed = values.find(v => Array.isArray(v)) as any[] || values[0] as any[];
      } else {
        throw new Error("No valid frames array found in JSON response");
      }
    } else {
      throw new Error("No content in API response");
    }
  } catch (e) {
    console.error('JSON parsing error:', e, 'Content:', content);
    // 如果解析失败，返回模拟数据而不是抛出错误
    console.warn('Using mock frames due to JSON parsing failure');
    return mockFrames(5); // 返回5个模拟帧作为降级方案
  }
  return mapToFrames(parsed);
}

async function generateImageGemini(prompt: string, config: ApiConfig, apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: config.model || 'gemini-2.5-flash-image',
    contents: prompt
  });
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return 'data:' + part.inlineData.mimeType + ';base64,' + part.inlineData.data;
      }
    }
  }
  throw new Error("No image data in Gemini response");
}

// 支持参考图片的Gemini API调用
async function generateImageGeminiWithReference(prompt: string, config: ApiConfig, apiKey: string, referenceImage: string) {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: config.model || 'gemini-2.5-flash-image',
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { data: referenceImage.split(',')[1], mimeType: 'image/png' } }
        ]
      }
    ]
  });
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return 'data:' + part.inlineData.mimeType + ';base64,' + part.inlineData.data;
      }
    }
  }
  throw new Error("No image data in Gemini response with reference");
}

async function generateImageOpenAI(prompt: string, config: ApiConfig, apiKey: string) {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 统一使用代理API，避免CORS问题
  // 生产环境和开发环境都使用/api/ai/image代理
  
  // 构建完整路径
  let fullUrl;
  let body: any;
  
  // 特殊处理速创API - 使用统一的代理端点
  if (baseUrl.includes('wuyinkeji.com')) {
    // 速创API使用/api/ai/image代理
    fullUrl = '/api/ai/image';
    
    // 速创API的请求参数格式
    body = {
      prompt: prompt,
      aspectRatio: "1:1",
      imageSize: "1K",
      model: config.model || 'nano-banana',
      apiConfig: {
        baseUrl: baseUrl,
        defaultModel: config.model || 'nano-banana',
        provider: 'sucreative'
      }
    };
  } else if (baseUrl.includes('bigmodel.cn')) {
    // 智谱API - 使用统一的代理端点
    fullUrl = '/api/ai/image';
    
    body = {
      model: config.model || 'cogview-4-250304',
      prompt: prompt,
      size: '1024x1024',
      user_id: 'storyboard-user',
      quality: 'standard',
      watermark_enabled: false,
      apiConfig: {
        baseUrl: baseUrl,
        defaultModel: config.model || 'cogview-4-250304',
        provider: 'zhipu'
      }
    };
  } else {
    // 其他OpenAI兼容API - 使用统一的代理端点
    fullUrl = '/api/ai/image';
    
    body = {
      model: config.model,
      prompt: prompt,
      n: 1,
      size: "384x384",
      response_format: "b64_json",
      apiConfig: {
        baseUrl: baseUrl,
        defaultModel: config.model,
        provider: 'openai'
      }
    };
  }

  // 统一使用X-SF-Key头传递API密钥
  const response = await fetchRetry(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SF-Key': apiKey
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // 检查是否是速创API的403错误
    if (baseUrl.includes('wuyinkeji.com') && response.status === 403) {
      throw new Error('速创API调用失败: API密钥无效或已过期');
    }
    throw new Error('API Error: ' + (errorData.msg || response.statusText));
  }
  
  const data = await response.json();
  
  // 特殊处理速创API的响应格式
  if (baseUrl.includes('wuyinkeji.com')) {
    if (data.code === 0 && data.data?.id) {
      // 速创API返回的是任务ID，需要进一步查询结果
      const taskId = data.data.id;
      console.log('速创API返回任务ID:', taskId, '开始轮询查询结果');
      // 轮询查询任务结果
      const imageUrl = await pollSucreativeTaskResult(taskId, baseUrl, apiKey, isProduction);
      return imageUrl;
    } else {
      // 根据不同的错误码提供更具体的错误信息
      let errorMsg = '速创API调用失败: ' + (data.msg || '未知错误');
      if (data.code === 403) {
        errorMsg = '速创API调用失败: API密钥无效或已过期，请检查API密钥设置';
      } else if (data.code === 429) {
        errorMsg = '速创API调用失败: 超出请求频率限制，请稍后再试';
      } else if (data.code === 400) {
        errorMsg = '速创API调用失败: 请求参数错误，请检查API配置';
      } else if (data.code === 500) {
        errorMsg = '速创API调用失败: 服务器内部错误，请稍后再试';
      }
      throw new Error(errorMsg);
    }
  } else {
    // 其他OpenAI兼容API的响应处理
    const b64 = data.data?.[0]?.b64_json;
    if (b64) return 'data:image/png;base64,' + b64;
    const url = data.data?.[0]?.url;
        // 在生产环境中，直接返回URL而不转换为base64
      // 避免因CORS问题导致图片加载失败
      if (process.env.NODE_ENV === 'production') {
        return url;
      }
      
      // 在开发环境中，尝试转换为base64以避免连接问题
      try {
        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        const imageResponse = await fetch(url, {
          signal: controller.signal,
          mode: 'no-cors' // 使用no-cors模式避免CORS问题
        });
        
        clearTimeout(timeoutId);
        
        if (imageResponse.type === 'opaque') {
          // 如果是opaque响应（no-cors模式下的跨域响应），直接返回URL
          return url;
        }
        
        if (!imageResponse.ok) throw new Error('Failed to fetch image: ' + imageResponse.statusText);
        const blob = await imageResponse.blob();
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error converting URL to base64:', error);
        // Fallback to URL if conversion fails
        return url;
      }
    }
    throw new Error("No image data in OpenAI response");
  }

// 轮询速创API的任务结果
async function pollSucreativeTaskResult(taskId: string, baseUrl: string, apiKey: string, isProduction: boolean) {
  const pollInterval = 2000; // 轮询间隔（毫秒）
  const maxRetries = 30; // 最大重试次数
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // 构建轮询请求URL
      let pollUrl: string;
      if (isProduction) {
        // 生产环境直接使用完整的速创API地址
        const basePath = baseUrl.endsWith('/nanoBanana') ? baseUrl.slice(0, -11) : 
                       baseUrl.endsWith('/api/img/nanoBanana') ? baseUrl.slice(0, -20) : 
                       baseUrl;
        pollUrl = basePath + '/api/img/status?id=' + taskId;
      } else {
        // 开发环境使用代理
        pollUrl = '/api/sucreative/api/img/status?id=' + taskId;
      }

      // 发送轮询请求
      const response = await fetchRetry(pollUrl, {
        method: 'GET',
        headers: {
          'Authorization': apiKey, // 速创API要求直接使用密钥，不需要Bearer前缀
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error('轮询API错误: ' + (errorData.msg || response.statusText));
      }

      const pollData = await response.json();

      // 处理轮询响应
      if (pollData.code === 0 && pollData.data) {
        const taskStatus = pollData.data.status;
        if (taskStatus === 'done' && pollData.data.url) {
          // 任务完成，返回图片URL
          return pollData.data.url;
        } else if (taskStatus === 'failed') {
          // 任务失败
          throw new Error('速创API图片生成失败: ' + (pollData.data.msg || '未知错误'));
        } else if (taskStatus === 'processing') {
          // 任务仍在处理中，继续轮询
          console.log('速创API任务正在处理中，等待再次轮询...', { taskId, retries });
          retries++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } else {
          // 未知状态
          console.warn('速创API返回未知状态:', taskStatus, { taskId });
          retries++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      } else {
        // API返回错误
        throw new Error('速创API轮询失败: ' + (pollData.msg || '未知错误'));
      }
    } catch (error) {
      console.error('速创API轮询错误:', error, { taskId });
      retries++;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  // 超过最大重试次数
  throw new Error('速创API轮询超时，未能获取图片结果');
}

function mapToFrames(data: any[]): Partial<StoryboardFrame>[] {
  return data.map((item: any, index: number) => ({
    id: 'frame-' + Date.now() + '-' + index,
    number: index + 1,
    description: item.description,
    descriptionZh: item.descriptionZh || item.description, // Fallback
    visualPrompt: item.visualPrompt,
    visualPromptZh: item.visualPromptZh || item.visualPrompt, // Fallback
    symbols: []
  }));
}

// 存储用户脚本内容，用于生成基于用户输入的 mock 数据
let lastUserScript = '';

const mockFrames = (count: number, userScript?: string): Partial<StoryboardFrame>[] => {
  // 使用传入的脚本或最后保存的脚本
  const script = userScript || lastUserScript || 'scene';
  
  // 截断脚本到合理长度（用于视觉提示词）
  const scriptSummary = script.length > 100 ? script.substring(0, 100) + '...' : script;
  
  console.log('Generating mock frames with script:', { 
    scriptLength: script.length, 
    summary: scriptSummary,
    count 
  });
  
  return Array.from({ length: count }).map((_, i) => ({
    id: 'mock-' + i,
    number: i + 1,
    // description: 英文视频提示词 - 不包含用户脚本
    description: `Scene ${i + 1}: Narrative description and camera direction`,
    // descriptionZh: 中文视频提示词 - 不包含用户脚本
    descriptionZh: `第${i + 1}镜：剧情描述和镜头指导`,
    // visualPrompt: 英文视觉提示词 - 用于生图，包含用户脚本摘要
    visualPrompt: `Storyboard sketch: ${scriptSummary} - scene ${i + 1}, simple line art style, white background`,
    // visualPromptZh: 中文视觉描述 - 参考用，包含用户脚本摘要
    visualPromptZh: `分镜草图：${scriptSummary} - 第${i + 1}镜，简洁线条风格，白色背景`,
    symbols: []
  }));
};

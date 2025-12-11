
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardFrame, ProjectConfig, AppSettings, ApiConfig } from "../types";
import { requestQueue } from './requestQueue';

const ENV_API_KEY = process.env.API_KEY || '';
const getApiKey = (config: ApiConfig): string => config.apiKey || ENV_API_KEY;

const getPlaceholderImage = (text: string) => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
    '<rect width="100%" height="100%" fill="#f3f4f6"/>' +
    '<text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="#9ca3af" text-anchor="middle" dy=".3em">' + text + '</text>' +
  '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
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
       // OpenAI Compatible Test
       const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
       
       // 在生产环境中直接使用原始API地址，开发环境使用代理
       const isProduction = import.meta.env.PROD;
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
         } else {
           proxyUrl = baseUrl;
         }
         requestUrl = proxyUrl;
       }
       
       // 根据API类型选择正确的端点
       const endpoint = type === 'image' ? '/images/generations' : '/chat/completions';
       
       let fullUrl;
       if (isProduction) {
         // 生产环境直接构建完整URL
         if (baseUrl.endsWith('/')) {
           fullUrl = baseUrl + endpoint.slice(1); // 移除端点开头的斜杠
         } else {
           fullUrl = baseUrl + endpoint;
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
       
       // 根据端点类型构建不同的请求体
       const requestBody = type === 'image' ? {
         model: config.model,
         prompt: 'A simple test image',
         n: 1,
         size: '256x256'
       } : {
         model: config.model,
         messages: [{role: 'user', content: 'Hi'}]
       };
       
       console.log('API Test Details:', {
         provider: config.provider,
         type: type,
         baseUrl: baseUrl,
         isProduction: isProduction,
         requestUrl: requestUrl,
         fullUrl: fullUrl,
         requestBody: requestBody
       });
       
       const res = await fetch(fullUrl, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': 'Bearer ' + apiKey
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
      
      // 使用代理避免CORS
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
      } else {
        proxyUrl = baseUrl;
      }
      
      // 构建完整路径，确保代理后仍然包含版本号
      const endpoint = '/chat/completions';
      const proxyHasV1 = proxyUrl.includes('v1');
      
      let fullUrl;
      if (proxyHasV1) {
        fullUrl = proxyUrl + endpoint;
      } else if (baseUrl.includes('v1')) {
        fullUrl = proxyUrl + '/v1' + endpoint;
      } else {
        fullUrl = proxyUrl + '/v1' + endpoint;
      }
      
      console.log('Translation API request:', {
        url: fullUrl,
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey.substring(0, 10) + '...' // 只显示API密钥的前10个字符
      },
        body: JSON.stringify({
          model: llmConfig.model,
          messages: [{role: 'user', content: prompt}],
          max_tokens: 500,
          temperature: 0.1
        })
      });
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
        body: JSON.stringify({
          model: llmConfig.model,
          messages: [{role: 'user', content: prompt}],
          max_tokens: 500,
          temperature: 0.1
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
  // 检测常见的脚本结构化模式
  const patterns = [
    /^\s*[0-9]+\.\s+/gm, // 数字编号 (1. , 2. , etc.)
    /^\s*[a-zA-Z]+\.\s+/gm, // 字母编号 (a. , b. , etc.)
    /^\s*\([0-9]+\)\s+/gm, // 括号数字 ((1) , (2) , etc.)
    /^\s*\([a-zA-Z]+\)\s+/gm, // 括号字母 ((a) , (b) , etc.)
    /^\s*[-*+]\s+/gm, // 项目符号 (- , * , +)
    /^\s*\d+:\s+/gm, // 时间戳或序号 (1: , 2: , etc.)
    /^\s*Scene\s+[0-9]+/i, // 场景编号 (Scene 1, SCENE 2, etc.)
    /^\s*Shot\s+[0-9]+/i // 镜头编号 (Shot 1, SHOT 2, etc.)
  ];
  
  // 如果有任何模式匹配1次或更多，认为是结构化脚本
  return patterns.some(pattern => {
    const matches = script.match(pattern);
    return matches && matches.length >= 1;
  });
}

// 将结构化脚本拆分为帧
function splitStructuredScript(script: string, settings: AppSettings): Partial<StoryboardFrame>[] {
  const lines = script.split('\n');
  const frames: Partial<StoryboardFrame>[] = [];
  const pattern = /^(\s*([0-9]+\.|[a-zA-Z]+\.|\([0-9]+\)|\([a-zA-Z]+\)|[-*+]|\d+:\s*|Scene\s+[0-9]+|Shot\s+[0-9]+)\s*)(.*)$/i;
  let currentContent = '';
  let frameNumber = 1;
  
  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      // 如果已经有内容，先保存当前内容为一帧
      if (currentContent.trim()) {
        frames.push({
          number: frameNumber++,
          description: currentContent.trim(),
          descriptionZh: currentContent.trim(),
          visualPrompt: 'Storyboard sketch of: ' + currentContent.trim(),
          visualPromptZh: '分镜草图: ' + currentContent.trim()
        });
        currentContent = '';
      }
      // 添加新帧的内容（去掉编号部分）
      currentContent = match[3];
    } else if (line.trim()) {
      // 如果不是新的编号行，添加到当前内容
      currentContent += (currentContent ? ' ' : '') + line.trim();
    }
  }
  
  // 保存最后一帧
  if (currentContent.trim()) {
    frames.push({
      number: frameNumber++,
      description: currentContent.trim(),
      descriptionZh: currentContent.trim(),
      visualPrompt: 'Storyboard sketch of: ' + currentContent.trim(),
      visualPromptZh: '分镜草图: ' + currentContent.trim()
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

  // 仅在开发环境输出调试日志
  if (!import.meta.env.PROD) {
    console.log("AI创意优化状态:", config.useAIoptimization);
    console.log("脚本内容:", config.script);
    console.log("是否为结构化脚本:", isStructuredScript(config.script));
  }

  // 检查是否取消了AI创意优化且脚本是结构化的
  if (!config.useAIoptimization && isStructuredScript(config.script)) {
    if (!import.meta.env.PROD) {
      console.log("使用结构化脚本，不进行AI创意优化");
    }
    const frames = splitStructuredScript(config.script, settings);
    if (!import.meta.env.PROD) {
      console.log("拆分后的分镜:", frames);
    }
    // 如果用户设置了分镜数量，只返回前N帧
    return config.frameCount > 0 ? frames.slice(0, config.frameCount) : frames;
  } else if (!config.useAIoptimization && !import.meta.env.PROD) {
    console.log("取消了AI创意优化，但脚本不是结构化的");
  }

  if (!apiKey && llmConfig.provider === 'gemini') {
    console.warn("No API Key found, using mock data");
    return mockFrames(config.frameCount);
  }

  // Optimized System Prompt with "Analyze-Optimize-Verify" logic
  const styleName = settings.language === 'zh' ? config.style.nameZh : config.style.name;
  
  // 使用字符串数组和join方法来构建长字符串，避免复杂的引号转义
  const promptParts = [
    'You are an expert AI Film Director and Cinematographer.',
    'Your mission is to convert a text script into a structured, cinematic storyboard sequence (JSON format) suitable for AI video generation.',
    '',
    '[PROJECT SETTINGS]',
    '- Core Script: "' + config.script + '"',
    '- Visual Style: ' + styleName + ' (' + config.style.description + ')',
    '- Duration: ' + config.duration + ' seconds',
    '- Target Shot Count: ' + config.frameCount + ' keyframes',
    '',
    '[DIRECTORIAL GUIDELINES]',
    '1.  **Narrative Flow**: Break the script into a logical sequence. Ensure visual continuity between shots.',
    '2.  **Visual Translation**: Convert abstract ideas into concrete visual descriptions.',
    '    - Instead of "He is sad", write "Close-up, tears welling up in eyes, low-key lighting".',
    '3.  **Style Enforcement**: Strictly adhere to the ' + styleName + ' style in all visual descriptions.',
    '4.  **Camera Work**: Assign professional camera movements (Pan, Tilt, Dolly, Zoom) suitable for the mood.',
    '',
    '[OUTPUT CONSTRAINTS]',
    '   - Return ONLY a raw JSON Array. No Markdown blocks, no introductory text.',
    '   - The array must contain exactly ' + config.frameCount + ' objects.',
    '   - **Visual Consistency**: Ensure the main character\'s features remain identical across all visualPrompt fields.',
    '',
    '[JSON SCHEMA]',
    'Strictly follow this structure for each frame:',
    '{',
    '  "visualPrompt": "String (English). Detailed image generation prompt. Start with: ' + config.style.name + ' style storyboard sketch...",',
    '  "visualPromptZh": "String (Chinese). 对应英文的中文视觉描述。",',
    '  "description": "String (English). Concise technical instruction for motion.",',
    '  "descriptionZh": "String (Chinese). 简练的导演指令。"',
    '}'
  ];
  
  const prompt = promptParts.join('\n');

  // 将实际的API请求逻辑封装在一个函数中
  const makeApiRequest = async () => {
    try {
      if (llmConfig.provider === 'gemini') {
        return await generatePlanGemini(prompt, llmConfig, apiKey);
      } else {
        return await generatePlanOpenAI(prompt, llmConfig, apiKey);
      }
    } catch (error) {
      console.error("Plan Generation Error:", error);
      return mockFrames(config.frameCount);
    }
  };

  // 将请求添加到队列中
  return requestQueue.addRequest(makeApiRequest);
};

export const generateFrameImage = async (frame: StoryboardFrame, styleName: string, settings: AppSettings): Promise<string> => {
  const imgConfig = settings.image;
  const apiKey = getApiKey(imgConfig);

  // Use the frame's specific visual prompt if edited, else default logic
  const content = frame.visualPrompt || frame.description;
  
  let prompt: string;
  // 检查是否使用免费通道（无API密钥）
  const isFreeChannel = !apiKey;
  
  if (isFreeChannel) {
    // 免费通道使用特殊模板避免黑块问题
    prompt = `Subject: ${content}. Style: Professional storyboard sketch, rough pencil lines on clean white paper. Constraints: No solid black blocks, no heavy shadows, minimalist, high key lighting, white background.`;
  } else {
    // 付费通道使用原有优化提示词
    prompt = 'Subject & Action: ' + content + ', Art Style: ' + styleName + ' style, professional storyboard sketch, rough line art, loose gesture drawing, black and white, high contrast ink lines, Composition: wide angle, cinematic composition, rule of thirds, clean white background, Negative Constraints: no color, no shading, no gradients, no realistic photo, no text, no messy lines, no complex background';
  }

  const maxRetries = 5; // 增加最大重试次数到5次
  const baseDelay = 3000; // 增加基础延迟时间到3秒

  // 将实际的API请求逻辑封装在一个函数中
  const makeApiRequest = async () => {
    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        if (isFreeChannel) {
          // 免费通道使用我们的代理API
          const response = await fetch('/api/proxy-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
          });
          
          if (!response.ok) throw new Error('Proxy API Error: ' + response.statusText);
          const data = await response.json();
          
          // 处理代理返回的图片数据
          if (data.data?.[0]?.b64_json) {
            return 'data:image/png;base64,' + data.data[0].b64_json;
          } else if (data.data?.[0]?.url) {
            // 如果返回的是URL，尝试获取图片内容
            try {
              const imageResponse = await fetch(data.data[0].url);
              if (!imageResponse.ok) throw new Error('Failed to fetch image from proxy');
              const blob = await imageResponse.blob();
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve(reader.result as string);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch (error) {
              console.error('Error converting proxy image URL to data URL:', error);
              return data.data[0].url;
            }
          } else {
            throw new Error('No image data in proxy response');
          }
        } else if (imgConfig.provider === 'gemini') {
          return await generateImageGemini(prompt, imgConfig, apiKey);
        } else {
          return await generateImageOpenAI(prompt, imgConfig, apiKey);
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
};

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
  const isProduction = import.meta.env.PROD;
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
    } else {
      proxyUrl = baseUrl;
    }
    requestUrl = proxyUrl;
  }
  
  // 构建完整路径，确保代理后仍然包含版本号
  // 对于包含版本号的API，直接使用端点
  // 对于不包含版本号的API，添加v1版本号
  const endpoint = '/chat/completions';
  
  let fullUrl;
  if (isProduction) {
    // 生产环境直接构建完整URL
    if (baseUrl.endsWith('/')) {
      fullUrl = baseUrl + endpoint.slice(1); // 移除端点开头的斜杠
    } else {
      fullUrl = baseUrl + endpoint;
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
  
  const response = await fetch(fullUrl, {
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
    contents: prompt,
    generationConfig: {
      width: 384,  // 统一使用384x384分辨率提高生成速度
      height: 384,
    }
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

async function generateImageOpenAI(prompt: string, config: ApiConfig, apiKey: string) {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  
  // 在生产环境中直接使用原始API地址，开发环境使用代理
  const isProduction = import.meta.env.PROD;
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
    } else {
      proxyUrl = baseUrl;
    }
    requestUrl = proxyUrl;
  }
  
  // 构建完整路径，确保代理后仍然包含版本号
  // 对于包含版本号的API，直接使用端点
  // 对于不包含版本号的API，添加v1版本号
  const endpoint = '/images/generations';
  
  let fullUrl;
  if (isProduction) {
    // 生产环境直接构建完整URL
    if (baseUrl.endsWith('/')) {
      fullUrl = baseUrl + endpoint.slice(1); // 移除端点开头的斜杠
    } else {
      fullUrl = baseUrl + endpoint;
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
  
  const body: any = {
    model: config.model,
    prompt: prompt,
    n: 1,
    size: "384x384", // 使用用户指定的较小分辨率以提高生成速度
    response_format: "b64_json"
  };
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error('API Error: ' + response.statusText);
  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (b64) return 'data:image/png;base64,' + b64;
  const url = data.data?.[0]?.url;
  if (url) {
    // 在生产环境中，直接返回URL而不转换为base64
    // 避免因CORS问题导致图片加载失败
    if (import.meta.env.PROD) {
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

const mockFrames = (count: number): Partial<StoryboardFrame>[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: 'mock-' + i,
    number: i + 1,
    description: 'Shot ' + (i + 1) + ' narrative description. The character moves slowly towards the light.',
    descriptionZh: '第 ' + (i + 1) + ' 镜剧情描述。角色慢慢走向光亮处，神情凝重。',
    visualPrompt: 'Shot ' + (i + 1) + ' visual sketch prompt. Low angle, high contrast, minimalist lines.',
    visualPromptZh: '第 ' + (i + 1) + ' 镜画面提示词。低角度仰拍，高对比度，极简线条风格。',
    symbols: []
  }));
};

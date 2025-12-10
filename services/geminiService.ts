
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardFrame, ProjectConfig, AppSettings, ApiConfig } from "../types";
import { requestQueue } from './requestQueue';

const ENV_API_KEY = process.env.API_KEY || '';
const getApiKey = (config: ApiConfig): string => config.apiKey || ENV_API_KEY;

const getPlaceholderImage = (text: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="#9ca3af" text-anchor="middle" dy=".3em">${text}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
       
       // 根据API类型选择正确的端点
       const endpoint = type === 'image' ? '/images/generations' : '/chat/completions';
       
       // 检查代理URL是否已经包含版本号
       const proxyHasV1 = proxyUrl.includes('v1');
       
       let fullUrl;
       if (proxyHasV1) {
         // 如果代理URL已经包含版本号，直接添加端点
         fullUrl = proxyUrl + endpoint;
       } else if (baseUrl.includes('v1')) {
         // 如果原始URL包含版本号，但代理URL没有，添加v1版本号
         fullUrl = proxyUrl + '/v1' + endpoint;
       } else {
         // 如果原始URL也没有版本号，使用默认的v1版本号
         fullUrl = proxyUrl + '/v1' + endpoint;
       }
       
       // 根据端点类型构建不同的请求体
       const requestBody = type === 'image' ? {
         model: config.model,
         prompt: 'A simple test image',
         n: 1,
         size: '256x256'
       } : {
         model: config.model,
         messages: [{role: 'user', content: 'Hi'}],
         max_tokens: 1
       };
       
       const res = await fetch(fullUrl, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
         },
         body: JSON.stringify(requestBody)
       });
       return res.ok;
    }
  } catch (e) {
    console.error("API Test Failed", e);
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
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Keep the meaning and context intact. Return only the translated text, no additional content.\n\n${text}`;

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
          'Authorization': `Bearer ${apiKey.substring(0, 10)}...` // 只显示API密钥的前10个字符
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
          'Authorization': `Bearer ${apiKey}`
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
        throw new Error(`Translation API error: ${response.status} - ${errorText}`);
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

export const generateFrames = async (
  config: ProjectConfig,
  settings: AppSettings
): Promise<Partial<StoryboardFrame>[]> => {
  const llmConfig = settings.llm;
  const apiKey = getApiKey(llmConfig);

  if (!apiKey && llmConfig.provider === 'gemini') {
    console.warn("No API Key found, using mock data");
    return mockFrames(config.frameCount);
  }

  // Optimized System Prompt with "Analyze-Optimize-Verify" logic
  const styleName = settings.language === 'zh' ? config.style.nameZh : config.style.name;
  
  const prompt = `
    You are a world-class Film Director and Storyboard Artist.
    Your goal is to visualize the user's script into a professional, cinematic storyboard sequence.

    [PROJECT SETTINGS]
    - Script/Core Idea: "${config.script}"
    - Visual Style: ${styleName} (${config.style.description})
    - Total Duration: ${config.duration} seconds
    - Target Shots: ${config.frameCount} keyframes

    [EXECUTION PROCESS]
    1. ANALYZE: Deconstruct the user's script to understand the core narrative, emotional tone, and pacing.
    2. OPTIMIZE (Visual Enrichment): Expand the script into rich visual descriptions. Add specific cinematic details:
       - Camera Angles (e.g., Low angle, Bird's eye, Close-up)
       - Lighting (e.g., Chiaroscuro, Backlit, Soft morning light)
       - Composition (e.g., Rule of thirds, Symmetrical)
       - Ensure all visuals strictly adhere to the '${styleName}' aesthetic.
    3. VERIFY: **CRITICAL** Ensure the expanded details remain strictly true to the user's original intent. DO NOT HALLUCINATE objects, characters, or events not implied by the script. If the script is simple, keep the shot simple but visually polished.
    4. TRANSLATE: You MUST provide native-level quality text for ALL English and Chinese fields. The Chinese fields must be accurate translations of the English ones.

    [OUTPUT REQUIREMENT]
    Output strictly a JSON Array containing exactly ${config.frameCount} frame objects.
    Do not output markdown code blocks, just the raw JSON.

    [JSON SCHEMA]
    {
      "visualPrompt": "String (English). A highly detailed image generation prompt. Start with 'Professional storyboard masterpiece, ${config.style.name} style, black and white line art...'. Describe the subject, background, action, and camera angle vividly.",
      "visualPromptZh": "String (Chinese). 视觉提示词的中文版。详细描述画面内容、构图、光影和风格。",
      "description": "String (English). Concise directorial instruction for the video motion (e.g., 'Camera pans right as character runs').",
      "descriptionZh": "String (Chinese). 简练的导演指令，描述动作与运镜。"
    }
  `;

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

  if (!apiKey && imgConfig.provider === 'gemini') {
    return getPlaceholderImage('No API Key');
  }

  // Use the frame's specific visual prompt if edited, else default logic
  const content = frame.visualPrompt || frame.description;
  
  // 优化后的提示词，减少大块黑色区域并提高出图速度
  const prompt = `${content}, line drawing, storyboard, minimalistic, clean white background, monochrome, no shading, simple lines, clear boundaries, low detail, no color, white background, line art, sketch, clean outline`;

  const maxRetries = 5; // 增加最大重试次数到5次
  const baseDelay = 3000; // 增加基础延迟时间到3秒

  // 将实际的API请求逻辑封装在一个函数中
  const makeApiRequest = async () => {
    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        if (imgConfig.provider === 'gemini') {
          return await generateImageGemini(prompt, imgConfig, apiKey);
        } else {
          return await generateImageOpenAI(prompt, imgConfig, apiKey);
        }
      } catch (error) {
        console.error(`Image Gen Error (attempt ${retry + 1}/${maxRetries + 1}):`, error);
        
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
          console.log(`Rate limit hit, retrying after ${Math.round(delayTime)}ms...`);
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
  // 对于包含版本号的API，直接使用端点
  // 对于不包含版本号的API，添加v1版本号
  const endpoint = '/chat/completions';
  
  // 检查代理URL是否已经包含版本号
  const proxyHasV1 = proxyUrl.includes('v1');
  
  let fullUrl;
  if (proxyHasV1) {
    // 如果代理URL已经包含版本号，直接添加端点
    fullUrl = proxyUrl + endpoint;
  } else if (baseUrl.includes('v1')) {
    // 如果原始URL包含版本号，但代理URL没有，添加v1版本号
    fullUrl = proxyUrl + '/v1' + endpoint;
  } else {
    // 如果原始URL也没有版本号，使用默认的v1版本号
    fullUrl = proxyUrl + '/v1' + endpoint;
  }
  
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" } 
    })
  });
  if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);
  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  let parsed;
  try {
    const json = JSON.parse(content);
    if (Array.isArray(json)) parsed = json;
    else if (json.frames && Array.isArray(json.frames)) parsed = json.frames;
    else parsed = Object.values(json)[0] as any[];
  } catch (e) {
    throw new Error("Failed to parse OpenAI JSON");
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
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("No image data in Gemini response");
}

async function generateImageOpenAI(prompt: string, config: ApiConfig, apiKey: string) {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  
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
  // 对于包含版本号的API，直接使用端点
  // 对于不包含版本号的API，添加v1版本号
  const endpoint = '/images/generations';
  
  // 检查代理URL是否已经包含版本号
  const proxyHasV1 = proxyUrl.includes('v1');
  
  let fullUrl;
  if (proxyHasV1) {
    // 如果代理URL已经包含版本号，直接添加端点
    fullUrl = proxyUrl + endpoint;
  } else if (baseUrl.includes('v1')) {
    // 如果原始URL包含版本号，但代理URL没有，添加v1版本号
    fullUrl = proxyUrl + '/v1' + endpoint;
  } else {
    // 如果原始URL也没有版本号，使用默认的v1版本号
    fullUrl = proxyUrl + '/v1' + endpoint;
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
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (b64) return `data:image/png;base64,${b64}`;
  const url = data.data?.[0]?.url;
  if (url) return url;
  throw new Error("No image data in OpenAI response");
}

function mapToFrames(data: any[]): Partial<StoryboardFrame>[] {
  return data.map((item: any, index: number) => ({
    id: `frame-${Date.now()}-${index}`,
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
    id: `mock-${i}`,
    number: i + 1,
    description: `Shot ${i + 1} narrative description. The character moves slowly towards the light.`,
    descriptionZh: `第 ${i + 1} 镜剧情描述。角色慢慢走向光亮处，神情凝重。`,
    visualPrompt: `Shot ${i + 1} visual sketch prompt. Low angle, high contrast, minimalist lines.`,
    visualPromptZh: `第 ${i + 1} 镜画面提示词。低角度仰拍，高对比度，极简线条风格。`,
    symbols: []
  }));
};

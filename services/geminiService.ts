
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
         } else if (baseUrl.includes('wuyinkeji.com')) {
           // 速创API在开发环境下使用代理
           proxyUrl = '/api/sucreative';
         } else {
           proxyUrl = baseUrl;
         }
         requestUrl = proxyUrl;
       }
       
       // 检查是否为速创API
       const isSuCreativeGemini = baseUrl.includes('wuyinkeji.com/api/chat');
       const isSuCreativeImage = baseUrl.includes('wuyinkeji.com/api/img');
       const isSuCreative = isSuCreativeGemini || isSuCreativeImage;
       
       // 根据API类型选择正确的端点
       const endpoint = type === 'image' ? '/v1/images/generations' : '/v1/chat/completions';
       
       let fullUrl;
       if (isProduction) {
         // 生产环境直接构建完整URL
         if (isSuCreativeGemini) {
           // 速创Gemini API已经包含完整路径
           fullUrl = baseUrl;
         } else if (isSuCreativeImage) {
           // 速创图片API需要拼接/nanoBanana端点
           fullUrl = baseUrl + '/nanoBanana';
         } else {
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
         }
       } else {
         // 开发环境使用代理URL构建
         if (isSuCreativeGemini) {
           // 速创Gemini API在开发环境下使用/api/sucreative代理
           fullUrl = '/api/sucreative';
         } else if (isSuCreativeImage) {
          // 速创图片API在开发环境下使用/api/sucreative代理，并拼接/nanoBanana端点
          fullUrl = '/api/sucreative/api/img/nanoBanana';
         } else {
           // 其他API的处理逻辑
           // 提取原始URL中的路径部分（包括版本号）
           const urlParts = baseUrl.split('/');
           const versionIndex = urlParts.findIndex(part => part === 'v1' || part === 'v2');
           
           if (versionIndex > -1) {
             // 如果原始URL包含版本号，提取版本号和之后的路径
             const versionPath = urlParts.slice(versionIndex).join('/');
             // 确保不会重复添加版本号
             const endpointWithoutVersion = endpoint.substring(endpoint.indexOf('/', 1)); // 去掉开头的/v1部分
             fullUrl = requestUrl + '/' + versionPath + (endpointWithoutVersion.startsWith('/') ? '' : '/') + endpointWithoutVersion.slice(1);
           } else {
             // 如果原始URL没有版本号，使用默认的v1版本号
             fullUrl = requestUrl + endpoint;
           }
         }
       }
       
       // 根据端点类型和API提供商构建不同的请求体
       let requestBody;
       let headers;
       
       if (isSuCreativeGemini) {
         // 速创Gemini API的特殊处理
         // 构建请求参数
         const params = {
           key: apiKey, // 添加接口密钥参数
           content: 'Hi',
           model: config.model || 'gemini-3-pro'
         };
         
         // 生成签名
         const signature = generateSignature(params, apiKey);
         
         headers = {
           'Content-Type': 'application/x-www-form-urlencoded'
         };
         
         // 添加签名到请求参数
         requestBody = new URLSearchParams({
           ...params,
           sign: signature
         });
       } else if (isSuCreativeImage) {
         // 速创图像API的特殊处理
         headers = {
           'Content-Type': 'application/json;charset:utf-8;',
           'Authorization': apiKey
         };
         
         requestBody = {
           prompt: 'A simple test image',
           aspectRatio: '1:1',
           model: config.model || 'nano-banana'
         };
       } else {
         // 其他API的标准处理
         headers = {
           'Content-Type': 'application/json',
           'Authorization': 'Bearer ' + apiKey
         };
         requestBody = type === 'image' ? {
           model: config.model,
           prompt: 'A simple test image',
           n: 1,
           size: '256x256'
         } : {
           model: config.model,
           messages: [{role: 'user', content: 'Hi'}]
         };
       }
       
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
         headers: headers,
         body: isSuCreativeGemini ? requestBody.toString() : JSON.stringify(requestBody)
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
      
      // 构建完整路径，确保代理后仍然包含版本号，硅基流动需要/v1版本号
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
          fullUrl = proxyUrl + '/' + versionPath + (endpoint.startsWith('/') ? '' : '/') + endpoint.substring(3); // 去掉开头的/v1
        } else {
          // 如果原始URL没有版本号，使用默认的v1版本号
          fullUrl = proxyUrl + '/v1' + endpoint;
        }
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

  // 处理结构化脚本
  if (!config.useAIoptimization && isStructuredScript(config.script)) {
    const frames = splitStructuredScript(config.script, settings);
    return config.frameCount > 0 ? frames.slice(0, config.frameCount) : frames;
  } else if (!config.useAIoptimization && !import.meta.env.PROD) {
    console.log("取消了AI创意优化，但脚本不是结构化的");
  }

  if (!apiKey) {
    console.warn("No API Key found, using mock data based on user input");
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
   - **Visual Consistency**: Ensure the main character's features remain identical across all visualPrompt fields.

[JSON SCHEMA]
Strictly follow this structure for each frame:
{
  "visualPrompt": "String (English). Detailed image generation prompt. Start with: ${config.style.name} style storyboard sketch...",
  "visualPromptZh": "String (Chinese). 对应英文的中文视觉描述。",
  "description": "String (English). Concise technical instruction for motion.",
  "descriptionZh": "String (Chinese). 简练的导演指令。"
}
`;
  } else {
    // 使用默认提示词
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
    
    prompt = promptParts.join('\n');
  }

  // 将实际的API请求逻辑封装在一个函数中
  const makeApiRequest = async () => {
    try {
      // 使用新的callLLM函数替代原有API调用
      const messages = [{ role: 'user', content: prompt }];
      const response = await callLLM(messages, apiKey, config.frameCount, llmConfig);
      
      // 解析响应并映射到StoryboardFrame数组
      if (response.choices && response.choices[0]?.message?.content) {
        const content = response.choices[0].message.content;
        // 尝试解析JSON响应
        try {
          const frames = JSON.parse(content);
          return frames.map((frame: any, index: number) => ({
            id: index.toString(),
            number: index + 1, // 添加帧编号
            visualPrompt: frame.visualPrompt || frame.description,
            visualPromptZh: frame.visualPromptZh,
            description: frame.description || frame.visualPrompt,
            descriptionZh: frame.descriptionZh
          }));
        } catch (jsonError) {
          // 如果不是JSON格式，尝试解析结构化文本
          console.warn("JSON parse failed, trying text parsing:", jsonError);
          return mapToFrames([{ content }]);
        }
      }
      return mockFrames(config.frameCount);
    } catch (error) {
      console.error("Plan Generation Error:", error);
      return mockFrames(config.frameCount);
    }
  };

  // 将请求添加到队列中
  return requestQueue.addRequest(makeApiRequest);
};

// 极简主义提示词，令牌数减少45%，加速响应
 export const buildPrompt = (content: string) => 
   `${content}, line drawing, storyboard, minimalistic, clean white background, monochrome, no shading, no details, no color, 1bit`

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
      const isProduction = import.meta.env.PROD;
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
      
      const data = await res.json();
      
      // 将速创API的响应转换为标准格式
      return {
        choices: [{
          message: {
            content: data.data || '[]'
          }
        }]
      };
    } else {
      // 处理其他OpenAI兼容API的请求
      const prompt = messages.find(msg => msg.role === 'user')?.content || '';
      const baseUrl = llmConfig?.baseUrl || 'https://api.openai.com/v1';
      
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
        model: llmConfig?.model,
        messages: messages
      };
      
      // 只有当不是硅基流动API时，才添加response_format参数
      if (!baseUrl.includes('siliconflow.cn')) {
        requestBody.response_format = { type: "json_object" };
      }
      
      const response = await fetchRetry(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + userKey
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('API Error: ' + response.status + ' - ' + errorText);
      }
      
      return response.json();
    }
}

// 实现图片快速草稿模式
export async function quickDraft(prompt: string, userKey: string) {
  return fetchRetry('/api/ai/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SF-Key': userKey
    },
    body: JSON.stringify({
      prompt,
      size: '256x256', // 体积缩小 75%
      steps: 20,       // 步数减少，推理更快
      n: 4,            // 一次出 4 张草图供挑选
      model: 'black-forest-labs/FLUX.1-schnell' // 添加硅基流动API需要的model参数
    })
  }).then(r => r.json())
}

export const generateFrameImage = async (frame: StoryboardFrame, styleName: string, settings: AppSettings): Promise<string> => {
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
  // 检查是否使用免费通道（无API密钥）
  const isFreeChannel = !apiKey;
  
  if (isFreeChannel) {
    // 免费通道使用特殊模板避免黑块问题
    prompt = `Subject: ${content}. Style: Professional storyboard sketch, rough pencil lines on clean white paper. Constraints: No solid black blocks, no heavy shadows, minimalist, high key lighting, white background.`;
  } else if (imgConfig.provider === 'siliconflow' || imgConfig.baseUrl?.includes('siliconflow.cn')) {
    // 硅基流动API
    prompt = buildPrompt(content);
  } else {
    // 其他API提供商使用新的极简主义提示词
    prompt = buildPrompt(content);
  }

  const maxRetries = 5; // 增加最大重试次数到5次
  const baseDelay = 3000; // 增加基础延迟时间到3秒

  // 将实际的API请求逻辑封装在一个函数中
  const makeApiRequest = async () => {
    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        if (isFreeChannel) {
              // 免费通道使用我们的代理API
              const response = await fetchRetry('/api/proxy-image', {
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
        } else if (imgConfig.provider === 'siliconflow' || imgConfig.baseUrl?.includes('siliconflow.cn')) {
          // 硅基流动API，使用我们的/api/ai/image端点
          const response = await fetchRetry('/api/ai/image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-SF-Key': apiKey
            },
            body: JSON.stringify({
              prompt,
              size: '384x384',
              steps: 30,
              n: 1
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Silicon Flow API Error: ${errorData.error || response.statusText}`);
          }
          
          const data = await response.json();
          if (data.data?.[0]?.url) {
            return data.data[0].url;
          } else {
            throw new Error('No image URL in response');
          }
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
  let fullUrl;
  let body: any;
  
  // 特殊处理速创API
  if (baseUrl.includes('wuyinkeji.com')) {
    // 速创API使用特殊的端点和参数格式
    const endpoint = '/nanoBanana';
    
    if (isProduction) {
      // 生产环境直接使用完整的速创API地址
      fullUrl = baseUrl + (baseUrl.endsWith('/') ? endpoint.slice(1) : endpoint);
    } else {
      // 开发环境使用代理
      fullUrl = requestUrl + (requestUrl.endsWith('/') ? endpoint.slice(1) : endpoint);
    }
    
    // 速创API的请求参数格式
    body = {
      prompt: prompt,
      aspectRatio: "1:1", // 默认使用1:1比例
      model: config.model || 'nano-banana' // 速创API的model参数
    };
  } else {
    // 其他OpenAI兼容API的处理逻辑
    const endpoint = '/v1/images/generations';
    
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
        // 确保不会重复添加版本号
        const endpointWithoutVersion = endpoint.substring(endpoint.indexOf('/', 1)); // 去掉开头的/v1部分
        fullUrl = requestUrl + '/' + versionPath + (endpointWithoutVersion.startsWith('/') ? '' : '/') + endpointWithoutVersion.slice(1);
      } else {
        // 如果原始URL没有版本号，使用默认的v1版本号
        fullUrl = requestUrl + endpoint;
      }
    }
    
    // 其他OpenAI兼容API的请求参数
    body = {
      model: config.model,
      prompt: prompt,
      n: 1,
      size: "384x384", // 使用用户指定的较小分辨率以提高生成速度
      response_format: "b64_json"
    };
  }
  // 设置请求头
  const requestHeaders: HeadersInit = {};
  
  // 为不同的API设置对应的请求头
  if (baseUrl.includes('wuyinkeji.com')) {
    // 速创API的特殊请求头
    requestHeaders['Content-Type'] = 'application/json;charset:utf-8;';
    requestHeaders['Authorization'] = apiKey;
  } else {
    // 其他OpenAI兼容API的请求头
    requestHeaders['Content-Type'] = 'application/json';
    requestHeaders['Authorization'] = 'Bearer ' + apiKey;
  }

  const response = await fetchRetry(fullUrl, {
    method: 'POST',
    headers: requestHeaders,
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
          'Authorization': apiKey,
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

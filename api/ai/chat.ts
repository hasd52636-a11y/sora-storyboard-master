import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 30
};

// 定义请求体接口
interface ChatRequestBody {
  messages?: Array<{ role: string; content: string }>;
  frameCount?: number;
  apiConfig?: {
    baseUrl?: string;
    defaultModel?: string;
    provider?: string;
  };
  max_tokens?: number;
  temperature?: number;
  [key: string]: any;
}

// CORS 头部
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-sf-key',
};

function setCorsHeaders(res: VercelResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  setCorsHeaders(res);

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 从自定义Header中获取用户密钥（支持大小写）
  const KEY = (req.headers['x-sf-key'] || req.headers['X-SF-Key'] || req.headers['X-Sf-Key']) as string;
  if (!KEY) {
    console.log('Headers received:', JSON.stringify(req.headers));
    return res.status(401).json({ 
      error: 'Authorization required: Missing X-SF-Key in headers.',
      receivedHeaders: Object.keys(req.headers)
    });
  }

  const body = req.body as ChatRequestBody;
  const apiConfig = body.apiConfig || {};

  // 确定API端点
  let baseUrl = apiConfig.baseUrl || 'https://api.siliconflow.cn/v1';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

  // 检测API类型
  const isZhipuApi = apiConfig.provider === 'zhipu' || baseUrl.includes('bigmodel.cn');
  
  let endpoint: string;
  if (isZhipuApi) {
    // 智谱API的端点格式
    if (baseUrl.includes('/paas/v4')) {
      endpoint = baseUrl.includes('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
    } else {
      endpoint = `${baseUrl}/paas/v4/chat/completions`;
    }
  } else {
    endpoint = baseUrl.includes('/chat/completions') 
      ? baseUrl 
      : `${baseUrl}/chat/completions`;
  }

  // 确定模型 - 根据提供商选择合适的默认模型
  let model = apiConfig.defaultModel;
  
  if (!model) {
    // 如果没有指定模型，根据 baseUrl 推断提供商并选择默认模型
    if (isZhipuApi) {
      model = 'glm-4';
    } else if (baseUrl.includes('deepseek')) {
      model = 'deepseek-chat';
    } else if (baseUrl.includes('siliconflow')) {
      model = 'Qwen/Qwen2.5-7B-Instruct';
    } else if (baseUrl.includes('dashscope')) {
      model = 'qwen-plus';
    } else if (baseUrl.includes('moonshot')) {
      model = 'moonshot-v1-8k';
    } else if (baseUrl.includes('volces')) {
      model = 'doubao-pro-32k';
    } else if (baseUrl.includes('hunyuan')) {
      model = 'hunyuan-standard';
    } else {
      model = 'gpt-3.5-turbo'; // 最后的默认值
    }
  }
  
  // 添加调试日志
  console.log('Chat API Request:', {
    provider: apiConfig.provider,
    baseUrl: baseUrl,
    endpoint: endpoint,
    model: model,
    isZhipuApi: isZhipuApi,
    messagesCount: body.messages?.length || 0,
    hasApiKey: !!KEY,
    keyLength: KEY?.length || 0
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: body.messages,
        max_tokens: body.max_tokens,
        temperature: body.temperature
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      const statusText = response.statusText;
      
      // 尝试获取详细错误信息
      let errorDetail = '';
      try {
        const errorData = await response.json();
        errorDetail = JSON.stringify(errorData);
        console.error('Chat API Error Response:', errorData);
      } catch (e) {
        errorDetail = statusText;
      }

      let warning = '';
      if (status === 429) {
        warning = `API failed with status ${status} (Rate Limit Exceeded). ${errorDetail}`;
      } else if (status === 400 && errorDetail.includes('Model Not Exist')) {
        warning = `Model "${model}" does not exist on this API provider. Please check your model name in settings. Error: ${errorDetail}`;
      } else if (status === 401 || status === 403) {
        warning = `API authentication failed with status ${status}. Please check your API key. Error: ${errorDetail}`;
      } else {
        warning = `API failed with status ${status} (${statusText}). ${errorDetail}`;
      }

      console.error('Chat API Failed:', { status, statusText, endpoint, model, errorDetail, warning });

      // 返回错误状态，让客户端知道API调用失败了
      return res.status(status).json({
        error: warning,
        status: status,
        endpoint: endpoint,
        model: model,
        provider: apiConfig.provider
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Chat API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 返回错误状态，让客户端知道API调用失败了
    return res.status(500).json({
      error: `Chat API Error: ${errorMessage}`,
      details: errorMessage
    });
  }
}

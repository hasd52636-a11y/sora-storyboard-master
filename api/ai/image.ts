import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 60
};

// 定义请求体接口
interface ImageRequestBody {
  prompt?: string;
  size?: string;
  steps?: number;
  n?: number;
  apiConfig?: {
    baseUrl?: string;
    defaultModel?: string;
    provider?: string;
  };
  user_id?: string;
  quality?: string;
  watermark_enabled?: boolean;
  aspectRatio?: string;
  img_url?: string;
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

  try {
    // 从自定义Header中获取用户密钥（支持大小写）
    const KEY = (req.headers['x-sf-key'] || req.headers['X-SF-Key'] || req.headers['X-Sf-Key']) as string;
    if (!KEY) {
      console.log('Headers received:', JSON.stringify(req.headers));
      return res.status(401).json({ 
        error: 'Authorization required: Missing X-SF-Key in headers.',
        receivedHeaders: Object.keys(req.headers)
      });
    }

    const body = req.body as ImageRequestBody;
    const { prompt, size = '512x512', steps = 30, n = 1, apiConfig } = body;

    // 检查API类型 - 同时检查provider字段、baseUrl和defaultModel
    const isZhipuApi = apiConfig?.provider === 'zhipu' || apiConfig?.baseUrl?.includes('bigmodel.cn') || apiConfig?.defaultModel?.includes('cogview');
    const isSucreativeApi = apiConfig?.provider === 'sucreative' || apiConfig?.baseUrl?.includes('wuyinkeji.com') || apiConfig?.defaultModel?.includes('nano-banana');
    
    // 添加调试日志
    console.log('Image API Request:', {
      provider: apiConfig?.provider,
      baseUrl: apiConfig?.baseUrl,
      defaultModel: apiConfig?.defaultModel,
      isZhipuApi,
      isSucreativeApi
    });

    let baseUrl: string;
    let model: string;

    if (isSucreativeApi) {
      baseUrl = apiConfig?.baseUrl || 'https://api.wuyinkeji.com/api/img';
      model = apiConfig?.defaultModel || 'nano-banana';
    } else if (isZhipuApi) {
      baseUrl = apiConfig?.baseUrl || 'https://open.bigmodel.cn/api/paas/v4';
      model = apiConfig?.defaultModel || 'cogview-4-250304';
    } else {
      // 默认使用硅基流动
      baseUrl = apiConfig?.baseUrl || 'https://api.siliconflow.cn/v1';
      model = apiConfig?.defaultModel || 'black-forest-labs/FLUX.1-schnell';
    }

    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    // 构建请求参数
    let endpoint: string;
    let requestBody: any;
    let authHeader: string;

    if (isZhipuApi) {
      // 智谱API配置
      if (baseUrl.includes('/paas/v4')) {
        endpoint = baseUrl.includes('/images/generations') ? baseUrl : `${baseUrl}/images/generations`;
      } else {
        endpoint = `${baseUrl}/paas/v4/images/generations`;
      }

      // 智谱API要求size在512px-2048px之间，且为16的整数倍
      // 自动调整不符合要求的size参数
      let zhipuSize = size || '1024x1024';
      const sizeMatch = zhipuSize.match(/(\d+)x(\d+)/);
      if (sizeMatch) {
        let width = parseInt(sizeMatch[1]);
        let height = parseInt(sizeMatch[2]);
        
        // 确保在512-2048范围内
        width = Math.max(512, Math.min(2048, width));
        height = Math.max(512, Math.min(2048, height));
        
        // 确保是16的整数倍
        width = Math.round(width / 16) * 16;
        height = Math.round(height / 16) * 16;
        
        // 确保最大像素数不超过2^21 (约2097152)
        const maxPixels = Math.pow(2, 21);
        if (width * height > maxPixels) {
          // 按比例缩小
          const ratio = Math.sqrt(maxPixels / (width * height));
          width = Math.round((width * ratio) / 16) * 16;
          height = Math.round((height * ratio) / 16) * 16;
        }
        
        zhipuSize = `${width}x${height}`;
      }
      
      console.log('Zhipu API size adjustment:', { original: size, adjusted: zhipuSize });

      requestBody = {
        model: model,
        prompt,
        size: zhipuSize,
        user_id: body.user_id || 'storyboard-user',
        quality: body.quality || 'standard',
        watermark_enabled: body.watermark_enabled !== undefined ? body.watermark_enabled : false
      };

      if (!['cogview-4-250304'].includes(requestBody.model)) {
        delete requestBody.quality;
      }

      authHeader = `Bearer ${KEY}`;

    } else if (isSucreativeApi) {
      // 速创API配置 - 修复端点构建逻辑
      // 速创API的正确端点是 https://api.wuyinkeji.com/api/img/nanoBanana
      if (baseUrl.includes('/api/img/nanoBanana')) {
        endpoint = baseUrl;
      } else if (baseUrl.includes('/api/img')) {
        // 如果baseUrl包含/api/img但不包含/nanoBanana，添加/nanoBanana
        endpoint = baseUrl.endsWith('/') ? `${baseUrl}nanoBanana` : `${baseUrl}/nanoBanana`;
      } else if (baseUrl.includes('wuyinkeji.com')) {
        // 如果只是域名，构建完整路径
        endpoint = 'https://api.wuyinkeji.com/api/img/nanoBanana';
      } else {
        endpoint = `${baseUrl}/api/img/nanoBanana`;
      }
      
      console.log('Sucreative API endpoint:', endpoint);

      requestBody = {
        model: 'nano-banana',
        prompt,
      };

      if (body.aspectRatio) {
        requestBody.aspectRatio = body.aspectRatio;
      }
      if (body.img_url) {
        requestBody.img_url = body.img_url;
      }

      authHeader = KEY; // 速创API不需要Bearer前缀

    } else {
      // 硅基流动或其他OpenAI兼容API
      endpoint = baseUrl.includes('/images/generations') ? baseUrl : `${baseUrl}/images/generations`;

      requestBody = {
        model,
        prompt,
        size: size || '512x512',
        steps: steps || 30,
        n: n || 1
      };

      authHeader = `Bearer ${KEY}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 58000);

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      const status = apiResponse.status;
      const statusText = apiResponse.statusText;

      const warning = status === 429
        ? `Image generation failed with status ${status} (Rate Limit Exceeded).`
        : `Image generation failed with status ${status} (${statusText}).`;

      try {
        const errorData = await apiResponse.json();
        return res.status(status).json({
          error: errorData.error || { message: warning },
          rateLimited: status === 429,
          warning: warning
        });
      } catch {
        return res.status(status).json({
          error: { message: warning },
          rateLimited: status === 429,
          warning: warning
        });
      }
    }

    const data = await apiResponse.json();

    // 处理响应
    let url: string | undefined;
    if (data.data?.[0]?.url) {
      url = data.data[0].url;
    } else if (data.data?.[0]?.b64_json) {
      url = `data:image/png;base64,${data.data[0].b64_json}`;
    }

    if (!url && !isSucreativeApi) {
      return res.status(500).json({ 
        error: 'Gen failed: Image URL not found in response.' 
      });
    }

    // 返回成功响应
    if (isSucreativeApi) {
      return res.status(200).json({
        msg: "成功",
        data: { id: data.id },
        code: 200
      });
    } else {
      res.setHeader('Cache-Control', 'public, max-age=300, immutable');
      return res.status(200).json({
        data: [{ url, prompt, size, steps, n }]
      });
    }

  } catch (error) {
    console.error('Image API Error:', error);
    return res.status(500).json({
      error: 'Internal Serverless Error during image generation.',
      warning: 'Failed to generate image due to internal error.'
    });
  }
}

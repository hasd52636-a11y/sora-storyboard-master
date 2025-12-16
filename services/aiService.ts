import { ApiConfig } from "../types";
import { fetchRetry } from "../src/utils/fetchRetry";

const getApiKey = (config: ApiConfig): string => config.apiKey || '';

export const detectObjects = async (
  imageBase64: string,
  config: ApiConfig
): Promise<number[] | null> => {
  const apiKey = getApiKey(config);
  if (!apiKey) {
    console.warn("No API Key found for object detection");
    return null;
  }

  const prompt = "Analyze the provided image and identify the main subject. Return only a JSON object with a single key 'boundingBox' whose value is an array of four numbers representing the bounding box of the main subject in the format [y_min, x_min, y_max, x_max]. The coordinates should be normalized to a 0-1000 scale. Example: { \"boundingBox\": [250, 150, 750, 850] }";

  try {
    const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    const endpoint = '/v1/chat/completions';
    
    // In production, use the user-provided baseUrl. In development, use a proxy.
    const isProduction = process.env.NODE_ENV === 'production';
    let requestUrl: string;

    if (isProduction) {
      requestUrl = baseUrl;
    } else {
      if (baseUrl.includes('deepseek.com')) {
        requestUrl = '/api/deepseek';
      } else if (baseUrl.includes('openai.com')) {
        requestUrl = '/api/openai';
      } else if (baseUrl.includes('bigmodel.cn')) {
        requestUrl = '/api/zhipu';
      } else if (baseUrl.includes('dashscope.aliyuncs.com')) {
        requestUrl = '/api/qwen';
      } else if (baseUrl.includes('moonshot.cn')) {
        requestUrl = '/api/moonshot';
      } else if (baseUrl.includes('volces.com')) {
        requestUrl = '/api/doubao';
      } else if (baseUrl.includes('hunyuan.cloud.tencent.com')) {
        requestUrl = '/api/hunyuan';
      } else if (baseUrl.includes('siliconflow.cn')) {
        requestUrl = '/api/siliconflow';
      } else {
        requestUrl = baseUrl; // Fallback to the original url
      }
    }

    const fullUrl = requestUrl.endsWith('/') ? requestUrl + endpoint.slice(1) : requestUrl + endpoint;

    const response = await fetchRetry(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'glm-4v', // Default to a vision model
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{.*?\}/);
      if (jsonMatch) {
        const jsonObj = JSON.parse(jsonMatch[0]);
        if (jsonObj.boundingBox && Array.isArray(jsonObj.boundingBox) && jsonObj.boundingBox.length === 4) {
          return jsonObj.boundingBox;
        }
      }
    }
    return null;

  } catch (e) {
    console.error("Object detection failed:", e);
    return null;
  }
};

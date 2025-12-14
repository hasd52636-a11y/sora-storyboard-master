// 切换到Serverless Function以支持更长的超时时间
export const config = {
  maxDuration: 30
};

// 使用Web API的Response对象（Vercel Edge Runtime原生支持）

// 定义请求体接口
interface ChatRequestBody {
  messages?: Array<{ role: string; content: string }>;
  frameCount?: number;
  [key: string]: any;
}

// 1. 定义 CORS 头部
// 本地测试时使用通配符，生产环境请替换为您网站的实际域名 (含 https://)
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    // 确保包含所有请求中使用的自定义头，特别是 'x-sf-key'
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-sf-key', 
};

// 辅助函数：将 CORS 头添加到 Response
function withCORSHeaders(response: Response): Response {
    const newResponse = new Response(response.body, response);
    // 复制原始 Headers
    for (const [key, value] of response.headers.entries()) {
        newResponse.headers.set(key, value);
    }
    // 添加 CORS Headers
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
    });
    return newResponse;
}

export default async function handler(req: Request) {

    // 2. 优先处理预检请求 (OPTIONS)
    if (req.method === 'OPTIONS') {
        // 返回 204 No Content，并附加 CORS 头
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    
    // 3. Method Check 中添加 CORS 头
    if (req.method !== 'POST') {
      return withCORSHeaders(new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' } 
      }));
    }
    
    // 从自定义 Header 中获取用户密钥 (保留您的动态密钥逻辑)
    const KEY = req.headers.get('x-sf-key'); 
    if (!KEY) {
      // 4. 未授权返回中添加 CORS 头
      return withCORSHeaders(new Response(JSON.stringify({ error: 'Authorization required: Missing X-SF-Key in headers.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    const ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions'
    
    // 注意：req.json() 只能调用一次，这里使用健壮性处理
    const body = await req.json().catch(() => ({})) as ChatRequestBody; 

    try {
        // 移除流式响应，使用常规请求
        const r = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                // 使用用户提供的动态 KEY
                Authorization: `Bearer ${KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model: 'deepseek-ai/DeepSeek-R1', ...body }),
            signal: AbortSignal.timeout(28000) // 增加到28秒，确保在Serverless Function的30秒限制内
        });
        
        // 5. 处理 API 响应（包括 429 错误）
        if (!r.ok) {
            const status = r.status;
            const statusText = r.statusText;
            
            // 标记 429 错误以便前端调试
            const warning = status === 429 
                ? `API failed with status ${status} (Rate Limit Exceeded). Showing cached result.` 
                : `API failed with status ${status} (${statusText}). Showing cached result.`;

                    // 从请求体中获取目标分镜数量
            const frameCount = body.frameCount || 4; // 默认生成4个分镜
            
            // 从请求消息中提取用户输入的内容
            let userInput = "story scene"; // 默认值
            if (body.messages && body.messages.length > 0) {
                const userMessage = body.messages.find((msg: any) => msg.role === "user");
                if (userMessage && userMessage.content) {
                    // 提取用户输入的核心内容（忽略系统提示词部分）
                    const content = userMessage.content;
                    const coreScriptMatch = content.match(/\[PROJECT SETTINGS\][\s\S]*?- Core Script: "([^"]*)"/);
                    if (coreScriptMatch && coreScriptMatch[1]) {
                        userInput = coreScriptMatch[1];
                    } else {
                        // 如果没有找到结构化的核心脚本，使用整个用户内容的前100个字符
                        userInput = content.substring(0, 100).trim();
                    }
                }
            }
            
            // 根据分镜数量和用户输入生成相应数量的mock数据
            const mockFrames = Array.from({ length: frameCount }, (_, i) => ({
                visualPrompt: `${userInput} - scene ${i + 1}, storyboard sketch, minimalist style`,
                visualPromptZh: `${userInput} - 第${i + 1}镜，分镜草图，极简风格`,
                description: `${userInput} - Scene ${i + 1}: Narrative description of the scene`,
                descriptionZh: `${userInput} - 第${i + 1}镜：场景的剧情描述`
            }));

            // 降级模板 (所有降级响应都通过 withCORSHeaders 确保兼容)
            return withCORSHeaders(new Response(JSON.stringify({
                choices: [{ message: { content: JSON.stringify(mockFrames) } }],
                warning: warning
            }), { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' } 
            }));
        }
        
        // 6. 成功响应中添加 CORS 头
        const data = await r.json();
        return withCORSHeaders(new Response(JSON.stringify(data), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        }));

    } catch (error) {
        console.error('Chat API Error:', error);
        // 7. 内部错误降级响应中添加 CORS 头
        
        // 从请求体中获取目标分镜数量
        const frameCount = body.frameCount || 4; // 默认生成4个分镜
        
        // 从请求消息中提取用户输入的内容
        let userInput = "story scene"; // 默认值
        if (body.messages && body.messages.length > 0) {
            const userMessage = body.messages.find((msg: any) => msg.role === "user");
            if (userMessage && userMessage.content) {
                // 提取用户输入的核心内容（忽略系统提示词部分）
                const content = userMessage.content;
                const coreScriptMatch = content.match(/\[PROJECT SETTINGS\][\s\S]*?- Core Script: "([^"]*)"/);
                if (coreScriptMatch && coreScriptMatch[1]) {
                    userInput = coreScriptMatch[1];
                } else {
                    // 如果没有找到结构化的核心脚本，使用整个用户内容的前100个字符
                    userInput = content.substring(0, 100).trim();
                }
            }
        }
        
        // 根据分镜数量和用户输入生成相应数量的mock数据
        const mockFrames = Array.from({ length: frameCount }, (_, i) => ({
            visualPrompt: `${userInput} - scene ${i + 1}, storyboard sketch, minimalist style`,
            visualPromptZh: `${userInput} - 第${i + 1}镜，分镜草图，极简风格`,
            description: `${userInput} - Scene ${i + 1}: Narrative description of the scene`,
            descriptionZh: `${userInput} - 第${i + 1}镜：场景的剧情描述`
        }));

        return withCORSHeaders(new Response(JSON.stringify({
            choices: [{ message: { content: JSON.stringify(mockFrames) } }]
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        }));
    }
}
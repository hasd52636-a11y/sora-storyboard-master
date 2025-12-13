"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
// 切换到Serverless Function以支持更长的超时时间
exports.config = {
    maxDuration: 30
};
// 导入Response构造函数
const node_fetch_1 = require("node-fetch");
// 1. 定义 CORS 头部
// 本地测试时使用通配符，生产环境请替换为您网站的实际域名 (含 https://)
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    // 确保包含所有请求中使用的自定义头，特别是 'x-sf-key'
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-sf-key',
};
// 辅助函数：将 CORS 头添加到 Response
function withCORSHeaders(response) {
    const newResponse = new node_fetch_1.Response(response.body, response);
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
async function handler(req) {
    // 2. 优先处理预检请求 (OPTIONS)
    if (req.method === 'OPTIONS') {
        // 返回 204 No Content，并附加 CORS 头
        return new node_fetch_1.Response(null, { status: 204, headers: CORS_HEADERS });
    }
    // 3. Method Check 中添加 CORS 头
    if (req.method !== 'POST') {
        return withCORSHeaders(new node_fetch_1.Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        }));
    }
    try {
        // 从自定义 Header 中获取用户密钥
        const KEY = req.headers.get('x-sf-key');
        if (!KEY) {
            return withCORSHeaders(new node_fetch_1.Response(JSON.stringify({ error: 'Authorization required: Missing X-SF-Key in headers.' }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
        }
        // 注意：req.json() 只能调用一次，这里使用健壮性处理
        const body = await req.json().catch(() => ({}));
        const { prompt, size = '512x512', steps = 30, n = 1 } = body;
        const sfResponse = await fetch('https://api.siliconflow.cn/v1/images/generations', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model: 'black-forest-labs/FLUX.1-schnell', prompt, size, steps, n }),
            signal: AbortSignal.timeout(28000) // 保持28秒超时，确保在Serverless Function的30秒限制内
        });
        // 4. 处理 API 响应（包括 429 错误）
        if (!sfResponse.ok) {
            // 标记 429 错误以便前端调试
            const status = sfResponse.status;
            const statusText = sfResponse.statusText;
            const warning = status === 429
                ? `Image generation failed with status ${status} (Rate Limit Exceeded).`
                : `Image generation failed with status ${status} (${statusText}).`;
            try {
                const sfError = await sfResponse.json().catch(() => ({}));
                return withCORSHeaders(new node_fetch_1.Response(JSON.stringify({
                    error: sfError.error || { message: warning },
                    rateLimited: status === 429,
                    warning: warning
                }), { status: status, headers: { 'Content-Type': 'application/json' } }));
            }
            catch (e) {
                return withCORSHeaders(new node_fetch_1.Response(JSON.stringify({
                    error: { message: warning },
                    rateLimited: status === 429,
                    warning: warning
                }), { status: status, headers: { 'Content-Type': 'application/json' } }));
            }
        }
        const sf = await sfResponse.json();
        const url = sf.data?.[0]?.url;
        if (!url) {
            return withCORSHeaders(new node_fetch_1.Response(JSON.stringify({ error: 'Gen failed: Image URL not found in response.' }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
        }
        // 5. 成功响应中添加 CORS 头
        const successResponse = new node_fetch_1.Response(JSON.stringify({
            data: [
                { url, prompt, size, steps, n }
            ]
        }), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, immutable' }
        });
        return withCORSHeaders(successResponse);
    }
    catch (error) {
        console.error('Image API Error:', error);
        // 6. 内部错误响应中添加 CORS 头
        return withCORSHeaders(new node_fetch_1.Response(JSON.stringify({
            error: 'Internal Serverless Error during image generation.',
            warning: 'Failed to generate image due to internal error.'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
    }
}

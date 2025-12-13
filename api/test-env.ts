// 环境变量测试API
// 用于验证环境变量是否正确配置和传递

export const config = { runtime: 'edge' };

// 导入Response构造函数
import { Response } from 'node-fetch';

// 1. 定义 CORS 头部
// 本地测试时使用通配符，生产环境请替换为您网站的实际域名 (含 https://)
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    // 确保包含所有请求中使用的自定义头
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
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

// 处理 OPTIONS 请求（预检请求）
export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
    try {
        // 测试硅基流动API密钥
        const siliconFlowKeys = {
            SILICONFLOW_API_KEY: process.env.SILICONFLOW_API_KEY,
            SILICON_FLOW_KEY: process.env.SILICON_FLOW_KEY,
            SF_KEY: process.env.SF_KEY,
        };

        // 测试其他API密钥
        const otherKeys = {
            API_KEY: process.env.API_KEY,
        };

        // 检查密钥是否存在
        const hasSiliconFlowKeys = Object.values(siliconFlowKeys).some(key => key && key !== 'your_silicon_flow_api_key_here');
        const hasOtherKeys = Object.values(otherKeys).some(key => key);

        const response = new Response(
            JSON.stringify({
                success: true,
                message: '环境变量测试成功',
                timestamp: new Date().toISOString(),
                environment: {
                    NODE_ENV: process.env.NODE_ENV,
                    RUNTIME: 'edge',
                },
                keys: {
                    siliconFlowKeys: Object.fromEntries(
                        Object.entries(siliconFlowKeys).map(([key, value]) => [
                            key,
                            value ? `${value.substring(0, 4)}••••••${value.substring(value.length - 4)}` : null
                        ])
                    ),
                    otherKeys: Object.fromEntries(
                        Object.entries(otherKeys).map(([key, value]) => [
                            key,
                            value ? `${value.substring(0, 4)}••••••${value.substring(value.length - 4)}` : null
                        ])
                    ),
                },
                hasKeys: {
                    hasSiliconFlowKeys,
                    hasOtherKeys,
                },
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        // 添加 CORS 头
        return withCORSHeaders(response);
    } catch (error) {
        console.error('Environment test error:', error);
        const errorResponse = new Response(
            JSON.stringify({
                success: false,
                message: '环境变量测试失败',
                error: error instanceof Error ? error.message : '未知错误',
                warning: 'Failed to test environment variables due to internal error.'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        // 添加 CORS 头
        return withCORSHeaders(errorResponse);
    }
}
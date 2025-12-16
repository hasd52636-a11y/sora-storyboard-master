// 测试智谱图像API的脚本
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

// 读取环境变量中的API密钥
const API_KEY = process.env.ZIPPU_API_KEY || '';

// 测试参数
const testParams = {
    model: 'cogview-3',
    prompt: 'A beautiful sunset over the mountains',
    size: '512x512',
    user_id: 'test-user'
};

// 智谱API端点
const API_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/images/generations';

async function testZhipuImageAPI() {
    console.log('=== 智谱图像API测试 ===');
    console.log('API密钥:', API_KEY ? '已配置' : '未配置');
    console.log('测试参数:', JSON.stringify(testParams, null, 2));
    console.log('API端点:', API_ENDPOINT);
    console.log('=====================');

    if (!API_KEY) {
        console.error('错误: 未配置Zhipu API密钥 (ZHIPU_API_KEY)');
        console.error('请在.env文件中添加ZHIPU_API_KEY=your_api_key');
        return;
    }

    try {
        console.log('发送请求...');
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(testParams),
            timeout: 30000 // 30秒超时
        });

        console.log('响应状态:', response.status, response.statusText);
        console.log('响应头:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

        const responseBody = await response.text();
        console.log('响应内容:', responseBody);

        if (!response.ok) {
            console.error('请求失败!');
            try {
                const errorData = JSON.parse(responseBody);
                console.error('错误详情:', JSON.stringify(errorData, null, 2));
                
                // 常见错误原因分析
                if (response.status === 401) {
                    console.error('可能原因: API密钥错误或已过期');
                } else if (response.status === 403) {
                    console.error('可能原因: 权限不足或API密钥未启用图像生成服务');
                } else if (response.status === 404) {
                    console.error('可能原因: API端点错误');
                } else if (response.status === 429) {
                    console.error('可能原因: 请求频率过高');
                } else if (response.status === 500) {
                    console.error('可能原因: 服务器内部错误');
                }
            } catch (parseError) {
                console.error('无法解析错误响应:', parseError.message);
                console.error('原始错误响应:', responseBody);
            }
            return;
        }

        // 解析成功响应
        try {
            const data = JSON.parse(responseBody);
            console.log('请求成功!');
            console.log('响应数据:', JSON.stringify(data, null, 2));
            
            if (data.data && data.data[0]) {
                const image = data.data[0];
                if (image.url) {
                    console.log('生成的图片URL:', image.url);
                } else if (image.b64_json) {
                    console.log('生成的图片Base64长度:', image.b64_json.length);
                }
            }
        } catch (parseError) {
            console.error('无法解析响应:', parseError.message);
            console.error('原始响应:', responseBody);
        }

    } catch (error) {
        console.error('网络请求错误:', error.message);
        console.error('错误详情:', error);
        
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            console.error('可能原因: 网络连接超时或服务器响应慢');
        } else if (error.code === 'ENOTFOUND') {
            console.error('可能原因: API端点无法访问或网络连接问题');
        }
    }
}

// 运行测试
testZhipuImageAPI();

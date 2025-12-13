import fetch from 'node-fetch';

/**
 * 速创图片API测试脚本
 * NanoBanana模型 - 谷歌最新图片生成API
 * 
 * 接口文档信息：
 * - 接口地址：https://api.wuyinkeji.com/api/img/nanoBanana
 * - 请求方式：POST
 * - 认证方式：Authorization头
 * - 请求格式：application/json
 * - 模型名称：nano-banana
 * - 价格：0.2元/次
 * - 限制：1秒300次
 * 
 * 使用方法：
 * 1. 安装依赖：npm install node-fetch
 * 2. 在CONFIG.apiKey中填入实际的API密钥
 * 3. 运行脚本：node test-sucreative-image-api.js
 */

// 配置参数
const CONFIG = {
    baseUrl: 'https://api.wuyinkeji.com',
    endpoint: '/api/img/nanoBanana',
    model: 'nano-banana', // 根据API文档更新为正确的模型名称
    apiKey: 'YOUR_API_KEY_HERE', // 请将此替换为实际的API密钥
    timeout: 30000 // 30秒超时
};

// 测试1: 基础图片API调用
async function testBasicImageApi() {
    console.log('=== 测试1: 基础图片API调用 (POST) ===');
    
    try {
        // 构建请求体
        const requestBody = {
            model: CONFIG.model,
            prompt: 'create a 1/7 scale commercialized figurine in a realistic style',
            aspectRatio: '1:1'
        };
        
        // 构建完整URL
        const url = `${CONFIG.baseUrl}${CONFIG.endpoint}`;
        
        console.log('请求URL:', url);
        console.log('请求头:', {
            'Content-Type': 'application/json;charset:utf-8;',
            'Authorization': CONFIG.apiKey
        });
        console.log('请求体:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            timeout: CONFIG.timeout,
            headers: {
                'Content-Type': 'application/json;charset:utf-8;',
                'Authorization': CONFIG.apiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        const responseText = await response.text();
        console.log('响应状态码:', response.status);
        
        // 尝试解析JSON
        try {
            const data = JSON.parse(responseText);
            console.log('响应数据:', JSON.stringify(data, null, 2));
            return data.code === 200;
        } catch (jsonError) {
            console.log('响应内容（非JSON）:', responseText);
            return false;
        }
        
    } catch (error) {
        console.error('测试失败:', error.message);
        return false;
    }
}

// 测试2: 带图片URL的API调用
async function testPostImageApi() {
    console.log('\n=== 测试2: 带图片URL的API调用 (POST) ===');
    
    try {
        // 构建请求体
        const requestBody = {
            model: CONFIG.model,
            prompt: 'create a 1/7 scale commercialized figurine of the character in the picture',
            aspectRatio: '16:9',
            img_url: ["https://r2.styleai.art/4bd93796-518a-48b3-aea7-f55cf4d4f0d5.jpeg"]
        };
        
        // 构建完整URL
        const url = `${CONFIG.baseUrl}${CONFIG.endpoint}`;
        
        console.log('请求URL:', url);
        console.log('请求头:', {
            'Content-Type': 'application/json;charset:utf-8;',
            'Authorization': CONFIG.apiKey
        });
        console.log('请求体:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            timeout: CONFIG.timeout,
            headers: {
                'Content-Type': 'application/json;charset:utf-8;',
                'Authorization': CONFIG.apiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        const responseText = await response.text();
        console.log('响应状态码:', response.status);
        
        // 尝试解析JSON
        try {
            const data = JSON.parse(responseText);
            console.log('响应数据:', JSON.stringify(data, null, 2));
            return data.code === 200;
        } catch (jsonError) {
            console.log('响应内容（非JSON）:', responseText);
            return false;
        }
        
    } catch (error) {
        console.error('测试失败:', error.message);
        return false;
    }
}

// 测试3: 使用不同输出比例的API调用
async function testImageWithUrl() {
    console.log('\n=== 测试3: 使用不同输出比例的API调用 (POST) ===');
    
    try {
        // 构建请求体
        const requestBody = {
            model: CONFIG.model,
            prompt: 'create a landscape photography of mountains and lake',
            aspectRatio: '16:9' // 使用宽屏比例
        };
        
        // 构建完整URL
        const url = `${CONFIG.baseUrl}${CONFIG.endpoint}`;
        
        console.log('请求URL:', url);
        console.log('请求头:', {
            'Content-Type': 'application/json;charset:utf-8;',
            'Authorization': CONFIG.apiKey
        });
        console.log('请求体:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            timeout: CONFIG.timeout,
            headers: {
                'Content-Type': 'application/json;charset:utf-8;',
                'Authorization': CONFIG.apiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        const responseText = await response.text();
        console.log('响应状态码:', response.status);
        
        // 尝试解析JSON
        try {
            const data = JSON.parse(responseText);
            console.log('响应数据:', JSON.stringify(data, null, 2));
            return data.code === 200;
        } catch (jsonError) {
            console.log('响应内容（非JSON）:', responseText);
            return false;
        }
        
    } catch (error) {
        console.error('测试失败:', error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('开始测试速创NanoBanana图片API...');
    console.log('配置信息:', JSON.stringify(CONFIG, null, 2));
    console.log('='.repeat(50));
    
    // 运行测试
    const results = {
        basicGet: await testBasicImageApi(),
        basicPost: await testPostImageApi(),
        imageWithUrl: await testImageWithUrl()
    };
    
    // 输出测试总结
    console.log('\n' + '='.repeat(50));
    console.log('测试总结:');
    console.log('- 基础图片生成:', results.basicGet ? '✅ 成功' : '❌ 失败');
    console.log('- 带参考图片生成:', results.basicPost ? '✅ 成功' : '❌ 失败');
    console.log('- 宽屏比例生成:', results.imageWithUrl ? '✅ 成功' : '❌ 失败');
    
    // 检查是否有成功的测试
    const hasSuccess = Object.values(results).some(r => r);
    console.log('\n总体结果:', hasSuccess ? '✅ 至少有一个测试成功' : '❌ 所有测试失败');
    
    if (!hasSuccess) {
        console.log('\n可能的原因:');
        console.log('1. API密钥不正确或已过期');
        console.log('2. 网络连接问题');
        console.log('3. API参数错误');
        console.log('4. API服务暂时不可用');
        console.log('\n请检查配置并重试。');
    }
}

// 运行测试
runTests().catch(console.error);

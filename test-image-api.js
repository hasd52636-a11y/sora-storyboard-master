// 测试图像生成API
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

// 加载.env文件
dotenv.config({
  path: path.resolve('.env')
});

console.log('=== 图像生成API测试 ===');

// 配置测试参数 - 智谱
const zhipuConfig = {
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  model: 'cogview-3-flash',
  prompt: '山水风景图，水墨画风格',
  size: '512x512',
  apiKey: process.env.ZIPPU_API_KEY || ''
};

// 配置测试参数 - 速创
const sucreativeConfig = {
  baseUrl: 'https://api.wuyinkeji.com/api/img',
  model: 'nano-banana',
  prompt: '山水风景图，水墨画风格',
  size: '512x512',
  apiKey: process.env.SUCREATIVE_API_KEY || ''
};

// 选择要测试的API
const testConfig = sucreativeConfig; // 可以切换为 zhipuConfig

async function testImageApi() {
  console.log('测试配置:');
  console.log('Base URL:', testConfig.baseUrl);
  console.log('Model:', testConfig.model);
  console.log('Prompt:', testConfig.prompt);
  console.log('Size:', testConfig.size);
  console.log('API Key:', testConfig.apiKey ? '已配置' : '未配置');
  
  try {
    // 构建请求体
    let requestBody;
    let endpoint;
    
    // 检查是否为智谱API
    const isZhipuApi = testConfig.baseUrl.includes('bigmodel.cn');
    // 检查是否为速创API
    const isSucreativeApi = testConfig.baseUrl.includes('wuyinkeji.com');
    
    if (isZhipuApi) {
      // 智谱API特殊处理
      requestBody = {
        model: testConfig.model,
        prompt: testConfig.prompt,
        size: testConfig.size,
        user_id: 'storyboard-user'
      };
      endpoint = `${testConfig.baseUrl}/images/generations`;
    } else if (isSucreativeApi) {
      // 速创API特殊处理
      requestBody = {
        model: testConfig.model,
        prompt: testConfig.prompt,
        size: testConfig.size
      };
      endpoint = testConfig.baseUrl;
    } else {
      // 默认API处理
      requestBody = {
        model: testConfig.model,
        prompt: testConfig.prompt,
        size: testConfig.size
      };
      endpoint = `${testConfig.baseUrl}/images/generations`;
    }
    
    console.log('\n正在发送请求...');
    console.log('请求端点:', endpoint);
    console.log('请求参数:', JSON.stringify(requestBody, null, 2));
    
    // 发送测试请求
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testConfig.apiKey}`
      },
      body: JSON.stringify(requestBody),
      timeout: 30000
    });
    
    console.log('响应状态码:', response.status);
    
    // 解析响应
    const responseData = await response.json();
    console.log('响应数据:', JSON.stringify(responseData, null, 2));
    
    // 检查响应结果
    if (response.ok && responseData.data && responseData.data.length > 0) {
      console.log('\n✅ 图像生成API功能正常');
      console.log('生成的图像URL:', responseData.data[0].url || 'N/A');
      return true;
    } else {
      console.log('\n❌ 图像生成API功能异常');
      console.log('错误信息:', responseData.error?.message || '未知错误');
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ API调用失败');
    console.log('错误详情:', error.message);
    return false;
  }
}

// 运行测试
testImageApi().then(success => {
  console.log('\n=== 测试完成 ===');
  console.log('总体结果:', success ? '✅ 通过' : '❌ 失败');
  
  if (!success) {
    console.log('\n可能的原因:');
    console.log('1. API密钥不正确或已过期');
    console.log('2. 网络连接问题');
    console.log('3. API服务暂时不可用');
    console.log('4. 请求参数错误');
  }
});
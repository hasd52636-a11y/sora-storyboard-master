// 测试智谱图像生成API的修改是否正确
import fetch from 'node-fetch';

async function testZhipuImageApi() {
  console.log('=== 测试智谱图像生成API修改 ===\n');
  
  // 测试配置
  const testConfig = {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'cogview-4-250304',
    apiKey: 'your-api-key-here' // 请替换为真实的API密钥
  };
  
  // 测试提示词
  const prompt = '一只可爱的小猫咪，坐在草地上，阳光明媚';
  
  try {
    // 1. 测试前端直接调用智谱API（模拟生产环境）
    console.log('1. 测试前端直接调用智谱API（模拟生产环境）');
    const productionUrl = `${testConfig.baseUrl}/paas/v4/images/generations`;
    
    const productionResponse = await fetch(productionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testConfig.apiKey}`
      },
      body: JSON.stringify({
        model: testConfig.model,
        prompt: prompt,
        size: '1024x1024',
        user_id: 'storyboard-user',
        quality: 'standard',
        watermark_enabled: false
      })
    });
    
    const productionData = await productionResponse.json();
    console.log('生产环境响应:', JSON.stringify(productionData, null, 2));
    
    // 2. 测试通过后端API调用智谱API（模拟开发环境）
    console.log('\n2. 测试通过后端API调用智谱API（模拟开发环境）');
    const backendUrl = 'http://localhost:3000/api/ai/image';
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sf-key': testConfig.apiKey
      },
      body: JSON.stringify({
        prompt: prompt,
        size: '1024x1024',
        apiConfig: {
          baseUrl: testConfig.baseUrl,
          defaultModel: testConfig.model
        }
      })
    });
    
    const backendData = await backendResponse.json();
    console.log('后端API响应:', JSON.stringify(backendData, null, 2));
    
    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testZhipuImageApi();
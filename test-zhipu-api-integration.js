// 测试智谱AI图像生成API集成
const fetch = require('node-fetch');

// 替换为实际的API密钥
const API_KEY = '<your-api-key>';
const USER_ID = '<your-user-id>';

async function testZhipuImageAPI() {
  console.log('测试智谱AI图像生成API...');
  
  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "model": "cogview-4-250304",
        "prompt": "一只可爱的小猫咪",
        "quality": "standard",
        "size": "1024x1024",
        "watermark_enabled": true,
        "user_id": USER_ID
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API请求失败:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('API响应成功:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data[0]) {
      console.log('\n生成的图像URL:', data.data[0].url);
      console.log('\n测试成功！');
    }
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testZhipuImageAPI();